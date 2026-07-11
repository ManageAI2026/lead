/**
 * Stage 4 — enrich. Per person:
 *   1. If email is missing, guessEmail() as a FREE pattern (marked as a guess so
 *      verify/delivery can gate it out).
 *   2. Run FREE registry adapters relevant to the vertical (NPI is a real public
 *      API; SAM is key-guarded).
 *   3. If the run profile allows paid providers AND a valid SourceKey exists AND
 *      best confidence is still below the org threshold, walk the paid waterfall
 *      (Hunter → Apollo → PDL …) via the PaidGate, stopping once we clear the bar.
 */

import { guessEmail } from '@lead/core';
import { FREE_ENRICH, PAID_ENRICH, PaidGate } from '../registry.js';
import type { EnrichCtx, Person, Spend } from '../adapters/types.js';
import type { Log } from '../log.js';
import { cfg } from '../config.js';

export interface EnrichDeps {
  domain: string;
  vertical: string | null;
  companyName: string | null;
  gate: PaidGate;
  spend: (s: Spend) => void;
  log: Log;
}

export interface EnrichResult {
  people: Person[];
  /** True if any paid adapter actually fired (drives target activity_kind). */
  paidFired: boolean;
}

function bestConfidence(p: Person): number {
  return p.sources.reduce((acc, s) => (s.confidence > acc ? s.confidence : acc), 0);
}

export async function runEnrich(people: Person[], deps: EnrichDeps): Promise<EnrichResult> {
  const { log, gate } = deps;
  let paidFired = false;

  for (const person of people) {
    const ctx: EnrichCtx = {
      log,
      domain: deps.domain,
      vertical: deps.vertical,
      companyName: deps.companyName,
      spend: deps.spend,
    };

    // 1. Free pattern guess when we have no email at all.
    if (!person.email) {
      const guess = guessEmail(person.name, deps.domain);
      if (guess) {
        person.email = guess;
        person.sources.push({ provider: 'guess', method: 'pattern', confidence: 0.4 });
        deps.spend({ provider: 'guess', kind: 'free', spend: 0, calls: 1 });
      }
    }

    // 2. Free registry adapters.
    for (const adapter of FREE_ENRICH) {
      const updated = await adapter.enrich(person, ctx);
      if (updated) mergeInto(person, updated);
    }

    // 3. Paid waterfall — only below threshold, gated per provider.
    for (const provider of gate.paidWaterfall()) {
      const conf = bestConfidence(person);
      if (conf >= cfg.paidThreshold) break;
      const decision = gate.canFire(provider, conf);
      if (!decision.allowed) {
        log.debug(`paid gate blocked ${provider}: ${decision.reason}`);
        continue;
      }
      const adapter = PAID_ENRICH[provider];
      const updated = await adapter.enrich(person, ctx);
      gate.record(provider, decision.cost);
      paidFired = true;
      if (updated) mergeInto(person, updated);
    }
  }

  return { people, paidFired };
}

/** Merge an adapter's returned person back into the working person in place. */
function mergeInto(target: Person, src: Person): void {
  if (src.email && (!target.email || isGuess(target))) target.email = src.email;
  if (src.phone && !target.phone) target.phone = src.phone;
  if (src.title && src.title.length > target.title.length) target.title = src.title;
  // Append any new sources.
  for (const s of src.sources) {
    if (!target.sources.some((t) => t.provider === s.provider && t.method === s.method)) {
      target.sources.push(s);
    }
  }
}

function isGuess(p: Person): boolean {
  return p.sources.every((s) => s.provider === 'guess' || s.method === 'pattern');
}
