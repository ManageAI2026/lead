# Dashboard State Report — Server-Companion Conversion Assessment

**Date:** 2026-07-13
**Repo:** `ManageAI2026/lead` (lead-booster-pro monorepo, `@lead/*` workspaces)
**Branch assessed:** `claude/lead-booster-companion-assess-3lin9a` (identical to `main` @ `05aeca8`)

## Verdict: NOT-DONE

The server-companion conversion **did not land — at all**. The codebase is still the
original standalone app: its own schema, its own migrations, its own BullMQ/Redis
queue, and a template-only Supabase config. There is no partial migration, no
gateway client, no dangling half-renamed tables. Whatever the previous session did,
none of it was committed to this repository or pushed to any branch on the remote.

---

## 1. Schema Adoption — NOT-DONE

Every old table name is still in active use; **zero** of the new server-schema names
appear anywhere in the code.

| Old name (frontend) | Expected new name | Old still used? | New name present? |
|---|---|---|---|
| `members` | `memberships` | ✅ yes — `lib/data.ts`, `api/org`, `api/export`, `api/sources`, `api/runs`, `api/talk` | ❌ no (0 hits) |
| `contacts` | `people` | ✅ yes — `lib/data.ts`, `api/export`, `api/talk`, worker deliver adapter | ❌ no (only the English word "people" in marketing copy) |
| `evidence` | `contact_evidence` | ✅ yes — `apps/worker/src/adapters/score/prior.ts` | ❌ no (0 hits) |
| `source_keys` | `org_provider_configs` | ✅ yes — `api/sources`, `lib/data.ts`, `worker/src/db.ts` | ❌ no (0 hits) |
| `ledger_entries` | `usage_ledger` | ✅ yes — `lib/data.ts`, worker deliver adapter, worker types | ❌ no (0 hits) |
| `runs` | `jobs` (+ `run_events`) | ✅ yes — `api/runs`, `api/talk`, `lib/data.ts`, `worker/src/db.ts`, `RunsClient.tsx` | ❌ no (`run_events`: 0 hits; "jobs" hits are BullMQ job objects and UI copy, not a table) |

**This repo's own migrations were NOT retired.** `supabase/migrations/` still
contains `0001_init.sql`, `0002_rls.sql`, `0003_onboarding.sql`, and `0001_init.sql`
still does `create table members / source_keys / runs / contacts / evidence /
ledger_entries` — the old standalone schema in full.

## 2. Gateway Bridge — NOT-DONE

- **`apps/web/lib/queue.ts` still exists** and is a server-only BullMQ producer
  (`new Queue(QUEUE_NAME, { connection })` over ioredis).
- **No `lib/gateway.ts`** or any gateway client exists. A case-insensitive grep for
  `gateway` / `GATEWAY` / `NEXT_PUBLIC_GATEWAY_URL` across `apps/` and `packages/`
  returns **zero hits**.
- **`app/api/runs/route.ts` still imports `enqueue` from `@/lib/queue`** and
  enqueues a `RunJob` to BullMQ after inserting into the `runs` table
  (`apps/web/app/api/runs/route.ts:3,72`).
- `app/api/sources/route.ts` and `app/api/talk/route.ts` write directly to Supabase
  (`source_keys`, `talk_messages`) — no gateway calls anywhere.
- **`bullmq` (^5.12.0) and `ioredis` (^5.4.1) are still dependencies** in
  `apps/web/package.json`, and `.env.example` still documents
  `REDIS_URL=redis://localhost:6379` as the "BullMQ job queue between web API and
  Hetzner worker."

**Actions going to the gateway: none. Actions on the local queue/direct DB: all of them.**

## 3. Supabase Wiring — NOT-DONE (never repointed)

- Only `.env.example` exists (no `.env`, `.env.local`, or `.env` in `apps/web`).
  `NEXT_PUBLIC_SUPABASE_URL` is the unchanged placeholder
  `https://YOUR-PROJECT.supabase.co` — it does not point at the shared server
  project (or any project).
- **`SUPABASE_JWT_SECRET` is absent everywhere** — not in `.env.example` and not
  referenced by any code. If the shared server's auth requires it, auth will fail
  until it's added.
- The Supabase client code (`apps/web/lib/supabase/client.ts`, `server.ts`) is the
  original standalone version: browser client, cookie-bound server client, and a
  service-role client — no changes for a shared project, no JWT handling.

## 4. What Actually Committed — NOTHING FROM THE CONVERSION

```
05aeca8 Add Manage AI logo to hero
39a49e3 Add files via upload
1e13175 Merge pull request #2 (claude/scraper-dashboard-build-n1fcg6)
f345c95 Make middleware resilient when Supabase env is unset
ed8f6a0 Simplify Vercel config; drop bundle artifact
26d45c5 Simplify Vercel config; drop bundle artifact
679f74b Merge pull request #1 (claude/scraper-dashboard-build-n1fcg6)
e670efb Remove bundle artifact from repo
d7aabe9 Merge remote-tracking branch 'origin/main' into claude/scraper-dashboard-build-n1fcg6
d820142 Add files via upload
6e7a68d Initial commit
7306a74 Add dashboard (Runs/Data/Talk/Build/Sources/Billing/Settings) + API routes
2869207 Add pipeline worker (Discover→Scrape→Extract→Enrich→Verify→Score→Deliver)
680b3df Add marketing site (...)
cece809 Scaffold Lead Booster Pro monorepo foundation
```

Every commit is from the original standalone build-out (marketing site, worker,
dashboard) plus cosmetic follow-ups. **No commit mentions or touches schema
remapping, a gateway, or companion conversion.**

- `git status`: working tree **clean** — no uncommitted changes.
- `git stash list`: **empty** — nothing stashed.
- Remote branches (`git ls-remote`): only `main` and
  `claude/scraper-dashboard-build-n1fcg6`. **No companion/merge branch exists on
  the remote** — the previous session's work was not pushed anywhere in this repo.

## 5. Does It Build? — YES (which confirms "untouched", not "half-migrated")

- `npm run typecheck` (all workspaces: `@lead/core`, `@lead/web`, `@lead/worker`):
  **PASS** with zero errors (after building `packages/core` once so the worker can
  resolve `@lead/core` — a normal fresh-clone step, not a defect).
- `npm run build` (core + web, Next.js 14 production build): **PASS** — all routes
  compile, including all five `app/api/*` routes.

A half-applied schema remap would fail to compile. It compiles cleanly because
**nothing was changed** — this is the pristine standalone app.

---

## Next Step to Finish It

The conversion has to be done from scratch; there is no partial work to salvage.
In dependency order, as one coherent change:

1. **Add the gateway client** — create `apps/web/lib/gateway.ts`: a typed fetch
   client reading `NEXT_PUBLIC_GATEWAY_URL` (browser-visible base) plus a
   server-side auth header/secret; add both to `.env.example`.
2. **Cut the queue over** — rewrite `app/api/runs/route.ts` (and any other
   dispatching route: `sources` key-validation, `talk`) to call the gateway instead
   of `enqueue()`; then delete `apps/web/lib/queue.ts` and drop `bullmq`, `ioredis`,
   and `REDIS_URL` from `apps/web/package.json` / `.env.example`. Decide the fate of
   `apps/worker` (retire it — the server now owns the pipeline).
3. **Remap the schema** — global rename in `apps/web` (`lib/data.ts` is the hub, plus
   the five `api/*` routes and dashboard components): `members→memberships`,
   `contacts→people`, `evidence→contact_evidence`, `source_keys→org_provider_configs`,
   `ledger_entries→usage_ledger`, `runs→jobs`/`run_events` — including column-level
   differences the server schema may have, not just table names.
4. **Retire local migrations** — delete `supabase/migrations/0001–0003` (and the
   `db:reset`/`db:push` root scripts) so this repo can never recreate the standalone
   schema; the server repo owns the schema.
5. **Repoint Supabase** — set `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` to the shared
   server project and add `SUPABASE_JWT_SECRET` to the env template and wherever the
   server-side auth verification needs it.
6. **Verify** — `npm run typecheck && npm run build` must pass with zero references
   to the old table names (grep should come back empty), then exercise a run
   dispatch end-to-end against the gateway.
