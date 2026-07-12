/**
 * Deterministic discovery STUB.
 *
 * ⚠️ This is the ONE intentional stub in the whole worker. Everything else that
 * needs a key returns null without one; this instead returns a plausible,
 * DETERMINISTIC list of seeded domains per vertical so the full pipeline can run
 * end-to-end with zero API keys (demos, CI, first-boot). The domains are
 * synthesized from the prompt/vertical — they are NOT real leads and are clearly
 * labeled as such. In production, Google Places (or a paid discovery provider)
 * supersedes this whenever a key is present.
 */

import type { RunInput } from '@lead/core';
import { VERTICALS } from '@lead/core';
import type { DiscoveryAdapter, DiscoveryCtx, DiscoveredTarget } from '../types.js';

/** Vertical → short slug used to seed demo domains. */
const VERTICAL_SLUG: Record<string, string> = {
  Automotive: 'auto',
  'B2B Services': 'b2b',
  Construction: 'build',
  'CPG & Retail': 'retail',
  Financial: 'fin',
  Hospitality: 'hosp',
  Manufacturing: 'mfg',
  'Real Estate': 'realty',
  Healthcare: 'health',
};

function slugForVertical(v: string | null): string {
  if (v && VERTICAL_SLUG[v]) return VERTICAL_SLUG[v];
  return 'co';
}

/** Small deterministic hash so the same prompt always yields the same demo set. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const SUFFIXES = [
  'group',
  'partners',
  'associates',
  'collective',
  'works',
  'labs',
  'co',
  'hq',
  'io',
];

function guessVertical(text: string): string | null {
  const l = text.toLowerCase();
  for (const v of VERTICALS) {
    if (l.includes(v.toLowerCase())) return v;
  }
  if (/dentist|clinic|medical|doctor|physician|health/.test(l)) return 'Healthcare';
  if (/roof|hvac|plumb|contractor|construction|build/.test(l)) return 'Construction';
  if (/dealer|auto|car\b/.test(l)) return 'Automotive';
  if (/restaurant|hotel|bar\b|cafe|hospitality/.test(l)) return 'Hospitality';
  if (/law|accounting|agency|consult|b2b/.test(l)) return 'B2B Services';
  return null;
}

export const discoveryStub: DiscoveryAdapter = {
  provider: 'Discovery Stub',
  kind: 'builtin',
  available: () => true,

  async discover(input: RunInput, ctx: DiscoveryCtx): Promise<DiscoveredTarget[]> {
    const seedText =
      input.kind === 'prompt'
        ? input.text
        : input.kind === 'sweep'
          ? `${input.sweep.vertical} ${input.sweep.county ?? ''} ${input.sweep.center?.label ?? ''}`
          : 'companies';

    const vertical = ctx.vertical ?? guessVertical(seedText);
    const slug = slugForVertical(vertical);
    const base = hash(seedText.trim().toLowerCase());
    const n = Math.max(1, Math.min(ctx.limit, 12));

    const out: DiscoveredTarget[] = [];
    for (let i = 0; i < n; i++) {
      const suffix = SUFFIXES[(base + i * 7) % SUFFIXES.length];
      const num = ((base >> (i % 8)) % 900) + 100;
      const domain = `${slug}-${suffix}-${num}.example.com`;
      out.push({
        domain,
        name: `${cap(slug)} ${cap(suffix)} ${num}`,
        vertical,
      });
    }
    ctx.log.path('stub', `seeded ${out.length} demo targets for vertical=${vertical ?? 'unknown'} (NOT real leads)`);
    return out;
  },
};

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
