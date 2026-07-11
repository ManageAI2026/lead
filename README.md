# Lead Booster Pro

**Free-first B2B lead generation.** Point it at a company, a person, a CSV, or a
whole territory, and it finds decision-maker contacts from public data —
government registries, license boards, and company sites first, paid providers
only when you say so. Extraction and scoring run on Claude. By **ManageAI**.

This repository is the full product: the marketing site, the authenticated
dashboard, the pipeline worker, and the database.

```
┌────────────────────────┐        ┌──────────────────────────┐
│  apps/web  (Vercel)    │        │  apps/worker (Hetzner)   │
│  • marketing site      │        │  Discover → Scrape →     │
│  • dashboard (7 screens)│  ───▶ │  Extract → Enrich →      │
│  • API routes          │ enqueue│  Verify → Score → Deliver│
└──────────┬─────────────┘  jobs  └───────────┬──────────────┘
           │                                  │
           │  auth + data (RLS)     writes rows / realtime
           ▼                                  ▼
        ┌──────────────────────────────────────────┐
        │            Supabase (Postgres)           │
        │  orgs · runs · targets · contacts ·      │
        │  companies · evidence · sources · ledger │
        └──────────────────────────────────────────┘
                     ▲
             Redis (BullMQ queue) bridges web ⇆ worker
```

## Stack

| Piece            | Tech                                             | Hosted on |
| ---------------- | ------------------------------------------------ | --------- |
| Web app + API    | Next.js 14 (App Router), React 18                | Vercel    |
| Database + Auth  | Supabase (Postgres, Auth, Realtime, Storage)     | Supabase  |
| Pipeline worker  | Node 20 + BullMQ + Playwright + Anthropic SDK    | Hetzner   |
| Job queue        | Redis (BullMQ)                                   | Hetzner   |
| Shared contracts | `@lead/core` (types, provider catalog, scoring)  | —         |

## Repository layout

```
lead/
├── apps/
│   ├── web/            Next.js — marketing site + dashboard + API routes
│   └── worker/         Pipeline worker (Docker, deploys to Hetzner)
├── packages/
│   └── core/           Shared types, provider catalog, scoring, queue contracts
├── supabase/
│   ├── migrations/     0001_init · 0002_rls · 0003_onboarding
│   └── config.toml     Local Supabase config
├── docker-compose.yml  Hetzner: redis + worker
├── vercel.json         Vercel build config
└── .env.example        Every environment variable, documented
```

## The pipeline

Every run flows through seven stages. Free sources always run first; paid
providers only fire below the confidence threshold **and** only if you've
enabled them and supplied a key.

1. **Discover** — turn the input (a domain, a prompt, a CSV, or a territory
   sweep) into a list of target domains. Uses Google Places when a key is
   present, plus the vertical's public registries (NPI, license boards, SoS…).
2. **Scrape** — fetch each site's `/team`, `/about`, `/contact` pages. Plain
   `fetch` first; Playwright/Chromium for JavaScript-rendered pages.
3. **Extract** — Claude (Haiku) pulls structured person blocks
   `{name, title, email?, phone?}` from the scraped text.
4. **Enrich** — fill gaps from free registries (the NPI registry is a real API
   integration), pattern-guess emails, then optionally a paid waterfall
   (Hunter → Apollo → PDL) below the confidence threshold.
5. **Verify** — MX + SMTP checks classify each email `deliverable / risky /
   guess`. Guesses are gated out of delivery.
6. **Score** — an ICP rubric (deterministic prior + optional Claude Sonnet pass)
   produces a fit score and an A/B/C tier, plus an intent signal.
7. **Deliver** — write final contacts to the database, append spend to the
   ledger, and export to CSV / push to a CRM or webhook.

The provider catalog (dozens of registries, scrapers, enrichers, and verifiers)
lives in `packages/core/src/providers.ts` and drives both the Sources screen and
the worker's adapter dispatch.

## Local development

### 1. Prerequisites

- Node 20+
- Docker (for Redis + local Supabase, or use a hosted Supabase project)
- The [Supabase CLI](https://supabase.com/docs/guides/cli) (optional, for local DB)

### 2. Install

```bash
npm install
npm run build --workspace packages/core   # build the shared package once
```

### 3. Database

**Option A — hosted Supabase (recommended):** create a project at
supabase.com, then run the three migrations in the SQL editor in order
(`supabase/migrations/0001_init.sql`, `0002_rls.sql`, `0003_onboarding.sql`),
or `supabase db push` if you've linked the CLI.

**Option B — local:** `supabase start` boots Postgres + Auth + Realtime and
applies `supabase/migrations/*` automatically.

### 4. Environment

```bash
cp .env.example apps/web/.env.local     # web needs NEXT_PUBLIC_SUPABASE_* + REDIS_URL
cp .env.example .env                     # worker + docker-compose read this
```

Fill in at minimum:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `REDIS_URL` (e.g. `redis://localhost:6379`)
- `ANTHROPIC_API_KEY` (extraction + scoring; the pipeline still runs without it
  using heuristic fallbacks, just less accurately)

Everything else (Google Places, Hunter, Apollo, …) is optional — the pipeline
runs end-to-end on free sources alone.

### 5. Run

```bash
# Terminal 1 — Redis (if not already running)
docker run -p 6379:6379 redis:7-alpine

# Terminal 2 — the worker
npm run dev:worker

# Terminal 3 — the web app
npm run dev:web        # http://localhost:3000
```

Sign up at `/signup`, complete onboarding to create your org, then start a run
from the dashboard. Watch the targets move across the pipeline canvas live.

## Deployment

### Web → Vercel

1. Import this repo into Vercel. It reads `vercel.json` (build command +
   Next.js framework). If you prefer, set the project **Root Directory** to
   `apps/web`.
2. Add the environment variables from `.env.example` (the `NEXT_PUBLIC_*` ones,
   `SUPABASE_SERVICE_ROLE_KEY`, `REDIS_URL`, `ANTHROPIC_API_KEY`, provider keys).
   `REDIS_URL` must point at the Hetzner Redis over a private network / Tailscale
   / SSH tunnel — do not expose Redis publicly without auth + TLS.
3. Deploy. The dashboard, auth, and API routes go live.

### Worker + Redis → Hetzner

```bash
# On the Hetzner box (Docker installed):
git clone <this repo> && cd lead
cp .env.example .env      # fill in SUPABASE_*, ANTHROPIC_API_KEY, provider keys
                          # set REDIS_URL=redis://redis:6379
docker compose up -d --build
docker compose logs -f worker
```

The worker container is built from `apps/worker/Dockerfile` on the official
Playwright image (Chromium preinstalled). It connects to Redis, consumes jobs
enqueued by the Vercel API, and writes results straight to Supabase.

### Supabase

Run the migrations (see step 3 above) and, in Auth settings, add your Vercel
domain to the allowed redirect URLs (`https://your-app.vercel.app/auth/callback`).

## Security & compliance notes

- **RLS everywhere.** Every tenant table is row-level-security scoped to org
  membership (`supabase/migrations/0002_rls.sql`). The worker uses the service
  role, which bypasses RLS by design.
- **Secrets.** Provider API keys are referenced by `source_keys.secret_ref`;
  only a `last4` is ever returned to the client. Store the real secret in
  Supabase Vault or an encrypted column — never in a client-readable row.
- **Public data only.** The default sources are public registries and company
  sites. Paid providers are opt-in per org and gated behind a master switch,
  a confidence threshold, and per-provider budget caps.
- **Deliverability gating.** Pattern-guessed emails that never pass SMTP
  verification are flagged `guess` and excluded from delivery.

## What's real vs. what needs a key

- **Real, no key required:** the full 7-stage pipeline on free sources —
  Playwright scraping, heuristic + Claude extraction, the NPI registry API,
  MX/SMTP verification, deterministic ICP scoring, CSV delivery, the live
  dashboard, auth, and multi-tenant data.
- **Activated by a key:** Google Places discovery, Claude extraction/scoring
  accuracy, and every paid provider (Hunter, Apollo, PDL, NeverBounce, Bright
  Data, Apify, …). Each paid adapter makes the correct API call when its key is
  present and cleanly no-ops when it isn't.

See `packages/core/src/providers.ts` for the complete catalog and
`apps/worker/README.md` for adapter details.
