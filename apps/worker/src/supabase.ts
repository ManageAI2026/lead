/**
 * Service-role Supabase client. This runs on the Hetzner box only — the
 * service-role key bypasses RLS, so it must never ship to the browser.
 *
 * If Supabase env is absent (local pipeline smoke tests with no DB) we export
 * `null` and every db helper becomes a no-op, so the pipeline still runs
 * end-to-end and logs what it *would* have written.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cfg } from './config.js';
import { logger } from './log.js';

const log = logger('supabase');

let client: SupabaseClient | null = null;

if (cfg.supabaseUrl && cfg.supabaseServiceKey) {
  client = createClient(cfg.supabaseUrl, cfg.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  log.info(`connected ${cfg.supabaseUrl}`);
} else {
  log.warn('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY absent — db writes are no-ops');
}

export const supabase = client;

/** True when we have a real DB connection. */
export function hasDb(): boolean {
  return client !== null;
}
