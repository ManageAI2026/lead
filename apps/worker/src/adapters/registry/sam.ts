/**
 * SAM.gov Entity Management adapter — key-guarded STUB shape.
 *
 * SAM.gov exposes a real Entity API (https://api.sam.gov/entity-information/v3/
 * entities) that needs a free API key (SAM_GOV_API_KEY) and is rate-limited to
 * ~10 lookups/day without a registered entity account. Because that quota is too
 * tight to fire on every target, this adapter is wired for the correct real call
 * but only executes when a key is present; without one it no-ops. It confirms a
 * company is a registered federal entity (a revenue/legitimacy signal) — it does
 * not fabricate contacts, so on any uncertainty it returns null.
 */

import { cfg } from '../../config.js';
import type { EnrichAdapter, EnrichCtx, Person } from '../types.js';

const API = 'https://api.sam.gov/entity-information/v3/entities';

interface SamResponse {
  totalRecords?: number;
  entityData?: Array<{
    entityRegistration?: { legalBusinessName?: string; registrationStatus?: string };
  }>;
}

export const registrySam: EnrichAdapter = {
  provider: 'SAM.gov',
  kind: 'gov',
  available: () => Boolean(cfg.samGovKey),

  async enrich(person: Person, ctx: EnrichCtx): Promise<Person | null> {
    if (!cfg.samGovKey) {
      ctx.log.path('skipped', 'no SAM_GOV_API_KEY (free key, ~10/day)');
      return null;
    }
    const legalName = ctx.companyName;
    if (!legalName) {
      ctx.log.path('skipped', 'SAM needs a company legal name');
      return null;
    }
    const url = new URL(API);
    url.searchParams.set('api_key', cfg.samGovKey);
    url.searchParams.set('legalBusinessName', legalName);
    url.searchParams.set('registrationStatus', 'A');
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        ctx.log.warn(`SAM ${res.status}`);
        return null;
      }
      const json = (await res.json()) as SamResponse;
      ctx.spend({ provider: 'SAM.gov', kind: 'free', spend: 0, calls: 1 });
      if (!json.totalRecords) {
        ctx.log.path('live', `SAM no active registration for ${legalName}`);
        return null;
      }
      // Registration confirmed — attach as a legitimacy source. No contact fields
      // are invented; SAM does not publish individual staff emails.
      const updated: Person = { ...person, sources: [...person.sources] };
      updated.sources.push({ provider: 'sam.gov', method: 'registry', confidence: 0.9 });
      ctx.log.path('live', `SAM confirmed federal entity ${legalName}`);
      return updated;
    } catch (err) {
      ctx.log.warn('SAM lookup failed', err instanceof Error ? err.message : err);
      return null;
    }
  },
};
