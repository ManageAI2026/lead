-- ============================================================================
-- Onboarding helpers: create an org and make the caller its owner atomically,
-- plus seed a default ICP profile. Called from the signup/onboarding flow.
-- ============================================================================

create or replace function create_org_with_owner(
  org_name text,
  org_slug text,
  owner_email text,
  owner_name text default null,
  profile run_profile default 'free-max'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org uuid;
begin
  if auth.uid() is null then
    raise exception 'must be authenticated';
  end if;

  insert into orgs (name, slug, default_profile)
  values (org_name, org_slug, profile)
  returning id into new_org;

  insert into members (org_id, user_id, role, email, name)
  values (new_org, auth.uid(), 'owner', owner_email, owner_name);

  insert into icp_profiles (org_id, name, industries, seniority, functions, tier_cut)
  values (
    new_org,
    'Default ICP',
    '[]'::jsonb,
    '["Owner", "CXO", "Director"]'::jsonb,
    '["Operations", "Sales"]'::jsonb,
    '60 / 75 / 90'
  );

  return new_org;
end;
$$;

grant execute on function create_org_with_owner(text, text, text, text, run_profile) to authenticated;
