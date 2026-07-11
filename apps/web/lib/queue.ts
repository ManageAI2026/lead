import 'server-only';
import { Queue, type ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';
import { QUEUE_NAME, JOB_OPTS, type PipelineJob } from '@lead/core';

/**
 * Server-only BullMQ producer. API routes enqueue RunJobs here; the Hetzner
 * worker consumes them. A single shared connection is reused across requests.
 */
let queue: Queue | null = null;

function getQueue(): Queue {
  if (!queue) {
    const connection = new IORedis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null,
    }) as unknown as ConnectionOptions;
    queue = new Queue(QUEUE_NAME, { connection });
  }
  return queue;
}

export async function enqueue(job: PipelineJob): Promise<string> {
  const q = getQueue();
  const added = await q.add(job.type, job, JOB_OPTS);
  return added.id ?? '';
}
