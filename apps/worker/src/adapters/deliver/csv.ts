/**
 * CSV delivery — REAL. Serializes the run's qualified contacts to CSV and, when
 * Supabase is configured, uploads it to the `exports` storage bucket at
 * `runs/<runId>/contacts.csv`. Without a DB it logs the CSV size and returns the
 * text so a caller/test can still inspect it. Never throws into the pipeline.
 */

import { supabase } from '../../supabase.js';
import { cfg } from '../../config.js';
import type { Log } from '../../log.js';
import type { ContactRow } from './supabase.js';

const HEADERS = [
  'name',
  'title',
  'company_name',
  'domain',
  'vertical',
  'email',
  'email_status',
  'phone',
  'fit',
  'intent',
  'tier',
];

function esc(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: ContactRow[]): string {
  const lines = [HEADERS.join(',')];
  for (const r of rows) {
    lines.push(
      HEADERS.map((h) => esc((r as unknown as Record<string, unknown>)[h])).join(',')
    );
  }
  return lines.join('\n');
}

export async function deliverCsv(
  runId: string,
  rows: ContactRow[],
  log: Log
): Promise<string> {
  const csv = toCsv(rows);
  if (!supabase) {
    log.path('skipped', `no DB — generated CSV in memory (${csv.length} bytes)`);
    return csv;
  }
  const path = `runs/${runId}/contacts.csv`;
  const { error } = await supabase.storage
    .from(cfg.csvBucket)
    .upload(path, new Blob([csv], { type: 'text/csv' }), { upsert: true });
  if (error) log.warn(`CSV upload failed (${path})`, error.message);
  else log.path('live', `uploaded CSV to ${cfg.csvBucket}/${path}`);
  return csv;
}
