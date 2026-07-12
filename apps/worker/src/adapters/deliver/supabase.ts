/**
 * Supabase delivery — REAL. Writes the finalized rows for a target:
 *  - upsert one `companies` row (by org_id + domain)
 *  - insert `contacts` rows (snake_case columns, sources jsonb)
 *  - insert `ledger_entries` rows for every spend accrual
 *
 * No-ops with a warning when Supabase env is absent so local runs still complete.
 * Column names match the schema contract exactly.
 */

import { supabase } from '../../supabase.js';
import type { Log } from '../../log.js';

export interface ContactRow {
  org_id: string;
  run_id: string;
  company_id: string | null;
  name: string;
  title: string;
  company_name: string;
  domain: string;
  vertical: string | null;
  email: string | null;
  email_status: string;
  phone: string | null;
  fit: number;
  intent: number;
  tier: string;
  sources: unknown;
}

export interface CompanyRow {
  org_id: string;
  domain: string;
  name: string | null;
  industry: string | null;
  employees: string | null;
  revenue: string | null;
  hq: string | null;
  company_type: string | null;
  tech: unknown;
  fit: number;
  intent: number;
}

export interface LedgerRow {
  org_id: string;
  run_id: string;
  provider: string;
  kind: 'free' | 'paid' | 'ai';
  spend: number;
  calls: number;
}

/** Upsert the company, returning its id (or null if DB absent / failed). */
export async function deliverCompany(row: CompanyRow, log: Log): Promise<string | null> {
  if (!supabase) {
    log.path('skipped', `no DB — would upsert company ${row.domain}`);
    return null;
  }
  const { data, error } = await supabase
    .from('companies')
    .upsert(row, { onConflict: 'org_id,domain' })
    .select('id')
    .single();
  if (error) {
    log.warn(`company upsert failed for ${row.domain}`, error.message);
    return null;
  }
  return (data as { id: string }).id;
}

export async function deliverContacts(rows: ContactRow[], log: Log): Promise<number> {
  if (rows.length === 0) return 0;
  if (!supabase) {
    log.path('skipped', `no DB — would insert ${rows.length} contacts`);
    return 0;
  }
  const { error, count } = await supabase
    .from('contacts')
    .insert(rows, { count: 'exact' });
  if (error) {
    log.warn('contacts insert failed', error.message);
    return 0;
  }
  log.path('live', `inserted ${count ?? rows.length} contacts`);
  return count ?? rows.length;
}

export async function deliverLedger(rows: LedgerRow[], log: Log): Promise<void> {
  const nonzero = rows.filter((r) => r.calls > 0);
  if (nonzero.length === 0) return;
  if (!supabase) {
    log.path('skipped', `no DB — would append ${nonzero.length} ledger rows`);
    return;
  }
  const { error } = await supabase.from('ledger_entries').insert(nonzero);
  if (error) log.warn('ledger insert failed', error.message);
  else log.path('live', `appended ${nonzero.length} ledger rows`);
}
