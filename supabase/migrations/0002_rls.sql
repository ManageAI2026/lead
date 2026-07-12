-- ============================================================================
-- Row-level security. Every tenant table is scoped to the caller's org
-- membership. The worker uses the service role, which bypasses RLS.
-- ============================================================================

-- Helper: is the current user a member of :org?
create or replace function is_org_member(target_org uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from members m
    where m.org_id = target_org and m.user_id = auth.uid()
  );
$$;

-- Helper: does the current user have admin/owner rights in :org?
create or replace function is_org_admin(target_org uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from members m
    where m.org_id = target_org and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  );
$$;

alter table orgs            enable row level security;
alter table members         enable row level security;
alter table icp_profiles    enable row level security;
alter table source_keys     enable row level security;
alter table companies       enable row level security;
alter table runs            enable row level security;
alter table targets         enable row level security;
alter table contacts        enable row level security;
alter table evidence        enable row level security;
alter table ledger_entries  enable row level security;
alter table talk_messages   enable row level security;

-- orgs: members can read; admins can update.
create policy orgs_select on orgs for select
  using (is_org_member(id));
create policy orgs_update on orgs for update
  using (is_org_admin(id));
-- Any authenticated user can create an org (they become owner via app logic).
create policy orgs_insert on orgs for insert to authenticated
  with check (true);

-- members: you can see members of orgs you belong to; admins manage.
create policy members_select on members for select
  using (is_org_member(org_id));
create policy members_insert on members for insert to authenticated
  with check (is_org_admin(org_id) or user_id = auth.uid());
create policy members_update on members for update
  using (is_org_admin(org_id));
create policy members_delete on members for delete
  using (is_org_admin(org_id));

-- Generic member-scoped read/write for tenant data tables.
create policy icp_all on icp_profiles for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));

-- source_keys: readable by members, but secret_ref is filtered at the app layer.
create policy source_keys_all on source_keys for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));

create policy companies_all on companies for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));

create policy runs_all on runs for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));

create policy targets_all on targets for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));

create policy contacts_all on contacts for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));

create policy evidence_all on evidence for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));

-- ledger is read-only from the client (worker writes via service role).
create policy ledger_select on ledger_entries for select
  using (is_org_member(org_id));

create policy talk_all on talk_messages for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));

-- ---------------------------------------------------------------------------
-- Realtime: the dashboard subscribes to live target/run updates.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table runs;
alter publication supabase_realtime add table targets;
alter publication supabase_realtime add table contacts;
