# Migrations retired — the server owns the schema

This dashboard is a **companion** to the ManageAI server. The shared Supabase
project's schema (memberships, people, contact_evidence, org_provider_configs,
usage_ledger, jobs, run_events, run_profiles, …) is defined and migrated from
the **server repository**, not from here.

The standalone migrations that used to live in this directory
(`0001_init.sql`, `0002_rls.sql`, `0003_onboarding.sql`) created the old
standalone schema (members, contacts, evidence, source_keys, ledger_entries,
runs) and were removed so this repo can never recreate it. Do not add
migrations here; make schema changes in the server repo.
