/**
 * Adapter registry + paid gate.
 *
 * Maps provider name → adapter and decides, per target, whether a PAID adapter
 * is allowed to fire. The gate enforces, in order:
 *   1. Run profile — is this provider in the profile's `paidProviders` list?
 *   2. A valid, enabled SourceKey exists for the org.
 *   3. Confidence is still below the paid threshold (free-first).
 *   4. Budget cap not exceeded (cap - used covers the next call's cost).
 *
 * Free/builtin/gov adapters bypass the gate (always allowed if their env is
 * present). The gate accrues spend so repeated calls respect the remaining cap.
 */

import type { RunProfileId, SourceKey } from '@lead/core';
import { RUN_PROFILES, parseCost, providerByName } from '@lead/core';
import { cfg } from './config.js';
import type { Log } from './log.js';

// Free / registry adapters
import { registryNpi } from './adapters/registry/npi.js';
import { registrySam } from './adapters/registry/sam.js';
// Paid enrich adapters
import { enrichHunter } from './adapters/enrich/hunter.js';
import { enrichApollo } from './adapters/enrich/apollo.js';
import { enrichPdl } from './adapters/enrich/pdl.js';
import type { EnrichAdapter } from './adapters/types.js';

/** Free-first enrichment adapters, always allowed (respect their own key checks). */
export const FREE_ENRICH: EnrichAdapter[] = [registryNpi, registrySam];

/** Paid enrichment adapters, keyed by provider name (as in PROVIDER_CATALOG). */
export const PAID_ENRICH: Record<string, EnrichAdapter> = {
  Hunter: enrichHunter,
  Apollo: enrichApollo,
  PDL: enrichPdl,
};

export interface GateDecision {
  allowed: boolean;
  reason: string;
  cost: number;
}

export class PaidGate {
  private keys = new Map<string, SourceKey>();
  private accrued = new Map<string, number>();

  constructor(
    private profile: RunProfileId,
    sourceKeys: SourceKey[],
    private log: Log
  ) {
    for (const k of sourceKeys) this.keys.set(k.provider, k);
  }

  /** Provider names the run profile permits for the paid waterfall, in order. */
  paidWaterfall(): string[] {
    return RUN_PROFILES[this.profile].paidProviders.filter((name) => PAID_ENRICH[name]);
  }

  private costOf(provider: string): number {
    // Person-enrichment cost; fall back to the finder cost for Hunter.
    const def =
      providerByName(provider) ??
      providerByName(provider === 'PDL' ? 'PDL Person' : provider);
    return parseCost(def?.cost);
  }

  /**
   * Decide whether `provider` may fire given the current best confidence.
   * `confidence` is the strongest evidence gathered so far (0..1).
   */
  canFire(provider: string, confidence: number): GateDecision {
    const cost = this.costOf(provider);
    if (!RUN_PROFILES[this.profile].paid) {
      return { allowed: false, reason: `profile ${this.profile} is free-only`, cost };
    }
    if (!RUN_PROFILES[this.profile].paidProviders.includes(provider)) {
      return { allowed: false, reason: `${provider} not in profile ${this.profile}`, cost };
    }
    if (confidence >= cfg.paidThreshold) {
      return {
        allowed: false,
        reason: `confidence ${confidence.toFixed(2)} ≥ threshold ${cfg.paidThreshold}`,
        cost,
      };
    }
    const key = this.keys.get(provider);
    if (!key) {
      return { allowed: false, reason: `no SourceKey for ${provider}`, cost };
    }
    if (key.status !== 'valid' || !key.enabled) {
      return { allowed: false, reason: `SourceKey ${provider} status=${key.status} enabled=${key.enabled}`, cost };
    }
    if (key.budgetCap != null) {
      const used = key.budgetUsed + (this.accrued.get(provider) ?? 0);
      if (used + cost > key.budgetCap) {
        return { allowed: false, reason: `${provider} budget cap reached ($${used.toFixed(2)}/$${key.budgetCap})`, cost };
      }
    }
    return { allowed: true, reason: 'ok', cost };
  }

  /** Record that a paid call was made so budget accounting stays accurate. */
  record(provider: string, cost: number): void {
    this.accrued.set(provider, (this.accrued.get(provider) ?? 0) + cost);
  }
}
