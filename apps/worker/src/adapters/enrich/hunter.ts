/**
 * Hunter.io Email Finder adapter — REAL HTTP, key-guarded (paid).
 *
 * https://api.hunter.io/v2/email-finder — given a domain + full name, returns
 * the most likely email and a confidence score. Fires only when HUNTER_API_KEY
 * is set AND the paid gate (run profile + valid SourceKey + budget) permits it.
 * Returns null without a key. Cost accrues to the ledger at $0.04/lookup.
 */

import { cfg } from '../../config.js';
import { parseCost, providerByName } from '@lead/core';
import type { EnrichAdapter, EnrichCtx, Person } from '../types.js';

const API = 'https://api.hunter.io/v2/email-finder';
const COST = parseCost(providerByName('Hunter')?.cost);

interface HunterResponse {
  data?: { email?: string | null; score?: number | null; phone_number?: string | null };
  errors?: Array<{ details?: string }>;
}

export const enrichHunter: EnrichAdapter = {
  provider: 'Hunter',
  kind: 'paid',
  available: () => Boolean(cfg.hunterKey),

  async enrich(person: Person, ctx: EnrichCtx): Promise<Person | null> {
    if (!cfg.hunterKey) {
      ctx.log.path('skipped', 'no HUNTER_API_KEY');
      return null;
    }
    const parts = person.name.trim().split(/\s+/);
    const first = parts[0];
    const last = parts[parts.length - 1];
    const url = new URL(API);
    url.searchParams.set('domain', ctx.domain);
    url.searchParams.set('first_name', first);
    url.searchParams.set('last_name', last);
    url.searchParams.set('api_key', cfg.hunterKey);
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(12000),
      });
      ctx.spend({ provider: 'Hunter', kind: 'paid', spend: COST, calls: 1 });
      if (!res.ok) {
        ctx.log.warn(`Hunter ${res.status}`);
        return null;
      }
      const json = (await res.json()) as HunterResponse;
      const email = json.data?.email?.toLowerCase() ?? null;
      if (!email) {
        ctx.log.path('live', `Hunter no email for ${first} ${last}@${ctx.domain}`);
        return null;
      }
      const score = (json.data?.score ?? 0) / 100; // Hunter score is 0..100
      const updated: Person = { ...person, sources: [...person.sources] };
      updated.email = email;
      updated.sources.push({
        provider: 'hunter',
        method: 'api',
        confidence: Math.max(0.5, Math.min(0.99, score || 0.8)),
      });
      if (!updated.phone && json.data?.phone_number) updated.phone = json.data.phone_number;
      ctx.log.path('live', `Hunter found ${email} (score ${json.data?.score ?? '?'})`);
      return updated;
    } catch (err) {
      ctx.log.warn('Hunter failed', err instanceof Error ? err.message : err);
      return null;
    }
  },
};
