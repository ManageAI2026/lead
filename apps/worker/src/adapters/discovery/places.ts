/**
 * Google Places (Places API v1) discovery adapter — REAL HTTP, key-guarded.
 *
 * Uses the Text Search endpoint to turn a natural-language prompt / sweep into a
 * list of businesses, then keeps only those that expose a website (we derive the
 * target domain from `websiteUri`). Returns [] without GOOGLE_PLACES_API_KEY so
 * the caller falls back to the deterministic stub.
 */

import type { RunInput } from '@lead/core';
import { cfg } from '../../config.js';
import type { DiscoveryAdapter, DiscoveryCtx, DiscoveredTarget } from '../types.js';

const ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';

interface PlacesResponse {
  places?: Array<{
    displayName?: { text?: string };
    websiteUri?: string;
    primaryType?: string;
  }>;
}

function domainOf(url: string): string | null {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '');
    return h || null;
  } catch {
    return null;
  }
}

function queryOf(input: RunInput): string {
  if (input.kind === 'prompt') return input.text;
  if (input.kind === 'sweep') {
    const s = input.sweep;
    const where = s.center?.label ?? s.county ?? (s.zips?.[0] ?? '');
    return `${s.vertical} in ${where}`.trim();
  }
  return 'businesses';
}

export const discoveryPlaces: DiscoveryAdapter = {
  provider: 'Google Places',
  kind: 'free',
  available: () => Boolean(cfg.googlePlacesKey),

  async discover(input: RunInput, ctx: DiscoveryCtx): Promise<DiscoveredTarget[]> {
    if (!cfg.googlePlacesKey) {
      ctx.log.path('skipped', 'no GOOGLE_PLACES_API_KEY');
      return [];
    }
    const textQuery = queryOf(input);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': cfg.googlePlacesKey,
          'X-Goog-FieldMask':
            'places.displayName,places.websiteUri,places.primaryType',
        },
        body: JSON.stringify({ textQuery, maxResultCount: Math.min(ctx.limit, 20) }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        ctx.log.warn(`Places API ${res.status} — falling back to stub`);
        return [];
      }
      const json = (await res.json()) as PlacesResponse;
      const seen = new Set<string>();
      const out: DiscoveredTarget[] = [];
      for (const p of json.places ?? []) {
        if (!p.websiteUri) continue;
        const domain = domainOf(p.websiteUri);
        if (!domain || seen.has(domain)) continue;
        seen.add(domain);
        out.push({
          domain,
          name: p.displayName?.text ?? undefined,
          vertical: ctx.vertical,
        });
      }
      ctx.log.path('live', `Places returned ${out.length} domains for "${textQuery}"`);
      return out;
    } catch (err) {
      ctx.log.warn(`Places API error — falling back to stub`, err);
      return [];
    }
  },
};
