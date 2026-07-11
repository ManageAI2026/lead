# @lead/worker — Lead Booster Pro pipeline worker

The worker consumes lead-generation jobs from Redis (BullMQ) and drives each run
through the seven-stage pipeline, writing live status and final contacts to
Supabase. It runs on a Hetzner box; the Next.js app (`apps/web`) only enqueues
jobs and reads the results via Supabase realtime.

## Pipeline

```
RunJob ──► discover ──► (fan out one TargetJob per domain)
TargetJob ─► scrape ─► extract ─► enrich ─► verify ─► score ─► deliver
```

1. **discover** — `RunInput` → target domains. `company`/`person` → the one
   domain; `csv` → rows from Supabase storage; `prompt`/`sweep` → Google Places
   when `GOOGLE_PLACES_API_KEY` is set, otherwise a **deterministic stub** that
   seeds a plausible per-vertical list so the pipeline runs end-to-end with zero
   keys. Inserts `targets` rows and enqueues a `TargetJob` each.
2. **scrape** — fetches `/team`, `/about`, `/contact`, `/` (and a few common
   variants). Plain `fetch` first; falls back to Playwright (Chromium) for
   JS-rendered pages. Degrades gracefully — an unreachable site flips the target
   `repairing → running` once and continues with limited data.
3. **extract** — sends scraped text to Claude (`ANTHROPIC_MODEL_EXTRACT`) with a
   forced tool call returning `{name, title, email?, phone?}`. Falls back to a
   free regex/heuristic extractor when there is no `ANTHROPIC_API_KEY`.
4. **enrich** — pattern-guesses missing emails (`guessEmail`), runs free registry
   adapters (NPI is a **real** public API), then — only if the run profile allows
   paid providers, a valid `SourceKey` exists, and confidence is still below the
   threshold — walks the paid waterfall (Hunter → Apollo → PDL).
5. **verify** — real MX lookup via `node:dns` + optional conservative SMTP RCPT
   probe (`SMTP_PROBE=true`); escalates to NeverBounce when the profile allows it.
   `EmailStatus` is derived by `@lead/core` `deriveEmailStatus`.
6. **score** — `fitPrior` (always) plus an optional Claude Sonnet rubric pass
   (`ANTHROPIC_MODEL_SCORE`); heuristic intent; `tierForFit` for A/B/C.
7. **deliver** — upserts the `companies` row, inserts `contacts`, appends
   aggregated `ledger_entries`, and optionally exports a CSV to storage / POSTs a
   webhook.

Each stage patches the `targets` row (`stage`, `status`, `activity`,
`activity_kind`, `found`, `retries`, `spend`, `icp`) so the dashboard reflects
live progress, and rolls tallies up onto the `runs` row.

## Adapters

`src/adapters/<category>/<provider>.ts` — one file per adapter, all implementing
the common interfaces in `src/adapters/types.ts`. Every adapter **no-ops
gracefully** (returns null/empty) when its key/env is absent and logs which path
it took (`live` / `stub` / `skipped`).

| Category | Adapters | Real vs stub |
| --- | --- | --- |
| discovery | `places.ts`, `stub.ts` | Places real (key-guarded); stub deterministic (the one intentional demo stub) |
| registry | `npi.ts`, `sam.ts` | NPI **real keyless API**; SAM real shape, key-guarded |
| enrich | `hunter.ts`, `apollo.ts`, `pdl.ts` | Real HTTP, key-guarded (paid) |
| verify | `mxsmtp.ts`, `neverbounce.ts` | MX/SMTP **real**; NeverBounce real, key-guarded |
| scrape | `fetch.ts`, `playwright.ts` | Both real, built-in |
| extract | `claude.ts`, `heuristic.ts` | Claude real (key-guarded); heuristic real fallback |
| score | `claude.ts`, `prior.ts` | Prior real; Claude real (key-guarded) |
| deliver | `supabase.ts`, `csv.ts`, `webhook.ts` | All real |

The **paid gate** (`src/registry.ts`) decides whether a paid adapter may fire:
run profile → valid+enabled `SourceKey` → confidence below threshold → budget cap.

## Environment

See the repo-root `.env.example`. Key variables:

| Var | Purpose |
| --- | --- |
| `REDIS_URL` | BullMQ transport (default `redis://localhost:6379`) |
| `WORKER_CONCURRENCY` | Parallel jobs (default 4) |
| `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (server-only) |
| `ANTHROPIC_API_KEY` | Enables Claude extract + score (else heuristics) |
| `ANTHROPIC_MODEL_EXTRACT` / `ANTHROPIC_MODEL_SCORE` | Model ids |
| `GOOGLE_PLACES_API_KEY` | Real discovery (else stub) |
| `HUNTER_API_KEY` / `APOLLO_API_KEY` / `PDL_API_KEY` / `NEVERBOUNCE_API_KEY` | Paid adapters |
| `SAM_GOV_API_KEY` | SAM.gov (free key, ~10/day) |
| `SMTP_PROBE` | `true` to enable the SMTP RCPT probe (off by default; many cloud IPs block port 25) |
| `PAID_THRESHOLD` | Confidence below which paid providers may fire (default 0.70) |
| `DELIVER_WEBHOOK_URL` | Optional delivery webhook |

Without any keys the pipeline still runs end-to-end: stub discovery → real scrape
→ heuristic extract → free enrich (NPI) → MX verify → prior score → Supabase
deliver.

## Run locally

```bash
# 1. Redis
docker run -p 6379:6379 redis:7-alpine

# 2. From the repo root — build core, then dev the worker
npm install
npm run build --workspace packages/core
npm run dev --workspace apps/worker      # tsx watch

# (the web app enqueues RunJobs; or add one manually to the 'lead-pipeline' queue)
```

Scripts: `build` (tsc), `dev` (tsx watch), `typecheck`, `start` (node dist).

## Deploy to Hetzner (Docker)

Build with the **repo root** as context (the image needs `packages/core`):

```bash
docker build -f apps/worker/Dockerfile -t lead-worker .
docker run -d --name lead-worker --env-file .env --restart unless-stopped lead-worker
```

The base image (`mcr.microsoft.com/playwright:v1.48.0-jammy`) ships Chromium, so
the Playwright fallback works with no extra install. For the leanest build
context, mirror `apps/worker/.dockerignore` into a root `.dockerignore`.
