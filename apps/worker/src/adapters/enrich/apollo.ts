/**
 * Apollo People Match adapter — REAL HTTP, key-guarded (paid).
 *
 * https://api.apollo.io/v1/people/match — matches a named person at a domain to
 * a verified role, email, and phone. Fires only when APOLLO_API_KEY is set AND
 * the paid gate permits it. Returns null without a key. $0.03/match to ledger.
 */

import { cfg } from '../../config.js';
import { parseCost, providerByName } from '@lead/core';
import type { EnrichAdapter, EnrichCtx, Person } from '../types.js';

const API = 'https://api.apollo.io/v1/people/match';
const COST = parseCost(providerByName('Apollo')?.cost);

interface ApolloResponse {
  person?: {
    email?: string | null;
    email_status?: string | null;
    title?: string | null;
    phone_numbers?: Array<{ raw_number?: string }>;
    organization?: { name?: string };
  };
}

export const enrichApollo: EnrichAdapter = {
  provider: 'Apollo',
  kind: 'paid',
  available: () => Boolean(cfg.apolloKey),

  async enrich(person: Person, ctx: EnrichCtx): Promise<Person | null> {
    if (!cfg.apolloKey) {
      ctx.log.path('skipped', 'no APOLLO_API_KEY');
      return null;
    }
    const parts = person.name.trim().split(/\s+/);
    const body = {
      first_name: parts[0],
      last_name: parts[parts.length - 1],
      domain: ctx.domain,
      reveal_personal_emails: false,
    };
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Api-Key': cfg.apolloKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(12000),
      });
      ctx.spend({ provider: 'Apollo', kind: 'paid', spend: COST, calls: 1 });
      if (!res.ok) {
        ctx.log.warn(`Apollo ${res.status}`);
        return null;
      }
      const json = (await res.json()) as ApolloResponse;
      const p = json.person;
      if (!p) {
        ctx.log.path('live', `Apollo no match for ${person.name}@${ctx.domain}`);
        return null;
      }
      const updated: Person = { ...person, sources: [...person.sources] };
      const email = p.email?.toLowerCase() ?? null;
      if (email) {
        updated.email = email;
        // 'verified' email_status is high confidence; guessed is lower.
        const conf = p.email_status === 'verified' ? 0.95 : 0.75;
        updated.sources.push({ provider: 'apollo', method: 'api', confidence: conf });
      } else {
        updated.sources.push({ provider: 'apollo', method: 'api', confidence: 0.6 });
      }
      if (p.title && !updated.title) updated.title = p.title;
      const phone = p.phone_numbers?.find((n) => n.raw_number)?.raw_number;
      if (!updated.phone && phone) updated.phone = phone;
      ctx.log.path('live', `Apollo matched ${person.name} (${email ?? 'no email'})`);
      return updated;
    } catch (err) {
      ctx.log.warn('Apollo failed', err instanceof Error ? err.message : err);
      return null;
    }
  },
};
