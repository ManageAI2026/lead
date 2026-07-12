/**
 * Heuristic people extractor — REAL, zero-key fallback for the `extract` stage.
 *
 * Scans scraped text for "Name — Title" patterns near known title keywords and
 * pairs mailto/bare emails to the nearest person. Deterministic and free; used
 * whenever ANTHROPIC_API_KEY is absent. Precision over recall — it only emits a
 * person when it sees a plausible proper name adjacent to a role word.
 */

import type { ExtractAdapter, ExtractCtx, Person } from '../types.js';

/** Role words that anchor a title, with an optional leading modifier. */
const ROLE =
  '(?:founder|owner|ceo|chief[a-z ]*officer|president|principal|partner|coo|cfo|cto|cmo|director|vice president|vp|head of [a-z]+|manager|counsel|attorney|physician|dentist|broker|agent|realtor|dds|md|dvm|cpa|esq)';
const MODIFIER =
  '(?:chief|senior|lead|managing|practice|vice|associate|general|regional|executive|founding)';

/**
 * The workhorse pattern: a proper name directly followed by a comma/dash and a
 * job title — the shape almost every real team/about page uses. Robust to
 * honorific prefixes (Dr., Ms.) and middle initials, and it ties the title to
 * the name so we never mislabel page furniture as a person.
 */
const NAME_TITLE = new RegExp(
  '(?:Dr|Mr|Mrs|Ms|Prof)?\\.?\\s*' +
    '([A-Z][a-z]+(?:\\s+[A-Z]\\.?)?\\s+[A-Z][a-z]+(?:-[A-Z][a-z]+)?)' + // name
    '\\s*[,\\u2014\\u2013\\-]\\s*' + // , — – -
    `(${MODIFIER}\\s+)?(${ROLE})`, // title
  'gi'
);

/** Words that look like a Capitalized Name but are page furniture or roles. */
const NAME_STOP =
  /^(our|the|meet|team|staff|about|home|contact|practice|manager|director|owner|founder|president|partner|principal|counsel|attorney|physician|dentist|broker|agent|realtor|senior|lead|chief|leadership|services|welcome|office|group)$/i;

/** Reject a candidate name whose tokens are role words / page furniture. */
function isPlausibleName(name: string): boolean {
  const tokens = name.split(/\s+/);
  if (tokens.length < 2) return false;
  return tokens.every((t) => !NAME_STOP.test(t.replace(/\./g, '')));
}

function titleCase(s: string): string {
  return s.replace(/\s+/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractEmails(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g)) {
    out.add(m[0].toLowerCase());
  }
  return [...out];
}

export const extractHeuristic: ExtractAdapter = {
  provider: 'Heuristic Extractor',
  kind: 'builtin',
  available: () => true,

  async extract(text: string, ctx: ExtractCtx): Promise<Person[]> {
    if (!text || text.length < 20) {
      ctx.log.path('stub', 'no text to extract from');
      return [];
    }
    const emails = extractEmails(text);
    const people = new Map<string, Person>();

    // Match "Name, Title" / "Name — Title" across the whole page — the title is
    // tied to the name, so page furniture never gets emitted as a person.
    for (const m of text.matchAll(NAME_TITLE)) {
      const name = m[1].trim();
      if (!isPlausibleName(name)) continue;
      const title = titleCase(`${m[2] ?? ''}${m[3] ?? ''}`);
      const key = name.toLowerCase();
      if (!people.has(key)) {
        people.set(key, { name, title, email: null, phone: null, sources: [] });
      }
    }

    // Pair emails to people by matching local-part tokens to name parts.
    const persons = [...people.values()];
    for (const email of emails) {
      const local = email.split('@')[0].toLowerCase();
      const hit = persons.find((p) => {
        const [first, ...rest] = p.name.toLowerCase().split(/\s+/);
        const last = rest[rest.length - 1] ?? '';
        return (
          local.includes(last) ||
          local.includes(first) ||
          local === `${first[0]}${last}` ||
          local === `${first}.${last}`
        );
      });
      if (hit && !hit.email) {
        hit.email = email;
        hit.sources.push({ provider: 'scrape', method: 'mailto', confidence: 0.75 });
      }
    }

    for (const p of persons) {
      p.sources.unshift({ provider: 'scrape', method: 'heuristic', confidence: 0.55 });
    }
    ctx.log.path('live', `heuristic extracted ${persons.length} people (${emails.length} emails on page)`);
    return persons;
  },
};
