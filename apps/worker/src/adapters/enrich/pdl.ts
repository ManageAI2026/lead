/**
 * People Data Labs (PDL) Person Enrich adapter — REAL HTTP, key-guarded (paid).
 *
 * https://api.peopledatalabs.com/v5/person/enrich — role history + work email
 * for a named person at a company domain. Fires only when PDL_API_KEY is set AND
 * the paid gate permits it. Returns null without a key. $0.08/enrich to ledger.
 */

import { cfg } from '../../config.js';
import { parseCost, providerByName } from '@lead/core';
import type { EnrichAdapter, EnrichCtx, Person } from '../types.js';

const API = 'https://api.peopledatalabs.com/v5/person/enrich';
const COST = parseCost(providerByName('PDL Person')?.cost);

interface PdlResponse {
  status?: number;
  likelihood?: number;
  data?: {
    work_email?: string | null;
    job_title?: string | null;
    mobile_phone?: string | null;
    phone_numbers?: string[];
  };
}

export const enrichPdl: EnrichAdapter = {
  provider: 'PDL',
  kind: 'paid',
  available: () => Boolean(cfg.pdlKey),

  async enrich(person: Person, ctx: EnrichCtx): Promise<Person | null> {
    if (!cfg.pdlKey) {
      ctx.log.path('skipped', 'no PDL_API_KEY');
      return null;
    }
    const url = new URL(API);
    url.searchParams.set('name', person.name);
    url.searchParams.set('company', ctx.companyName ?? ctx.domain);
    url.searchParams.set('min_likelihood', '6');
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'X-Api-Key': cfg.pdlKey },
        signal: AbortSignal.timeout(12000),
      });
      ctx.spend({ provider: 'PDL', kind: 'paid', spend: COST, calls: 1 });
      if (res.status === 404) {
        ctx.log.path('live', `PDL no match for ${person.name}`);
        return null;
      }
      if (!res.ok) {
        ctx.log.warn(`PDL ${res.status}`);
        return null;
      }
      const json = (await res.json()) as PdlResponse;
      const d = json.data;
      if (!d) return null;
      const updated: Person = { ...person, sources: [...person.sources] };
      const email = d.work_email?.toLowerCase() ?? null;
      const like = (json.likelihood ?? 6) / 10; // 0..1
      if (email) {
        updated.email = email;
        updated.sources.push({
          provider: 'pdl',
          method: 'api',
          confidence: Math.max(0.6, Math.min(0.95, like)),
        });
      }
      if (d.job_title && !updated.title) updated.title = d.job_title;
      const phone = d.mobile_phone ?? d.phone_numbers?.[0];
      if (!updated.phone && phone) updated.phone = phone;
      ctx.log.path('live', `PDL enriched ${person.name} (likelihood ${json.likelihood ?? '?'})`);
      return updated;
    } catch (err) {
      ctx.log.warn('PDL failed', err instanceof Error ? err.message : err);
      return null;
    }
  },
};
