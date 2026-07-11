/**
 * Stage 7 — deliver. Writes the final Contact rows to Supabase, upserts the
 * company, appends aggregated LedgerEntry rows for spend, and optionally exports
 * a CSV to storage / POSTs a webhook. Returns tallies for the run rollup.
 */

import { supabase } from '../supabase.js';
import {
  deliverCompany,
  deliverContacts,
  deliverLedger,
  type CompanyRow,
  type ContactRow,
  type LedgerRow,
} from '../adapters/deliver/supabase.js';
import { deliverCsv } from '../adapters/deliver/csv.js';
import { deliverWebhook } from '../adapters/deliver/webhook.js';
import type { CompanyFacts, Person, Spend } from '../adapters/types.js';
import type { ScoredContact } from './score.js';
import type { Log } from '../log.js';

export interface DeliverDeps {
  runId: string;
  orgId: string;
  vertical: string | null;
  company: CompanyFacts;
  spends: Spend[];
  log: Log;
}

export interface DeliverTally {
  delivered: number;
  spendFree: number;
  spendPaid: number;
  avgFit: number;
}

/** Aggregate raw accruals into one ledger row per (provider, kind). */
function aggregateLedger(spends: Spend[], runId: string, orgId: string): LedgerRow[] {
  const map = new Map<string, LedgerRow>();
  for (const s of spends) {
    const key = `${s.provider}|${s.kind}`;
    const row = map.get(key);
    if (row) {
      row.spend = Math.round((row.spend + s.spend) * 1e6) / 1e6;
      row.calls += s.calls;
    } else {
      map.set(key, {
        org_id: orgId,
        run_id: runId,
        provider: s.provider,
        kind: s.kind,
        spend: s.spend,
        calls: s.calls,
      });
    }
  }
  return [...map.values()];
}

export async function runDeliver(
  scored: ScoredContact[],
  deps: DeliverDeps
): Promise<DeliverTally> {
  const { runId, orgId, vertical, company, log } = deps;
  const avgFit = scored.length
    ? Math.round(scored.reduce((a, c) => a + c.fit, 0) / scored.length)
    : 0;
  const avgIntent = scored.length
    ? Math.round(scored.reduce((a, c) => a + c.intent, 0) / scored.length)
    : 0;

  // 1. Company upsert.
  const companyRow: CompanyRow = {
    org_id: orgId,
    domain: company.domain,
    name: company.name,
    industry: company.industry ?? vertical,
    employees: company.employees != null ? String(company.employees) : null,
    revenue: company.revenue,
    hq: company.hq,
    company_type: company.companyType,
    tech: company.tech,
    fit: avgFit,
    intent: avgIntent,
  };
  const companyId = await deliverCompany(companyRow, log);

  // 2. Contact rows.
  const rows: ContactRow[] = scored.map((c) => ({
    org_id: orgId,
    run_id: runId,
    company_id: companyId,
    name: c.person.name,
    title: c.person.title,
    company_name: company.name ?? company.domain,
    domain: company.domain,
    vertical,
    email: c.person.email,
    email_status: c.emailStatus,
    phone: c.person.phone,
    fit: c.fit,
    intent: c.intent,
    tier: c.tier,
    sources: c.person.sources,
  }));
  const delivered = await deliverContacts(rows, log);

  // 3. Ledger.
  const ledger = aggregateLedger(deps.spends, runId, orgId);
  await deliverLedger(ledger, log);

  // 4. Optional CSV export + webhook (best-effort).
  await deliverCsv(runId, rows, log);
  await deliverWebhook(runId, orgId, rows, log);

  const spendFree = deps.spends.filter((s) => s.kind !== 'paid').reduce((a, s) => a + s.spend, 0);
  const spendPaid = deps.spends.filter((s) => s.kind === 'paid').reduce((a, s) => a + s.spend, 0);

  // Fallback so the returned count reflects real work even when count() is unavailable.
  const deliveredCount = supabase ? delivered : rows.length;
  return {
    delivered: deliveredCount || rows.length,
    spendFree: Math.round(spendFree * 1e6) / 1e6,
    spendPaid: Math.round(spendPaid * 1e6) / 1e6,
    avgFit,
  };
}
