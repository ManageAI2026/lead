import { RunsClient } from '@/components/dashboard/RunsClient';
import {
  getActiveRun,
  getSessionContext,
  getTargets,
  getContacts,
  getIcpProfiles,
} from '@/lib/data';
import type { Contact } from '@lead/core';

export const dynamic = 'force-dynamic';

/**
 * Runs screen (route: /app). Server-loads the org's active run + its targets,
 * plus the run's contacts grouped by domain (for the live target console) and
 * the org's ICP profiles (for run dispatch). The client subscribes to Supabase
 * Realtime to animate the canvas as the worker updates rows.
 */
export default async function RunsPage() {
  const ctx = await getSessionContext();
  const org = ctx?.org ?? null;

  if (!org) {
    return (
      <RunsClient
        orgId={null}
        defaultProfile="free-max"
        paidEnabled
        run={null}
        initialTargets={[]}
        contactsByDomain={{}}
        icpProfiles={[]}
      />
    );
  }

  const run = await getActiveRun(org.id);
  const [targets, contacts, icpProfiles] = await Promise.all([
    run ? getTargets(run.id) : Promise.resolve([]),
    run ? getContacts(org.id).then((all) => all.filter((c) => c.runId === run.id)) : Promise.resolve([] as Contact[]),
    getIcpProfiles(org.id),
  ]);

  const contactsByDomain: Record<string, Contact[]> = {};
  for (const c of contacts) {
    (contactsByDomain[c.domain] ??= []).push(c);
  }

  return (
    <RunsClient
      orgId={org.id}
      defaultProfile={org.defaultProfile}
      paidEnabled={org.paidEnabled}
      run={run}
      initialTargets={targets}
      contactsByDomain={contactsByDomain}
      icpProfiles={icpProfiles}
    />
  );
}
