/**
 * Core domain types for Lead Booster Pro.
 * Shared between the web app (apps/web) and the pipeline worker (apps/worker).
 * These mirror the Supabase schema in /supabase/migrations.
 */

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

/** The seven stages of the lead pipeline, in order. */
export const PIPELINE_STAGES = [
  'discover',
  'scrape',
  'extract',
  'enrich',
  'verify',
  'score',
  'deliver',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export type TargetStatus =
  | 'queued'
  | 'running'
  | 'repairing'
  | 'failed'
  | 'done'
  | 'cancelled';

export type RunStatus =
  | 'queued'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

/** How aggressive a run is: which providers are allowed to fire. */
export type RunProfileId = 'scraper' | 'free-max' | 'hunter-apollo' | 'full-stack';

export interface RunProfile {
  id: RunProfileId;
  label: string;
  /** Human-readable description shown in the composer. */
  readout: string;
  /** Whether paid providers are permitted. */
  paid: boolean;
  /** Provider names explicitly allowed for the paid waterfall (empty = free only). */
  paidProviders: string[];
}

export const RUN_PROFILES: Record<RunProfileId, RunProfile> = {
  scraper: {
    id: 'scraper',
    label: 'Scraper Only',
    readout: 'Free scrape → verify → score. No paid providers. AI: Claude (your key).',
    paid: false,
    paidProviders: [],
  },
  'free-max': {
    id: 'free-max',
    label: 'Free Max',
    readout: 'All free sources → verify → score. No paid providers. AI: Claude.',
    paid: false,
    paidProviders: [],
  },
  'hunter-apollo': {
    id: 'hunter-apollo',
    label: 'Hunter + Apollo',
    readout: 'Free-first, then Hunter → Apollo below 0.70 confidence. AI: Claude.',
    paid: true,
    paidProviders: ['Hunter', 'Apollo'],
  },
  'full-stack': {
    id: 'full-stack',
    label: 'Full Stack',
    readout: 'Free-first, then full paid waterfall below 0.70. AI: Claude.',
    paid: true,
    paidProviders: ['Hunter', 'Apollo', 'PDL', 'NeverBounce', 'Bright Data', 'Clay', 'Apify'],
  },
};

// ---------------------------------------------------------------------------
// Contacts & evidence
// ---------------------------------------------------------------------------

/** Email deliverability classification. */
export type EmailStatus = 'deliverable' | 'risky' | 'guess' | 'unknown';

/** ICP tier. */
export type Tier = 'A' | 'B' | 'C';

/**
 * A single piece of provenance: which provider produced a value and how
 * confident it is. Rendered as chips like `hunter · api · 0.92`.
 */
export interface EvidenceSource {
  /** Provider/source slug, e.g. 'scrape', 'hunter', 'npi'. */
  provider: string;
  /** Method, e.g. 'mailto', 'api', 'registry', 'probe', 'pattern'. */
  method: string;
  /** Confidence 0..1. */
  confidence: number;
}

export interface EvidenceEvent {
  field: string;
  value: string;
  /** e.g. `npi · registry · 0.99`. */
  meta: string;
  /** ISO timestamp or a relative label. */
  time: string;
  /** Semantic color token: 'green' | 'amber' | 'red' | 'accent'. */
  tone: 'green' | 'amber' | 'red' | 'accent';
}

export interface Contact {
  id: string;
  orgId: string;
  runId: string | null;
  companyId: string | null;
  /** Full name. */
  name: string;
  title: string;
  companyName: string;
  domain: string;
  vertical: string | null;
  email: string | null;
  emailStatus: EmailStatus;
  phone: string | null;
  /** ICP fit score 0..100. */
  fit: number;
  /** Intent score 0..100. */
  intent: number;
  tier: Tier;
  sources: EvidenceSource[];
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  orgId: string;
  domain: string;
  name: string;
  industry: string | null;
  employees: string | null;
  revenue: string | null;
  hq: string | null;
  companyType: string | null;
  tech: string[];
  /** ICP fit 0..100. */
  fit: number;
  /** Buying-intent signal 0..100. */
  intent: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Runs & targets
// ---------------------------------------------------------------------------

export interface Run {
  id: string;
  orgId: string;
  createdBy: string;
  label: string;
  profile: RunProfileId;
  status: RunStatus;
  /** Input spec that produced this run (composer text, sweep params, csv, …). */
  input: RunInput;
  icpProfileId: string | null;
  spendFree: number;
  spendPaid: number;
  targetsTotal: number;
  targetsDone: number;
  contactsFound: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export type RunInput =
  | { kind: 'company'; domain: string }
  | { kind: 'person'; name: string; domain: string }
  | { kind: 'prompt'; text: string }
  | { kind: 'csv'; storagePath: string; mapping: Record<string, string> }
  | { kind: 'sweep'; sweep: SweepSpec };

export interface SweepSpec {
  vertical: string;
  geoMode: 'radius' | 'admin' | 'zip' | 'draw';
  /** miles, when geoMode === 'radius'. */
  radius?: number;
  center?: { lat: number; lng: number; label?: string };
  zips?: string[];
  county?: string;
  filters: {
    hasWebsite: boolean;
    activeLicense: boolean;
    excludeChains: boolean;
    excludeCRM: boolean;
    excludeScraped: boolean;
    usePlaces: boolean;
  };
}

export interface Target {
  id: string;
  runId: string;
  orgId: string;
  domain: string;
  vertical: string | null;
  stage: PipelineStage;
  status: TargetStatus;
  activity: string;
  activityKind: 'idle' | 'free' | 'paid' | 'danger';
  found: number;
  retries: number;
  spend: number;
  icp: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// ICP profile
// ---------------------------------------------------------------------------

export interface IcpProfile {
  id: string;
  orgId: string;
  name: string;
  industries: string[];
  empMin: number;
  empMax: number;
  revBand: string;
  geo: string;
  companyType: string;
  techHas: string;
  techNot: string;
  signals: string[];
  seniority: string[];
  functions: string[];
  titleKeywords: string;
  disqualifiers: string;
  /** Tier cut points, e.g. "60 / 75 / 90". */
  tierCut: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Orgs, members, sources
// ---------------------------------------------------------------------------

export type MemberRole = 'owner' | 'admin' | 'member';

export interface Org {
  id: string;
  name: string;
  slug: string;
  /** Default run profile for new runs. */
  defaultProfile: RunProfileId;
  /** Free-first master switch. */
  freeFirst: boolean;
  /** Confidence threshold (0..1) below which paid providers may fire. */
  threshold: number;
  /** Master switch enabling any paid provider. */
  paidEnabled: boolean;
  createdAt: string;
}

export interface Member {
  id: string;
  orgId: string;
  userId: string;
  role: MemberRole;
  email: string;
  name: string | null;
}

export type SourceKeyStatus = 'valid' | 'invalid' | 'off';

/** A configured provider credential / connection for an org. */
export interface SourceKey {
  id: string;
  orgId: string;
  /** Provider name, matches ProviderDef.name. */
  provider: string;
  status: SourceKeyStatus;
  /** Last 4 chars of the key, for display only. Never the full key. */
  last4: string | null;
  /** Monthly budget cap in USD (paid providers). */
  budgetCap: number | null;
  /** Spend so far this month in USD. */
  budgetUsed: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Billing / ledger
// ---------------------------------------------------------------------------

export interface LedgerEntry {
  id: string;
  orgId: string;
  runId: string | null;
  provider: string;
  kind: 'free' | 'paid' | 'ai';
  /** USD spent for this batch of calls. */
  spend: number;
  calls: number;
  createdAt: string;
}
