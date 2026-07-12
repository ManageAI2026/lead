import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
  seniorityOf,
  type Company,
  type Contact,
  type EmailStatus,
  type EvidenceSource,
  type IcpProfile,
  type LedgerEntry,
  type Member,
  type Org,
  type Run,
  type RunProfileId,
  type SourceKey,
  type Target,
  type Tier,
} from '@lead/core';

/**
 * Server-side data-access helpers for the dashboard. Every function here runs
 * under the signed-in user's RLS session (createClient), so a caller can only
 * ever read rows for orgs they belong to. Rows come back snake_case from
 * Postgres and are mapped to the camelCase @lead/core domain types.
 */

// ---------------------------------------------------------------------------
// Session / org context
// ---------------------------------------------------------------------------

export interface SessionContext {
  userId: string;
  email: string;
  org: Org | null;
  member: Member | null;
}

/** Load the signed-in user and their primary org membership (if any). */
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberRow } = await supabase
    .from('members')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  let org: Org | null = null;
  if (memberRow) {
    const { data: orgRow } = await supabase
      .from('orgs')
      .select('*')
      .eq('id', memberRow.org_id)
      .maybeSingle();
    if (orgRow) org = mapOrg(orgRow);
  }

  return {
    userId: user.id,
    email: user.email ?? '',
    org,
    member: memberRow ? mapMember(memberRow) : null,
  };
}

// ---------------------------------------------------------------------------
// Runs & targets
// ---------------------------------------------------------------------------

/** The org's most recent active (queued/running/paused) run, or null. */
export async function getActiveRun(orgId: string): Promise<Run | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('runs')
    .select('*')
    .eq('org_id', orgId)
    .in('status', ['queued', 'running', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? mapRun(data) : null;
}

export async function getRecentRuns(orgId: string, limit = 10): Promise<Run[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('runs')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapRun);
}

export async function getTargets(runId: string): Promise<Target[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('targets')
    .select('*')
    .eq('run_id', runId)
    .order('created_at', { ascending: true });
  return (data ?? []).map(mapTarget);
}

// ---------------------------------------------------------------------------
// Contacts & companies
// ---------------------------------------------------------------------------

export interface ContactFilters {
  q?: string;
  emailStatus?: string; // 'all' | EmailStatus
  tier?: string; // 'all' | Tier
  industry?: string; // 'all' | industry name
  hasPhone?: boolean;
  minFit?: number;
}

export async function getContacts(
  orgId: string,
  filters: ContactFilters = {}
): Promise<Contact[]> {
  const supabase = createClient();
  let query = supabase.from('contacts').select('*').eq('org_id', orgId);

  if (filters.emailStatus && filters.emailStatus !== 'all') {
    query = query.eq('email_status', filters.emailStatus);
  }
  if (filters.tier && filters.tier !== 'all') {
    query = query.eq('tier', filters.tier);
  }
  if (filters.industry && filters.industry !== 'all') {
    query = query.eq('vertical', filters.industry);
  }
  if (filters.minFit && filters.minFit > 0) {
    query = query.gte('fit', filters.minFit);
  }
  if (filters.q) {
    const like = `%${filters.q}%`;
    query = query.or(
      `name.ilike.${like},company_name.ilike.${like},title.ilike.${like},vertical.ilike.${like}`
    );
  }

  const { data } = await query.order('fit', { ascending: false }).limit(500);
  let rows = (data ?? []).map(mapContact);
  if (filters.hasPhone) rows = rows.filter((c) => !!c.phone && c.phone !== '—');
  return rows;
}

export async function getCompanies(
  orgId: string,
  filters: { q?: string; industry?: string } = {}
): Promise<Company[]> {
  const supabase = createClient();
  let query = supabase.from('companies').select('*').eq('org_id', orgId);
  if (filters.industry && filters.industry !== 'all') {
    query = query.eq('industry', filters.industry);
  }
  if (filters.q) {
    const like = `%${filters.q}%`;
    query = query.or(`name.ilike.${like},domain.ilike.${like},industry.ilike.${like}`);
  }
  const { data } = await query.order('fit', { ascending: false }).limit(500);
  return (data ?? []).map(mapCompany);
}

/** Count of people per domain within the org (for the companies table). */
export async function getContactCountsByDomain(
  orgId: string
): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data } = await supabase
    .from('contacts')
    .select('domain')
    .eq('org_id', orgId)
    .limit(2000);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const d = (row as { domain: string | null }).domain;
    if (d) counts[d] = (counts[d] ?? 0) + 1;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// ICP, sources, ledger, members
// ---------------------------------------------------------------------------

export async function getIcpProfiles(orgId: string): Promise<IcpProfile[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('icp_profiles')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true });
  return (data ?? []).map(mapIcp);
}

export async function getSourceKeys(orgId: string): Promise<SourceKey[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('source_keys')
    .select('*')
    .eq('org_id', orgId);
  return (data ?? []).map(mapSourceKey);
}

export async function getLedger(orgId: string): Promise<LedgerEntry[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('ledger_entries')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1000);
  return (data ?? []).map(mapLedger);
}

/** Ledger rolled up per provider, for the Billing screen. */
export interface LedgerRollup {
  provider: string;
  kind: 'free' | 'paid' | 'ai';
  spend: number;
  calls: number;
}

export async function getLedgerByProvider(orgId: string): Promise<LedgerRollup[]> {
  const entries = await getLedger(orgId);
  const map = new Map<string, LedgerRollup>();
  for (const e of entries) {
    const key = e.provider;
    const cur = map.get(key) ?? { provider: key, kind: e.kind, spend: 0, calls: 0 };
    cur.spend += e.spend;
    cur.calls += e.calls;
    // paid dominates the row color if mixed
    if (e.kind === 'paid') cur.kind = 'paid';
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => b.spend - a.spend);
}

export async function getMembers(orgId: string): Promise<Member[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('members')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true });
  return (data ?? []).map(mapMember);
}

export interface TalkMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  createdAt: string;
}

export async function getTalkMessages(orgId: string): Promise<TalkMessage[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('talk_messages')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })
    .limit(200);
  return (data ?? []).map((r) => ({
    id: r.id,
    role: r.role === 'user' ? 'user' : 'agent',
    text: r.text,
    createdAt: r.created_at,
  }));
}

// ---------------------------------------------------------------------------
// Row mappers (snake_case → camelCase domain types)
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */

export function mapOrg(r: any): Org {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    defaultProfile: r.default_profile as RunProfileId,
    freeFirst: r.free_first,
    threshold: Number(r.threshold),
    paidEnabled: r.paid_enabled,
    createdAt: r.created_at,
  };
}

export function mapMember(r: any): Member {
  return {
    id: r.id,
    orgId: r.org_id,
    userId: r.user_id,
    role: r.role,
    email: r.email,
    name: r.name ?? null,
  };
}

export function mapRun(r: any): Run {
  return {
    id: r.id,
    orgId: r.org_id,
    createdBy: r.created_by ?? '',
    label: r.label,
    profile: r.profile as RunProfileId,
    status: r.status,
    input: r.input ?? { kind: 'prompt', text: '' },
    icpProfileId: r.icp_profile_id ?? null,
    spendFree: Number(r.spend_free),
    spendPaid: Number(r.spend_paid),
    targetsTotal: r.targets_total,
    targetsDone: r.targets_done,
    contactsFound: r.contacts_found,
    startedAt: r.started_at ?? null,
    finishedAt: r.finished_at ?? null,
    createdAt: r.created_at,
  };
}

export function mapTarget(r: any): Target {
  return {
    id: r.id,
    runId: r.run_id,
    orgId: r.org_id,
    domain: r.domain,
    vertical: r.vertical ?? null,
    stage: r.stage,
    status: r.status,
    activity: r.activity,
    activityKind: r.activity_kind,
    found: r.found,
    retries: r.retries,
    spend: Number(r.spend),
    icp: r.icp,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function normalizeSources(raw: any): EvidenceSource[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s: any) => {
    // support both {provider,method,confidence} and ['provider','method','0.9']
    if (Array.isArray(s)) {
      return { provider: s[0], method: s[1], confidence: parseFloat(s[2]) || 0 };
    }
    return {
      provider: s.provider ?? s.name ?? '',
      method: s.method ?? '',
      confidence: typeof s.confidence === 'number' ? s.confidence : parseFloat(s.confidence) || 0,
    };
  });
}

export function mapContact(r: any): Contact {
  return {
    id: r.id,
    orgId: r.org_id,
    runId: r.run_id ?? null,
    companyId: r.company_id ?? null,
    name: r.name,
    title: r.title ?? '',
    companyName: r.company_name ?? '',
    domain: r.domain ?? '',
    vertical: r.vertical ?? null,
    email: r.email ?? null,
    emailStatus: (r.email_status ?? 'unknown') as EmailStatus,
    phone: r.phone ?? null,
    fit: r.fit ?? 0,
    intent: r.intent ?? 0,
    tier: (r.tier ?? 'C') as Tier,
    sources: normalizeSources(r.sources),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function mapCompany(r: any): Company {
  return {
    id: r.id,
    orgId: r.org_id,
    domain: r.domain,
    name: r.name,
    industry: r.industry ?? null,
    employees: r.employees ?? null,
    revenue: r.revenue ?? null,
    hq: r.hq ?? null,
    companyType: r.company_type ?? null,
    tech: Array.isArray(r.tech) ? r.tech : [],
    fit: r.fit ?? 0,
    intent: r.intent ?? 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function mapIcp(r: any): IcpProfile {
  return {
    id: r.id,
    orgId: r.org_id,
    name: r.name,
    industries: Array.isArray(r.industries) ? r.industries : [],
    empMin: r.emp_min ?? 0,
    empMax: r.emp_max ?? 0,
    revBand: r.rev_band ?? '',
    geo: r.geo ?? '',
    companyType: r.company_type ?? '',
    techHas: r.tech_has ?? '',
    techNot: r.tech_not ?? '',
    signals: Array.isArray(r.signals) ? r.signals : [],
    seniority: Array.isArray(r.seniority) ? r.seniority : [],
    functions: Array.isArray(r.functions) ? r.functions : [],
    titleKeywords: r.title_keywords ?? '',
    disqualifiers: r.disqualifiers ?? '',
    tierCut: r.tier_cut ?? '60 / 75 / 90',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function mapSourceKey(r: any): SourceKey {
  return {
    id: r.id,
    orgId: r.org_id,
    provider: r.provider,
    status: r.status,
    last4: r.last4 ?? null,
    budgetCap: r.budget_cap != null ? Number(r.budget_cap) : null,
    budgetUsed: Number(r.budget_used ?? 0),
    enabled: r.enabled,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function mapLedger(r: any): LedgerEntry {
  return {
    id: r.id,
    orgId: r.org_id,
    runId: r.run_id ?? null,
    provider: r.provider,
    kind: r.kind,
    spend: Number(r.spend),
    calls: r.calls,
    createdAt: r.created_at,
  };
}

/** Re-export for convenience in server components. */
export { seniorityOf };
