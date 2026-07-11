-- ============================================================================
-- Lead Booster Pro — initial schema
-- Orgs, membership, ICP profiles, sources/keys, runs, targets, companies,
-- contacts, evidence, and the spend ledger.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Organizations & membership
-- ---------------------------------------------------------------------------

create type run_profile as enum ('scraper', 'free-max', 'hunter-apollo', 'full-stack');
create type member_role as enum ('owner', 'admin', 'member');

create table orgs (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  default_profile run_profile not null default 'free-max',
  free_first      boolean not null default true,
  threshold       numeric(3, 2) not null default 0.70,
  paid_enabled    boolean not null default true,
  created_at      timestamptz not null default now()
);

create table members (
  id       uuid primary key default gen_random_uuid(),
  org_id   uuid not null references orgs (id) on delete cascade,
  user_id  uuid not null references auth.users (id) on delete cascade,
  role     member_role not null default 'member',
  email    text not null,
  name     text,
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index members_user_idx on members (user_id);
create index members_org_idx on members (org_id);

-- ---------------------------------------------------------------------------
-- ICP profiles (targeting rubric)
-- ---------------------------------------------------------------------------

create table icp_profiles (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references orgs (id) on delete cascade,
  name            text not null default 'Default ICP',
  industries      jsonb not null default '[]',
  emp_min         int not null default 0,
  emp_max         int not null default 100000,
  rev_band        text,
  geo             text,
  company_type    text,
  tech_has        text default '',
  tech_not        text default '',
  signals         jsonb not null default '[]',
  seniority       jsonb not null default '[]',
  functions       jsonb not null default '[]',
  title_keywords  text default '',
  disqualifiers   text default '',
  tier_cut        text not null default '60 / 75 / 90',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index icp_org_idx on icp_profiles (org_id);

-- ---------------------------------------------------------------------------
-- Sources / provider credentials
-- We never store raw secrets in the row that the client can read; the actual
-- secret lives in Vault (or an encrypted column) — this table tracks status,
-- last4, and budgets for the UI. `secret_ref` points to the stored secret.
-- ---------------------------------------------------------------------------

create type source_status as enum ('valid', 'invalid', 'off');

create table source_keys (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs (id) on delete cascade,
  provider    text not null,
  status      source_status not null default 'off',
  last4       text,
  secret_ref  text,
  budget_cap  numeric(10, 2),
  budget_used numeric(10, 2) not null default 0,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, provider)
);

create index source_keys_org_idx on source_keys (org_id);

-- ---------------------------------------------------------------------------
-- Companies (accounts) — keyed by domain within an org
-- ---------------------------------------------------------------------------

create table companies (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs (id) on delete cascade,
  domain       text not null,
  name         text not null,
  industry     text,
  employees    text,
  revenue      text,
  hq           text,
  company_type text,
  tech         jsonb not null default '[]',
  fit          int not null default 0,
  intent       int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (org_id, domain)
);

create index companies_org_idx on companies (org_id);

-- ---------------------------------------------------------------------------
-- Runs & targets
-- ---------------------------------------------------------------------------

create type run_status as enum ('queued', 'running', 'paused', 'completed', 'failed', 'cancelled');
create type target_status as enum ('queued', 'running', 'repairing', 'failed', 'done', 'cancelled');
create type pipeline_stage as enum ('discover', 'scrape', 'extract', 'enrich', 'verify', 'score', 'deliver');
create type activity_kind as enum ('idle', 'free', 'paid', 'danger');

create table runs (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references orgs (id) on delete cascade,
  created_by     uuid references auth.users (id) on delete set null,
  label          text not null default 'Untitled run',
  profile        run_profile not null default 'free-max',
  status         run_status not null default 'queued',
  input          jsonb not null default '{}',
  icp_profile_id uuid references icp_profiles (id) on delete set null,
  spend_free     numeric(12, 4) not null default 0,
  spend_paid     numeric(12, 4) not null default 0,
  targets_total  int not null default 0,
  targets_done   int not null default 0,
  contacts_found int not null default 0,
  started_at     timestamptz,
  finished_at    timestamptz,
  created_at     timestamptz not null default now()
);

create index runs_org_idx on runs (org_id, created_at desc);
create index runs_status_idx on runs (status);

create table targets (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid not null references runs (id) on delete cascade,
  org_id        uuid not null references orgs (id) on delete cascade,
  domain        text not null,
  vertical      text,
  stage         pipeline_stage not null default 'discover',
  status        target_status not null default 'queued',
  activity      text not null default 'queued…',
  activity_kind activity_kind not null default 'idle',
  found         int not null default 0,
  retries       int not null default 0,
  spend         numeric(12, 4) not null default 0,
  icp           int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index targets_run_idx on targets (run_id);
create index targets_org_idx on targets (org_id);

-- ---------------------------------------------------------------------------
-- Contacts (people) + evidence
-- ---------------------------------------------------------------------------

create type email_status as enum ('deliverable', 'risky', 'guess', 'unknown');
create type tier as enum ('A', 'B', 'C');

create table contacts (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs (id) on delete cascade,
  run_id       uuid references runs (id) on delete set null,
  company_id   uuid references companies (id) on delete set null,
  name         text not null,
  title        text,
  company_name text,
  domain       text,
  vertical     text,
  email        text,
  email_status email_status not null default 'unknown',
  phone        text,
  fit          int not null default 0,
  intent       int not null default 0,
  tier         tier not null default 'C',
  sources      jsonb not null default '[]',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index contacts_org_idx on contacts (org_id, created_at desc);
create index contacts_run_idx on contacts (run_id);
create index contacts_domain_idx on contacts (org_id, domain);
create index contacts_email_status_idx on contacts (org_id, email_status);
create index contacts_tier_idx on contacts (org_id, tier);

-- Full evidence timeline per contact (append-only provenance events).
create table evidence (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references orgs (id) on delete cascade,
  contact_id uuid not null references contacts (id) on delete cascade,
  field      text not null,
  value      text not null,
  provider   text,
  method     text,
  confidence numeric(3, 2),
  tone       text not null default 'green',
  created_at timestamptz not null default now()
);

create index evidence_contact_idx on evidence (contact_id, created_at);

-- ---------------------------------------------------------------------------
-- Spend ledger
-- ---------------------------------------------------------------------------

create type ledger_kind as enum ('free', 'paid', 'ai');

create table ledger_entries (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references orgs (id) on delete cascade,
  run_id     uuid references runs (id) on delete set null,
  provider   text not null,
  kind       ledger_kind not null,
  spend      numeric(12, 4) not null default 0,
  calls      int not null default 0,
  created_at timestamptz not null default now()
);

create index ledger_org_idx on ledger_entries (org_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Agent chat (Talk screen)
-- ---------------------------------------------------------------------------

create table talk_messages (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references orgs (id) on delete cascade,
  user_id    uuid references auth.users (id) on delete set null,
  role       text not null check (role in ('user', 'agent')),
  text       text not null,
  created_at timestamptz not null default now()
);

create index talk_org_idx on talk_messages (org_id, created_at);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_icp_updated before update on icp_profiles
  for each row execute function set_updated_at();
create trigger trg_source_keys_updated before update on source_keys
  for each row execute function set_updated_at();
create trigger trg_companies_updated before update on companies
  for each row execute function set_updated_at();
create trigger trg_targets_updated before update on targets
  for each row execute function set_updated_at();
create trigger trg_contacts_updated before update on contacts
  for each row execute function set_updated_at();
