/**
 * TargetJob processor — drives ONE target domain through scrape → extract →
 * enrich → verify → score → deliver, patching its `targets` row at every stage
 * so the dashboard's realtime UI reflects live status. Resilient by design: each
 * stage degrades gracefully, and an empty scrape flips the row repairing→running
 * once rather than failing the whole target.
 */

import type { Job } from 'bullmq';
import type { TargetJob } from '@lead/core';
import { RUN_PROFILES } from '@lead/core';
import { cfg } from './config.js';
import { logger } from './log.js';
import { patchTarget, bumpRun, fetchSourceKeys, fetchIcpProfile } from './db.js';
import { PaidGate } from './registry.js';
import type { CompanyFacts, Spend } from './adapters/types.js';
import { runScrape } from './stages/scrape.js';
import { runExtract } from './stages/extract.js';
import { runEnrich } from './stages/enrich.js';
import { runVerify } from './stages/verify.js';
import { runScore } from './stages/score.js';
import { runDeliver } from './stages/deliver.js';

/** Turn a domain into a plausible display company name. */
function nameFromDomain(domain: string): string {
  const core = domain.split('.').slice(0, -1).join('.').replace(/[-_]+/g, ' ');
  return core.replace(/\b\w/g, (c) => c.toUpperCase()) || domain;
}

export async function processTarget(job: Job<TargetJob>): Promise<void> {
  const { runId, orgId, targetId, domain, vertical, profile, icpProfileId } = job.data;
  const log = logger(`target:${domain}`);
  const spends: Spend[] = [];
  const spend = (s: Spend) => spends.push(s);

  try {
    log.info(`start (profile=${profile}, vertical=${vertical ?? 'unknown'})`);
    const [sourceKeys, icp] = await Promise.all([
      fetchSourceKeys(orgId),
      fetchIcpProfile(icpProfileId),
    ]);
    const gate = new PaidGate(profile, sourceKeys, log);
    const paidAllowed = RUN_PROFILES[profile].paid;

    // --- scrape ------------------------------------------------------------
    await patchTarget(targetId, {
      stage: 'scrape',
      status: 'running',
      activity: 'Fetching site pages',
      activity_kind: 'free',
    });
    const bundle = await runScrape(domain, log);
    if (bundle.pages === 0) {
      // Degrade gracefully: mark repairing, then flip back to running once.
      await patchTarget(targetId, {
        status: 'repairing',
        activity: 'Site unreachable — retrying render',
        activity_kind: 'danger',
        retries: 1,
      });
      await patchTarget(targetId, { status: 'running', activity: 'Continuing with limited data' });
    }

    // --- extract -----------------------------------------------------------
    await patchTarget(targetId, {
      stage: 'extract',
      activity: 'Reading team & contact pages',
      activity_kind: 'free',
    });
    const people = await runExtract(bundle.text, domain, log);
    // Fold any page-level mailtos that no person claimed into nothing — they stay
    // as company signal only; we key contacts on named people.
    await patchTarget(targetId, { found: people.length });

    const companyName = nameFromDomain(domain);
    const company: CompanyFacts = {
      domain,
      name: companyName,
      industry: vertical,
      employees: null,
      revenue: null,
      hq: null,
      companyType: null,
      tech: [],
    };

    // --- enrich ------------------------------------------------------------
    await patchTarget(targetId, {
      stage: 'enrich',
      activity: paidAllowed ? 'Enriching (free-first, paid below threshold)' : 'Enriching from free sources',
      activity_kind: paidAllowed ? 'paid' : 'free',
    });
    const enriched = await runEnrich(people, {
      domain,
      vertical,
      companyName,
      gate,
      spend,
      log,
    });
    if (enriched.paidFired) {
      await patchTarget(targetId, { activity_kind: 'paid', activity: 'Paid enrichment fired' });
    }

    // --- verify ------------------------------------------------------------
    await patchTarget(targetId, {
      stage: 'verify',
      activity: 'Verifying emails (MX/SMTP)',
      activity_kind: 'free',
    });
    const verified = await runVerify(enriched.people, { gate, spend, log });

    // --- score -------------------------------------------------------------
    await patchTarget(targetId, {
      stage: 'score',
      activity: 'Scoring ICP fit',
      activity_kind: 'free',
    });
    const scored = await runScore(verified, company, icp, log, Boolean(cfg.anthropicKey));

    // --- deliver -----------------------------------------------------------
    await patchTarget(targetId, {
      stage: 'deliver',
      activity: 'Delivering contacts',
      activity_kind: 'free',
    });
    const tally = await runDeliver(scored, {
      runId,
      orgId,
      vertical,
      company,
      spends,
      log,
    });

    const targetSpend = Math.round((tally.spendFree + tally.spendPaid) * 1e6) / 1e6;
    await patchTarget(targetId, {
      status: 'done',
      activity: `${tally.delivered} contacts delivered`,
      activity_kind: 'idle',
      found: tally.delivered,
      spend: targetSpend,
      icp: tally.avgFit,
    });

    await bumpRun(runId, {
      targets_done: 1,
      contacts_found: tally.delivered,
      spend_free: tally.spendFree,
      spend_paid: tally.spendPaid,
    });
    log.info(`done — ${tally.delivered} contacts, $${targetSpend.toFixed(4)} spend`);
  } catch (err) {
    const attempts = job.opts.attempts ?? 1;
    const made = job.attemptsMade + 1;
    log.error(`target failed (attempt ${made}/${attempts})`, err instanceof Error ? err.stack : err);
    if (made < attempts) {
      // Let BullMQ retry with backoff.
      await patchTarget(targetId, {
        status: 'repairing',
        activity: 'Error — retrying',
        activity_kind: 'danger',
        retries: made,
      });
      throw err;
    }
    // Final failure: record it but still advance the run so it can complete.
    await patchTarget(targetId, {
      status: 'failed',
      activity: err instanceof Error ? err.message.slice(0, 120) : 'Failed',
      activity_kind: 'danger',
    });
    await bumpRun(runId, { targets_done: 1 });
  }
}
