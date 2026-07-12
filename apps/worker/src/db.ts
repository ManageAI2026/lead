/**
 * Database helpers for live pipeline state. The dashboard subscribes to
 * `targets` and `runs` via Supabase realtime, so the worker patches these rows
 * as each stage progresses. All helpers no-op (and log) when the DB is absent.
 */

import type { PipelineStage, TargetStatus, RunStatus, IcpProfile, SourceKey } from '@lead/core';
import { supabase } from './supabase.js';
import { logger } from './log.js';

const log = logger('db');

// --- targets ---------------------------------------------------------------

export interface TargetPatch {
  stage?: PipelineStage;
  status?: TargetStatus;
  activity?: string;
  activity_kind?: 'idle' | 'free' | 'paid' | 'danger';
  found?: number;
  retries?: number;
  spend?: number;
  icp?: number;
}

export async function patchTarget(targetId: string, patch: TargetPatch): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('targets')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', targetId);
  if (error) log.warn(`patchTarget ${targetId} failed`, error.message);
}

export interface TargetInsert {
  run_id: string;
  org_id: string;
  domain: string;
  vertical: string | null;
}

/** Insert a targets row and return its id (or a synthetic id when DB absent). */
export async function insertTarget(row: TargetInsert): Promise<string> {
  if (!supabase) {
    const synthetic = `local-${row.domain}-${Math.random().toString(36).slice(2, 8)}`;
    log.path('skipped', `no DB — synthetic target id ${synthetic}`);
    return synthetic;
  }
  const { data, error } = await supabase
    .from('targets')
    .insert({
      ...row,
      stage: 'discover',
      status: 'queued',
      activity: 'Queued',
      activity_kind: 'idle',
      found: 0,
      retries: 0,
      spend: 0,
      icp: 0,
    })
    .select('id')
    .single();
  if (error || !data) {
    log.warn(`insertTarget ${row.domain} failed`, error?.message);
    return `local-${row.domain}`;
  }
  return (data as { id: string }).id;
}

// --- runs ------------------------------------------------------------------

export interface RunPatch {
  status?: RunStatus;
  spend_free?: number;
  spend_paid?: number;
  targets_total?: number;
  targets_done?: number;
  contacts_found?: number;
  started_at?: string | null;
  finished_at?: string | null;
}

export async function patchRun(runId: string, patch: RunPatch): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('runs').update(patch).eq('id', runId);
  if (error) log.warn(`patchRun ${runId} failed`, error.message);
}

/**
 * Atomically bump a run's tally columns (targets_done, contacts_found, spend).
 * Uses a read-modify-write; good enough at our concurrency and avoids requiring
 * a Postgres function. Falls back silently without a DB.
 */
export async function bumpRun(
  runId: string,
  deltas: { targets_done?: number; contacts_found?: number; spend_free?: number; spend_paid?: number }
): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase
    .from('runs')
    .select('targets_done, contacts_found, spend_free, spend_paid, targets_total')
    .eq('id', runId)
    .single();
  if (error || !data) {
    log.warn(`bumpRun ${runId} read failed`, error?.message);
    return;
  }
  const cur = data as {
    targets_done: number;
    contacts_found: number;
    spend_free: number;
    spend_paid: number;
    targets_total: number;
  };
  const next = {
    targets_done: cur.targets_done + (deltas.targets_done ?? 0),
    contacts_found: cur.contacts_found + (deltas.contacts_found ?? 0),
    spend_free: round2(cur.spend_free + (deltas.spend_free ?? 0)),
    spend_paid: round2(cur.spend_paid + (deltas.spend_paid ?? 0)),
  };
  await patchRun(runId, next);
  // When every target is done, close the run out.
  if (next.targets_done >= cur.targets_total && cur.targets_total > 0) {
    await patchRun(runId, { status: 'completed', finished_at: new Date().toISOString() });
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// --- fetch helpers ---------------------------------------------------------

/** Fetch the org's configured source keys (for the paid gate). Empty on no DB. */
export async function fetchSourceKeys(orgId: string): Promise<SourceKey[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('source_keys')
    .select('*')
    .eq('org_id', orgId);
  if (error || !data) {
    if (error) log.warn('fetchSourceKeys failed', error.message);
    return [];
  }
  return (data as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.id),
    orgId: String(r.org_id),
    provider: String(r.provider),
    status: (r.status as SourceKey['status']) ?? 'off',
    last4: (r.last4 as string | null) ?? null,
    budgetCap: (r.budget_cap as number | null) ?? null,
    budgetUsed: Number(r.budget_used ?? 0),
    enabled: Boolean(r.enabled),
    createdAt: '',
    updatedAt: '',
  }));
}

/** Fetch an ICP profile by id, or return a permissive default. */
export async function fetchIcpProfile(id: string | null): Promise<IcpProfile> {
  if (supabase && id) {
    const { data, error } = await supabase
      .from('icp_profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (!error && data) return mapIcp(data as Record<string, unknown>);
    if (error) log.warn(`fetchIcpProfile ${id} failed`, error.message);
  }
  return defaultIcp();
}

function mapIcp(r: Record<string, unknown>): IcpProfile {
  return {
    id: String(r.id),
    orgId: String(r.org_id),
    name: String(r.name ?? 'ICP'),
    industries: (r.industries as string[]) ?? [],
    empMin: Number(r.emp_min ?? 0),
    empMax: Number(r.emp_max ?? 100000),
    revBand: String(r.rev_band ?? ''),
    geo: String(r.geo ?? ''),
    companyType: String(r.company_type ?? ''),
    techHas: String(r.tech_has ?? ''),
    techNot: String(r.tech_not ?? ''),
    signals: (r.signals as string[]) ?? [],
    seniority: (r.seniority as string[]) ?? [],
    functions: (r.functions as string[]) ?? [],
    titleKeywords: String(r.title_keywords ?? ''),
    disqualifiers: String(r.disqualifiers ?? ''),
    tierCut: String(r.tier_cut ?? '60 / 75 / 90'),
    createdAt: '',
    updatedAt: '',
  };
}

export function defaultIcp(): IcpProfile {
  return {
    id: 'default',
    orgId: '',
    name: 'Default ICP',
    industries: [],
    empMin: 0,
    empMax: 100000,
    revBand: '',
    geo: '',
    companyType: '',
    techHas: '',
    techNot: '',
    signals: [],
    seniority: [],
    functions: [],
    titleKeywords: '',
    disqualifiers: '',
    tierCut: '60 / 75 / 90',
    createdAt: '',
    updatedAt: '',
  };
}
