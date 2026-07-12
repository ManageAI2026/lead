/**
 * Stage 1 — discover. Turns a RunInput into a list of target domains.
 *   kind:'company' → the one domain.
 *   kind:'person'  → the person's domain (single target).
 *   kind:'prompt' / 'sweep' → Google Places when a key is present, else the
 *                             deterministic stub so demos run with zero keys.
 *   kind:'csv'     → rows read from the mapped CSV (domain column).
 */

import type { RunInput } from '@lead/core';
import { supabase } from '../supabase.js';
import { discoveryPlaces } from '../adapters/discovery/places.js';
import { discoveryStub } from '../adapters/discovery/stub.js';
import type { DiscoveredTarget } from '../adapters/types.js';
import type { Log } from '../log.js';

function domainOf(raw: string): string | null {
  const t = raw.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return /\.[a-z]{2,}$/i.test(t) ? t.toLowerCase() : null;
}

async function fromCsv(
  storagePath: string,
  mapping: Record<string, string>,
  log: Log
): Promise<DiscoveredTarget[]> {
  if (!supabase) {
    log.path('skipped', 'no DB — cannot read CSV from storage');
    return [];
  }
  const bucket = storagePath.split('/')[0];
  const path = storagePath.split('/').slice(1).join('/');
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) {
    log.warn(`CSV download failed (${storagePath})`, error?.message);
    return [];
  }
  const text = await data.text();
  const rows = text.split(/\r?\n/).filter(Boolean);
  if (rows.length < 2) return [];
  const header = splitCsvLine(rows[0]);
  const domainCol = mapping.domain ?? 'domain';
  const nameCol = mapping.name ?? mapping.company ?? 'name';
  const di = header.indexOf(domainCol);
  const ni = header.indexOf(nameCol);
  const out: DiscoveredTarget[] = [];
  const seen = new Set<string>();
  for (let i = 1; i < rows.length; i++) {
    const cells = splitCsvLine(rows[i]);
    const rawDomain = di >= 0 ? cells[di] : cells[0];
    const domain = domainOf(rawDomain ?? '');
    if (!domain || seen.has(domain)) continue;
    seen.add(domain);
    out.push({ domain, name: ni >= 0 ? cells[ni] : undefined });
  }
  log.path('live', `CSV yielded ${out.length} targets from ${storagePath}`);
  return out;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { out.push(cur.trim()); cur = ''; }
    else cur += c;
  }
  out.push(cur.trim());
  return out;
}

export async function runDiscover(
  input: RunInput,
  vertical: string | null,
  limit: number,
  log: Log
): Promise<DiscoveredTarget[]> {
  switch (input.kind) {
    case 'company': {
      const domain = domainOf(input.domain);
      return domain ? [{ domain, vertical }] : [];
    }
    case 'person': {
      const domain = domainOf(input.domain);
      return domain ? [{ domain, name: input.name, vertical }] : [];
    }
    case 'csv':
      return fromCsv(input.storagePath, input.mapping, log);
    case 'prompt':
    case 'sweep': {
      const ctx = { log, vertical, limit };
      if (discoveryPlaces.available()) {
        const hits = await discoveryPlaces.discover(input, ctx);
        if (hits.length > 0) return hits;
        log.info('Places returned nothing — falling back to stub');
      }
      return discoveryStub.discover(input, ctx);
    }
    default:
      return [];
  }
}
