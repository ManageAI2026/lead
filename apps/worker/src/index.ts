/**
 * Worker entry point. Boots a BullMQ Worker on QUEUE_NAME (Redis from REDIS_URL)
 * with WORKER_CONCURRENCY. RunJobs are discovered + fanned out; TargetJobs are
 * driven through the full pipeline. A same-name Queue is used to enqueue the
 * per-target jobs produced by run fan-out.
 */

import { Worker, Queue, type Job, type ConnectionOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { QUEUE_NAME, type PipelineJob, type RunJob, type TargetJob } from '@lead/core';
import { cfg } from './config.js';
import { logger } from './log.js';
import { processRun } from './run.js';
import { processTarget } from './target.js';
import { closeBrowser } from './adapters/scrape/playwright.js';

const log = logger('worker');

// BullMQ requires maxRetriesPerRequest: null on the blocking connection.
// BullMQ bundles its own pinned ioredis copy, so the shared client crosses its
// `ConnectionOptions` boundary via a cast (identical runtime, distinct package
// type identity).
const connection = new Redis(cfg.redisUrl, { maxRetriesPerRequest: null });
const bullConnection = connection as unknown as ConnectionOptions;

// Queue used to enqueue the TargetJobs produced by run fan-out.
const queue = new Queue(QUEUE_NAME, { connection: bullConnection });

const worker = new Worker<PipelineJob>(
  QUEUE_NAME,
  async (job: Job<PipelineJob>) => {
    if (job.data.type === 'run') {
      await processRun(job as Job<RunJob>, queue);
    } else if (job.data.type === 'target') {
      await processTarget(job as Job<TargetJob>);
    } else {
      log.warn(`unknown job type`, (job.data as { type?: string }).type);
    }
  },
  { connection: bullConnection, concurrency: cfg.concurrency }
);

worker.on('ready', () => log.info(`ready on "${QUEUE_NAME}" (concurrency ${cfg.concurrency})`));
worker.on('active', (job) => log.debug(`active ${job.id} (${(job.data as PipelineJob).type})`));
worker.on('completed', (job) => log.info(`completed ${job.id} (${(job.data as PipelineJob).type})`));
worker.on('failed', (job, err) => log.error(`failed ${job?.id}: ${err.message}`));
worker.on('error', (err) => log.error('worker error', err.message));

log.info(`booting — redis=${cfg.redisUrl}`);

async function shutdown(signal: string): Promise<void> {
  log.info(`${signal} — shutting down`);
  try {
    await worker.close();
    await queue.close();
    await closeBrowser();
    await connection.quit();
  } catch (err) {
    log.error('shutdown error', err instanceof Error ? err.message : err);
  } finally {
    process.exit(0);
  }
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
