/**
 * NeverBounce single-check verifier — REAL HTTP, key-guarded (paid).
 *
 * https://api.neverbounce.com/v4/single/check — deep verification with catch-all
 * detection. Fires only when NEVERBOUNCE_API_KEY is set AND the paid gate
 * permits it. Returns null without a key so MX/SMTP remains the free default.
 * $0.008/email to ledger.
 */

import { cfg } from '../../config.js';
import { parseCost, providerByName } from '@lead/core';
import type { VerifyAdapter, VerifyOutcome } from '../types.js';
import type { Log } from '../../log.js';

const API = 'https://api.neverbounce.com/v4/single/check';
const COST = parseCost(providerByName('NeverBounce')?.cost);

interface NbResponse {
  status?: string;
  result?: string; // 'valid' | 'invalid' | 'disposable' | 'catchall' | 'unknown'
  flags?: string[];
}

export const verifyNeverBounce: VerifyAdapter = {
  provider: 'NeverBounce',
  kind: 'paid',
  available: () => Boolean(cfg.neverbounceKey),

  async verify(email: string, log: Log): Promise<VerifyOutcome | null> {
    if (!cfg.neverbounceKey) {
      log.path('skipped', 'no NEVERBOUNCE_API_KEY');
      return null;
    }
    const url = new URL(API);
    url.searchParams.set('key', cfg.neverbounceKey);
    url.searchParams.set('email', email);
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) {
        log.warn(`NeverBounce ${res.status}`);
        return null;
      }
      const json = (await res.json()) as NbResponse;
      const result = json.result ?? 'unknown';
      const catchAll = result === 'catchall';
      const accepted = result === 'valid';
      log.path('live', `NeverBounce ${email} → ${result}`);
      return {
        email,
        mxFound: result !== 'invalid',
        accepted,
        catchAll,
        provider: 'neverbounce',
        method: 'api',
        confidence: accepted ? 0.97 : catchAll ? 0.55 : result === 'invalid' ? 0.15 : 0.5,
      };
    } catch (err) {
      log.warn('NeverBounce failed', err instanceof Error ? err.message : err);
      return null;
    }
  },
};

/** Cost accessor so the verify stage can accrue to the ledger. */
export const NEVERBOUNCE_COST = COST;
