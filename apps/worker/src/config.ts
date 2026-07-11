/**
 * Central environment configuration for the worker. Everything the pipeline
 * needs is read here once so adapters can cheaply check `cfg.has('HUNTER')`
 * style flags and log which path they took.
 */

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== '' ? v.trim() : undefined;
}

export const cfg = {
  // --- Infra ---------------------------------------------------------------
  redisUrl: env('REDIS_URL') ?? 'redis://localhost:6379',
  concurrency: Number(env('WORKER_CONCURRENCY') ?? '4') || 4,

  // --- Supabase ------------------------------------------------------------
  supabaseUrl: env('SUPABASE_URL') ?? env('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseServiceKey: env('SUPABASE_SERVICE_ROLE_KEY'),

  // --- AI ------------------------------------------------------------------
  anthropicKey: env('ANTHROPIC_API_KEY'),
  modelExtract: env('ANTHROPIC_MODEL_EXTRACT') ?? 'claude-haiku-4-5-20251001',
  modelScore: env('ANTHROPIC_MODEL_SCORE') ?? 'claude-sonnet-5',

  // --- Discovery / search --------------------------------------------------
  googlePlacesKey: env('GOOGLE_PLACES_API_KEY'),
  serperKey: env('SERPER_API_KEY'),

  // --- Paid enrichment / verification --------------------------------------
  hunterKey: env('HUNTER_API_KEY'),
  apolloKey: env('APOLLO_API_KEY'),
  pdlKey: env('PDL_API_KEY'),
  neverbounceKey: env('NEVERBOUNCE_API_KEY'),
  brightDataKey: env('BRIGHTDATA_API_KEY'),
  apifyToken: env('APIFY_TOKEN'),

  // --- Government registries -----------------------------------------------
  samGovKey: env('SAM_GOV_API_KEY'),
  fmcsaWebKey: env('FMCSA_WEBKEY'),

  // --- Scrape / verify tuning ----------------------------------------------
  playwrightBrowsersPath: env('PLAYWRIGHT_BROWSERS_PATH'),
  chromiumExecutable: env('CHROMIUM_EXECUTABLE_PATH'),
  smtpProbe: (env('SMTP_PROBE') ?? 'false') === 'true',
  smtpFrom: env('SMTP_PROBE_FROM') ?? 'verify@leadboosterpro.com',

  // --- Delivery ------------------------------------------------------------
  deliverWebhookUrl: env('DELIVER_WEBHOOK_URL'),
  csvBucket: env('DELIVER_CSV_BUCKET') ?? 'exports',

  // --- Policy --------------------------------------------------------------
  /** Confidence below which paid providers may fire (matches RUN_PROFILES readouts). */
  paidThreshold: Number(env('PAID_THRESHOLD') ?? '0.70') || 0.7,
} as const;

export type Config = typeof cfg;
