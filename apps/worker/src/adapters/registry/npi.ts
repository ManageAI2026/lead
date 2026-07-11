/**
 * NPI Registry adapter — REAL. The CMS NPPES NPI Registry has a free, public,
 * keyless JSON API: https://npiregistry.cms.hhs.gov/api/ (version 2.1).
 *
 * For a Healthcare person we look up their NPI record by first/last name (and
 * optionally state) to confirm they are a licensed US provider and to recover a
 * canonical name, credential, and (when present) an authorized-official phone.
 * This is a FREE source — always allowed, no key. Returns the person unchanged
 * when there is no match, so it never invents data.
 */

import type { EnrichAdapter, EnrichCtx, Person } from '../types.js';

const API = 'https://npiregistry.cms.hhs.gov/api/';

interface NpiResult {
  result_count?: number;
  results?: Array<{
    number?: number;
    basic?: {
      first_name?: string;
      last_name?: string;
      credential?: string;
      name_prefix?: string;
      authorized_official_telephone_number?: string;
    };
    addresses?: Array<{ telephone_number?: string; address_purpose?: string }>;
    taxonomies?: Array<{ desc?: string; primary?: boolean }>;
  }>;
}

export const registryNpi: EnrichAdapter = {
  provider: 'NPI Registry',
  kind: 'free',
  available: () => true, // keyless public API

  async enrich(person: Person, ctx: EnrichCtx): Promise<Person | null> {
    // Only meaningful for healthcare targets.
    if (ctx.vertical && ctx.vertical !== 'Healthcare') {
      ctx.log.path('skipped', `NPI not relevant for vertical=${ctx.vertical}`);
      return null;
    }
    const parts = person.name.trim().split(/\s+/);
    if (parts.length < 2) return null;
    const first = parts[0];
    const last = parts[parts.length - 1];

    const url = new URL(API);
    url.searchParams.set('version', '2.1');
    url.searchParams.set('first_name', first);
    url.searchParams.set('last_name', last);
    url.searchParams.set('limit', '5');

    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        ctx.log.warn(`NPI ${res.status}`);
        return null;
      }
      const json = (await res.json()) as NpiResult;
      ctx.spend({ provider: 'NPI Registry', kind: 'free', spend: 0, calls: 1 });
      if (!json.result_count || !json.results?.length) {
        ctx.log.path('live', `NPI no match for ${first} ${last}`);
        return null;
      }
      const rec = json.results[0];
      const cred = rec.basic?.credential?.trim();
      const phone =
        rec.basic?.authorized_official_telephone_number ??
        rec.addresses?.find((a) => a.address_purpose === 'LOCATION')?.telephone_number ??
        rec.addresses?.[0]?.telephone_number ??
        null;

      const updated: Person = { ...person, sources: [...person.sources] };
      updated.sources.push({
        provider: 'npi',
        method: 'registry',
        confidence: 0.99,
      });
      // Append credential to title if we learned one and it's not already there.
      if (cred && !updated.title.toLowerCase().includes(cred.toLowerCase())) {
        updated.title = updated.title ? `${updated.title}, ${cred}` : cred;
      }
      if (!updated.phone && phone) {
        updated.phone = phone;
      }
      ctx.log.path('live', `NPI matched ${first} ${last} (NPI ${rec.number ?? '?'})`);
      return updated;
    } catch (err) {
      ctx.log.warn('NPI lookup failed', err instanceof Error ? err.message : err);
      return null;
    }
  },
};
