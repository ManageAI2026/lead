# Dashboard Phase 1 Report — Server-Companion Conversion (viewable-and-logged-in first)

**Date:** 2026-07-13 · **Branch:** `claude/lead-booster-companion-assess-3lin9a`
**Scope:** Phase 1 only — schema remap, migration retirement, Supabase repoint, honest 501 action stubs. The gateway client (Phase 2) is intentionally NOT built; the gateway isn't booted yet.

## Status: Phase 1 code complete — typecheck ✅ build ✅ old-name grep ✅ (apps/web)

Live verification against the shared Supabase (login + real rows) could **not** be run from this environment because the shared project's URL/keys are not available here — see "What you must supply" below. Everything code-side is done and proven compilable.

---

## 1. What's wired (works now, no gateway needed)

All dashboard **reads** go through `apps/web/lib/data.ts` under the signed-in user's RLS session, now against the server schema:

| Screen / helper | Table now read | Old table |
|---|---|---|
| Session/org (`getSessionContext`, `getMembers`) | `memberships` | `members` |
| Runs (`getActiveRun`, `getRecentRuns`) | `jobs` | `runs` |
| Run event log (`getRunEvents` — new helper) | `run_events` | — |
| Data screen (`getContacts`, `getContactCountsByDomain`), CSV export | `people` | `contacts` |
| ICP rubrics (`getIcpProfiles`) | `run_profiles` (rubric read from `config` jsonb) | `icp_profiles` |
| Sources screen (`getSourceKeys`) | `org_provider_configs` | `source_keys` |
| Billing (`getLedger`, `getLedgerByProvider`) | `usage_ledger` | `ledger_entries` |
| Realtime (RunsClient) | `jobs` UPDATE + `targets` * | `runs` + `targets` |

Also still live (no queue involved):
- **`PATCH /api/org`** — org settings update, direct under RLS (now reads `memberships`).
- **`GET /api/export`** — CSV export of `people` under RLS.
- **Auth**: middleware (route protection), `/login`, `/signup`, `/auth/callback` — all pure Supabase Auth (`@supabase/ssr`), no table dependencies; they work against the shared project as soon as the env vars point at it.
- **Pause/resume** in RunsClient writes `jobs.status` directly under RLS (flagged for gateway cutover in Phase 2).

### Column-level handling (important caveat)
The server repo's exact column list wasn't available in this repository, so the mappers in `lib/data.ts` were made **defensive** rather than assumptive:
- `mapMember`: `email`/`name` fall back to `''`/`null` if `memberships` doesn't denormalize them.
- `mapRun` (jobs): counters (`spend_free`, `targets_done`, `contacts_found`…) default to 0 if absent; `icp_profile_id` falls back to `run_profile_id`; the id is **advisory** (no FK assumed).
- `mapIcp`: reads the rubric from `run_profiles.config` (accepts camelCase or snake_case keys), falling back to flat columns.
- `mapSourceKey` / `mapLedger`: accept fields either flat or inside a `config` jsonb; `spend`/`calls` fall back to `amount`/`quantity`.

If the server's real column names differ from these guesses, screens will render with defaults (zeros/blanks) rather than crash — when you see that, fix the mapper, don't trust the blank.

**Not remapped (not in the given mapping — verify against the server schema):** `orgs`, `targets`, `companies`, `talk_messages`. These names were kept as-is. If the server renamed any of them, the Runs canvas (`targets` + realtime), Data→Companies, and Talk history will come back empty.

## 2. What's stubbed pending the gateway (Phase 2)

All three action routes authenticate, validate the body, then return **`501 { error: "action pending gateway connection" }`** — they no longer write anything:

- **`POST /api/runs`** — no longer inserts a `jobs` row or enqueues. Job creation belongs to the gateway; writing queued rows nothing will process would pollute the shared table.
- **`POST /api/sources`** — no longer upserts fake-"valid" provider rows; credential validation/storage is the server's job. The Sources screen still *reads* `org_provider_configs`.
- **`POST /api/talk`** — no longer writes `talk_messages` or fakes a templated agent reply. Talk still *reads* history.

UI surfacing: TalkClient already showed API errors in-chat; RunsClient and SourcesClient previously swallowed failures silently, so both now alert with the API's error message — the 501 is visible, not a dead button.

### Queue teardown
- `apps/web/lib/queue.ts` **deleted**; no `enqueue()` remains in web.
- `bullmq` + `ioredis` removed from `apps/web/package.json` (lockfile updated); `serverComponentsExternalPackages` cleaned from `next.config.mjs`; `REDIS_URL` removed from the active env template.
- `apps/worker` **kept but deprecated** — prominent banner in `apps/worker/README.md`. It still targets the OLD schema and must not be deployed against the shared project. Delete in Phase 2.

### Migrations retired
`supabase/migrations/0001_init.sql`, `0002_rls.sql`, `0003_onboarding.sql` deleted; `db:reset`/`db:push` scripts removed from the root `package.json`. `supabase/migrations/README.md` + a root README banner state that the server repo owns the schema.

## 3. Exact env vars needed (apps/web/.env.local — none are in the repo)

| Var | Value | Why |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **shared server project** URL | I don't have it; the template has a labeled placeholder |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | shared project anon key | auth + RLS reads |
| `SUPABASE_SERVICE_ROLE_KEY` | shared project service key | server-only; currently unused by any live route but keep it set |
| `SUPABASE_JWT_SECRET` | shared project JWT secret (Settings → API → JWT) | **newly added to the template.** Note honestly: no code in the *dashboard* consumes it today — @supabase/ssr verifies sessions via the anon key. It's required by the server/gateway side to verify Supabase JWTs, and Phase 2's gateway client will forward tokens verified against it. If your shared project's auth "fails without it," the failure is server-side. |
| `NEXT_PUBLIC_APP_URL`, `ANTHROPIC_*`, provider keys | as before | unchanged |
| `NEXT_PUBLIC_GATEWAY_URL` / `GATEWAY_API_SECRET` | commented out in template | Phase 2 |

Also: in the shared Supabase project's Auth settings, add this app's domain to the redirect allowlist (`…/auth/callback`), and enable **Realtime** on `jobs` and `targets` or the run canvas won't animate.

## 4. Proof (step 5 of the spec)

- `npm run typecheck` — **PASS**, all three workspaces, zero errors.
- `npm run build` — **PASS** (only pre-existing supabase-js/Edge warning, unrelated).
- Old-table-name grep over `apps/web` source — **ZERO** hits for `'members' | 'contacts' | 'evidence' | 'source_keys' | 'ledger_entries' | 'icp_profiles'` or `from('runs')`. (`apps/worker` still contains old names by design — it's deprecated, undispatched, and Phase 2 deletes it.)
- **Login + real-rows check: NOT RUN** — requires the shared project's URL/keys, which aren't in this environment. Per instructions I'm flagging, not faking: run it once env vars are set. If `/app` renders empty with a valid login, suspect (in order): no `memberships` row for the user (see finding below), RLS policies on the shared tables not granting the member read, then column-name mismatches (blank-but-rendering screens).

## 5. Findings you should know about

1. **Onboarding never provisions anything.** `app/onboarding/page.tsx` is a purely cosmetic stepper — it never calls any API or RPC. The old `create_org_with_owner` RPC existed only in the now-deleted local migration and was never invoked by the app anyway. On the shared project, a fresh signup has **no `memberships` row**, so every screen renders the empty/no-org state. Either the server provisions org+membership at signup, or Phase 2 adds a gateway onboarding call. Until then, test with a user the server has already provisioned.
2. **Pause/resume writes `jobs` directly from the browser** (RunsClient `updateRunStatus`). Kept working under RLS and marked for gateway cutover — if the server's RLS forbids member UPDATE on `jobs`, the button becomes optimistic-only.
3. **`docker-compose.yml`** (redis + worker for Hetzner) is now dead infrastructure; left untouched, remove with the worker in Phase 2.

## Phase 2 checklist (when the gateway is booted + TLS + reachable)

1. `apps/web/lib/gateway.ts` — typed client on `NEXT_PUBLIC_GATEWAY_URL`, forwarding the user's Supabase access token.
2. Cut `POST /api/runs`, `POST /api/sources`, `POST /api/talk` (and RunsClient pause/resume) over from 501 to gateway calls.
3. Gateway-backed onboarding/provisioning call (fixes finding 1).
4. Delete `apps/worker`, `docker-compose.yml`, `packages/core/src/queue.ts`, and the worker section of `.env.example`.
