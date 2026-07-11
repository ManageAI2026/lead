/**
 * Common adapter contracts. Every adapter — discovery, scrape, extract, enrich,
 * verify, score, deliver — implements `Adapter` (identity + availability) plus
 * one category method. Availability is key/env presence: an adapter that needs
 * a key it doesn't have MUST return null/empty and log `path('skipped', …)`.
 */

import type { EvidenceSource, ProviderKind, RunInput } from '@lead/core';
import type { Log } from '../log.js';

/** A person the pipeline is building up as it flows through the stages. */
export interface Person {
  name: string;
  title: string;
  email: string | null;
  phone: string | null;
  /** Provenance chips accumulated across stages. */
  sources: EvidenceSource[];
}

/** Firmographics for the target company, filled opportunistically. */
export interface CompanyFacts {
  domain: string;
  name: string | null;
  industry: string | null;
  employees: number | null;
  revenue: string | null;
  hq: string | null;
  companyType: string | null;
  tech: string[];
}

/** A metered cost accrual, flushed to `ledger_entries` at deliver. */
export interface Spend {
  provider: string;
  kind: 'free' | 'paid' | 'ai';
  spend: number;
  calls: number;
}

/** Result of one scrape fetch. */
export interface ScrapeResult {
  url: string;
  /** Visible text, whitespace-collapsed. */
  text: string;
  /** mailto: addresses found in the markup. */
  mailtos: string[];
  /** Which fetch path produced this: plain fetch or a headless browser. */
  via: 'fetch' | 'playwright' | 'brightdata' | 'apify';
}

/** A discovered target company (before we create a `targets` row). */
export interface DiscoveredTarget {
  domain: string;
  name?: string;
  vertical?: string | null;
}

/** Email verification outcome. */
export interface VerifyOutcome {
  email: string;
  mxFound: boolean;
  /** SMTP RCPT accepted (only when a probe actually ran). */
  accepted: boolean;
  catchAll: boolean;
  provider: string;
  method: string;
  confidence: number;
}

/** Base identity shared by all adapters. */
export interface Adapter {
  /** Matches ProviderDef.name in @lead/core PROVIDER_CATALOG. */
  readonly provider: string;
  readonly kind: ProviderKind;
  /** Env/key present so this adapter can actually do real work. */
  available(): boolean;
}

// --- Category interfaces ----------------------------------------------------

export interface DiscoveryCtx {
  log: Log;
  vertical: string | null;
  limit: number;
}

export interface DiscoveryAdapter extends Adapter {
  discover(input: RunInput, ctx: DiscoveryCtx): Promise<DiscoveredTarget[]>;
}

export interface ScrapeAdapter extends Adapter {
  scrape(url: string, log: Log): Promise<ScrapeResult | null>;
}

export interface ExtractCtx {
  log: Log;
  domain: string;
  model: string;
}

export interface ExtractAdapter extends Adapter {
  extract(text: string, ctx: ExtractCtx): Promise<Person[]>;
}

export interface EnrichCtx {
  log: Log;
  domain: string;
  vertical: string | null;
  /** Company name if known — helps registry/person lookups. */
  companyName: string | null;
  /** Records a metered cost accrual. */
  spend(s: Spend): void;
}

export interface EnrichAdapter extends Adapter {
  /** Returns an updated person (email/phone/sources), or null if nothing found. */
  enrich(person: Person, ctx: EnrichCtx): Promise<Person | null>;
}

export interface VerifyAdapter extends Adapter {
  verify(email: string, log: Log): Promise<VerifyOutcome | null>;
}
