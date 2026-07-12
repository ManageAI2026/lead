/**
 * RunJob processor — discovers target domains for a run and fans them out into
 * one TargetJob each. Sets the run to running, records targets_total, and (when
 * discovery finds nothing) closes the run out immediately.
 */

import type { Job, Queue } from 'bullmq';
import type { RunJob, TargetJob } from '@lead/core';
import { JOB_OPTS } from '@lead/core';
import { logger } from './log.js';
import { patchRun, insertTarget } from './db.js';
import { runDiscover } from './stages/discover.js';

const DEFAULT_LIMIT = Number(process.env.DISCOVER_LIMIT ?? '12') || 12;

function verticalFor(input: RunJob['input']): string | null {
  if (input.kind === 'sweep') return input.sweep.vertical;
  return null;
}

export async function processRun(job: Job<RunJob>, queue: Queue): Promise<void> {
  const { runId, orgId, profile, input, icpProfileId } = job.data;
  const log = logger(`run:${runId}`);

  await patchRun(runId, { status: 'running', started_at: new Date().toISOString() });

  const vertical = verticalFor(input);
  log.info(`discovering (kind=${input.kind}, profile=${profile}, vertical=${vertical ?? 'auto'})`);

  const targets = await runDiscover(input, vertical, DEFAULT_LIMIT, log);
  log.info(`discovered ${targets.length} targets`);

  await patchRun(runId, { targets_total: targets.length });
  if (targets.length === 0) {
    await patchRun(runId, { status: 'completed', finished_at: new Date().toISOString() });
    log.warn('no targets discovered — run completed empty');
    return;
  }

  for (const t of targets) {
    const targetVertical = t.vertical ?? vertical;
    const targetId = await insertTarget({
      run_id: runId,
      org_id: orgId,
      domain: t.domain,
      vertical: targetVertical,
    });
    const payload: TargetJob = {
      type: 'target',
      runId,
      orgId,
      targetId,
      domain: t.domain,
      vertical: targetVertical,
      profile,
      icpProfileId,
    };
    await queue.add('target', payload, JOB_OPTS);
  }
  log.info(`fanned out ${targets.length} target jobs`);
}
