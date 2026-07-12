/**
 * Stage 3 — extract. Sends scraped text to Claude (ANTHROPIC_MODEL_EXTRACT) with
 * a tool/JSON schema to pull {name, title, email?, phone?} person blocks. Falls
 * back to the free regex/heuristic extractor when no ANTHROPIC_API_KEY (or when
 * the model call fails / returns nothing).
 */

import { cfg } from '../config.js';
import { extractClaude } from '../adapters/extract/claude.js';
import { extractHeuristic } from '../adapters/extract/heuristic.js';
import type { Person } from '../adapters/types.js';
import type { Log } from '../log.js';

/** De-dupe people by lower-cased name, merging emails/sources. */
function dedupe(people: Person[]): Person[] {
  const map = new Map<string, Person>();
  for (const p of people) {
    const key = p.name.trim().toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, p);
      continue;
    }
    existing.email = existing.email ?? p.email;
    existing.phone = existing.phone ?? p.phone;
    if (!existing.title && p.title) existing.title = p.title;
    existing.sources.push(...p.sources);
  }
  return [...map.values()];
}

export async function runExtract(text: string, domain: string, log: Log): Promise<Person[]> {
  const ctx = { log, domain, model: cfg.modelExtract };
  let people: Person[] = [];
  if (extractClaude.available()) {
    people = await extractClaude.extract(text, ctx);
  }
  if (people.length === 0) {
    people = await extractHeuristic.extract(text, ctx);
  }
  return dedupe(people);
}
