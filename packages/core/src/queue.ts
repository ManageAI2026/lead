/**
 * Queue contracts shared between the API (enqueue side, in apps/web) and the
 * worker (consume side, in apps/worker). The transport is BullMQ over Redis;
 * these constants and payload shapes are the interface between them.
 */

import type { RunInput, RunProfileId } from './types.js';

export const QUEUE_NAME = 'lead-pipeline';

/** A job to process one run. The worker fans this out into per-target jobs. */
export interface RunJob {
  type: 'run';
  runId: string;
  orgId: string;
  profile: RunProfileId;
  input: RunInput;
  icpProfileId: string | null;
}

/** A job to process a single discovered target through the pipeline. */
export interface TargetJob {
  type: 'target';
  runId: string;
  orgId: string;
  targetId: string;
  domain: string;
  vertical: string | null;
  profile: RunProfileId;
  icpProfileId: string | null;
}

export type PipelineJob = RunJob | TargetJob;

export const JOB_OPTS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail: { age: 86400 },
};
