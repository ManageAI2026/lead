/**
 * Webhook delivery — REAL, URL-guarded. POSTs the run's qualified contacts as
 * JSON to DELIVER_WEBHOOK_URL when configured. No URL → no-op. Fire-and-forget
 * with a short timeout; never throws into the pipeline.
 */

import { cfg } from '../../config.js';
import type { Log } from '../../log.js';
import type { ContactRow } from './supabase.js';

export async function deliverWebhook(
  runId: string,
  orgId: string,
  rows: ContactRow[],
  log: Log
): Promise<void> {
  if (!cfg.deliverWebhookUrl) {
    log.path('skipped', 'no DELIVER_WEBHOOK_URL');
    return;
  }
  try {
    const res = await fetch(cfg.deliverWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LeadBooster-Secret': process.env.WORKER_CALLBACK_SECRET ?? '',
      },
      body: JSON.stringify({ runId, orgId, count: rows.length, contacts: rows }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) log.warn(`webhook ${res.status}`);
    else log.path('live', `posted ${rows.length} contacts to webhook`);
  } catch (err) {
    log.warn('webhook failed', err instanceof Error ? err.message : err);
  }
}
