# Readiness Report — Linking the Dashboard to the Shared Supabase + Server

**Date:** 2026-07-13 · **Branch:** `claude/lead-booster-companion-assess-3lin9a`
**Question answered:** what is still needed, end to end, before this dashboard is live against the shared Supabase project and the server/gateway.

The code-side Phase 1 work is **done** (schema remap, queue removal, migration retirement, honest 501 action stubs, logout). What remains is (A) configuration only you can supply, (B) facts only the server repo can confirm, and (C) the Phase 2 gateway work that is blocked until the server is booted.

---

## A. To link to Supabase (viewable + logged-in) — configuration you must supply

Nothing in this repo contains real credentials. Create `apps/web/.env.local` (and mirror in Vercel → Project → Environment Variables):

| # | Item | Where | Detail |
|---|---|---|---|
| A1 | `NEXT_PUBLIC_SUPABASE_URL` | shared project → Settings → API | The **server's** project, not a new one |
| A2 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page | Auth + RLS reads |
| A3 | `SUPABASE_SERVICE_ROLE_KEY` | same page | Server-only; no live route uses it today but keep it set |
| A4 | `SUPABASE_JWT_SECRET` | same page → JWT settings | Required for anything server-side that verifies Supabase JWTs (the gateway will; the dashboard itself validates sessions via the anon key) |
| A5 | Auth redirect allowlist | Supabase → Auth → URL Configuration | Add `http://localhost:3000/auth/callback` and `https://<your-vercel-domain>/auth/callback`, or email-link/OAuth login bounces |
| A6 | Realtime enabled on `jobs` + `targets` | Supabase → Database → Replication | The run canvas subscribes to `postgres_changes` on both; without it the page still renders but never animates |
| A7 | A provisioned test user | server-side | **Onboarding in this app is cosmetic — it creates nothing.** A fresh signup has no `memberships` row, so every screen shows the empty state. The server (or a manual SQL insert) must create the org + membership for your first login test |
| A8 | RLS read policies on the shared tables | server repo | Members must be able to SELECT `orgs, memberships, jobs, targets, people, companies, run_profiles, org_provider_configs, usage_ledger, talk_messages` scoped to their org, UPDATE `orgs` (settings) and `jobs.status` (pause/resume). This repo deleted its own RLS migration; policies are wholly the server's |

**Verification once A1–A8 are set** (`npm install && npm run build && npm run dev:web`):
login at `/login` → `/app` shows real jobs → Data shows `people` rows → Sources/Billing/Settings populate → CSV export downloads → org settings PATCH persists → logout button (sidebar footer) returns you to `/login` and `/app` is blocked again. If pages render but are **empty**, the order of suspects is: no membership row (A7) → RLS policy gap (A8) → column-name mismatch (B below — screens render blanks by design instead of crashing).

## B. To be confirmed against the server repo — schema facts I could not verify from here

The remap used the agreed table names with **defensive mappers** (missing columns become blanks/zeros, not crashes). Confirm these against the server's actual schema and tighten `apps/web/lib/data.ts` where the guesses are wrong:

| # | Assumption made | Where |
|---|---|---|
| B1 | `memberships` has `org_id, user_id, role, created_at`; may or may not carry `email`/`name` | `mapMember` |
| B2 | `jobs` has `status, profile, input, label, created_by, spend_free/spend_paid, targets_total/done, contacts_found, started/finished_at`; profile link may be `icp_profile_id` or `run_profile_id` (advisory) | `mapRun` |
| B3 | `run_profiles.config` (jsonb) holds the ICP rubric; keys accepted in camelCase or snake_case | `mapIcp` |
| B4 | `org_provider_configs` keeps `provider, status, enabled` flat, budget/last4 possibly inside a `config` jsonb | `mapSourceKey` |
| B5 | `usage_ledger` uses `spend/calls` (falls back to `amount/quantity`), `run_id` (falls back to `job_id`) | `mapLedger` |
| B6 | `run_events` has `job_id, kind|type, message|detail, created_at` | `getRunEvents` |
| B7 | **Unmapped tables kept under old names:** `orgs`, `targets`, `companies`, `talk_messages`. If the server renamed any of these, the Runs canvas, Data→Companies, and Talk history read empty — tell me the real names and it's a one-line fix each |
| B8 | `jobs.status` values still include `queued/running/paused/completed/failed/cancelled` (the UI branches on them) | RunsClient, `getActiveRun` |

## C. To link to the server (actions) — Phase 2, blocked on the gateway being booted

The dashboard's three mutating actions return **501 "action pending gateway connection"** by design. To go live the server must expose, over TLS at a reachable URL:

| # | Endpoint needed | Replaces |
|---|---|---|
| C1 | dispatch job (profile, input, advisory run_profile id) → creates the `jobs` row server-side | `POST /api/runs` stub |
| C2 | connect/validate/store provider credential (writes `org_provider_configs` + secret vault) | `POST /api/sources` stub |
| C3 | operator/agent message → reply (writes `talk_messages`) | `POST /api/talk` stub |
| C4 | onboarding/provisioning (create org + membership + default run_profile) | nothing today — fixes A7 permanently |
| C5 | (optional) pause/resume job — currently a direct RLS `jobs.status` update from the browser; move behind the gateway if the server forbids member UPDATE |
| C6 | Auth contract: gateway accepts the user's Supabase access token (Authorization: Bearer) and verifies it with `SUPABASE_JWT_SECRET` | — |

Dashboard-side work once C1–C6 exist (small, ~a day): build `apps/web/lib/gateway.ts` (typed fetch client on `NEXT_PUBLIC_GATEWAY_URL`, forwards the session token), swap the three 501 stubs to gateway calls, wire onboarding to C4, then delete `apps/worker`, `docker-compose.yml`, and `packages/core/src/queue.ts`. Env vars are already stubbed in `.env.example` (`NEXT_PUBLIC_GATEWAY_URL`, `GATEWAY_API_SECRET`, commented out).

## D. Logistics

- **This session cannot push** (403, read-only). All commits are on local branch `claude/lead-booster-companion-assess-3lin9a` and have been handed over as `git am` patches — apply and push from your machine (commands provided in chat), or grant the session write access and I'll push + open the draft PR.
- Commits to date: assessment report → Phase 1 conversion → hero logo cleanup → logout + this report.

## TL;DR

Code is ready to *view*: set 4 env vars (A1–A4), allowlist the callback (A5), enable realtime (A6), and log in with a server-provisioned user (A7) — that's a working read-only dashboard the same day. Actions stay honestly 501 until the server gateway exposes C1–C6, after which the cutover in this repo is small and already scoped. The only real unknowns are the column-level facts in B, which take one look at the server's schema to settle.
