import { getSessionContext, getSourceKeys } from '@/lib/data';
import { SourcesClient } from '@/components/dashboard/SourcesClient';
import type { SourceKey } from '@lead/core';

export const dynamic = 'force-dynamic';

/**
 * Sources screen (server component). Loads the signed-in user's org and its
 * configured source keys, then hands a provider-keyed lookup to the client. With
 * no org yet, the catalog still renders — everything simply shows as
 * not-connected and the client surfaces a friendly empty state.
 */
export default async function SourcesPage() {
  const ctx = await getSessionContext();
  const org = ctx?.org ?? null;

  let sourceKeys: Record<string, SourceKey> = {};
  if (org) {
    const keys = await getSourceKeys(org.id);
    sourceKeys = Object.fromEntries(keys.map((k) => [k.provider, k]));
  }

  const paidEnabled = org?.paidEnabled ?? true;

  return (
    <SourcesClient sourceKeys={sourceKeys} paidEnabled={paidEnabled} hasOrg={!!org} />
  );
}
