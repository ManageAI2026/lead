import { DataClient } from '@/components/dashboard/DataClient';
import {
  getCompanies,
  getContactCountsByDomain,
  getContacts,
  getIcpProfiles,
  getSessionContext,
} from '@/lib/data';

export const dynamic = 'force-dynamic';

/**
 * Data screen (route: /app/data). Server-loads the org's contacts + companies
 * with the primary filters (q, email, tier, industry) applied in the query —
 * these come from searchParams so filter buttons are URL-driven and shareable.
 * The client handles tabs, drawers, secondary filters, and the ICP/intake modals.
 */
export default async function DataPage({
  searchParams,
}: {
  searchParams: { q?: string; email?: string; tier?: string; industry?: string };
}) {
  const ctx = await getSessionContext();
  const org = ctx?.org ?? null;

  const filters = {
    q: searchParams.q ?? '',
    emailStatus: searchParams.email ?? 'all',
    tier: searchParams.tier ?? 'all',
    industry: searchParams.industry ?? 'all',
  };

  if (!org) {
    return (
      <DataClient
        contacts={[]}
        companies={[]}
        countsByDomain={{}}
        icp={null}
        filters={{ q: '', email: 'all', tier: 'all', industry: 'all' }}
        industries={[]}
      />
    );
  }

  const [contacts, companies, countsByDomain, icpProfiles] = await Promise.all([
    getContacts(org.id, filters),
    getCompanies(org.id, { q: filters.q, industry: filters.industry }),
    getContactCountsByDomain(org.id),
    getIcpProfiles(org.id),
  ]);

  // Distinct industries for the account-level filter chips.
  const industries = Array.from(
    new Set(companies.map((c) => c.industry).filter((x): x is string => !!x))
  ).sort();

  return (
    <DataClient
      contacts={contacts}
      companies={companies}
      countsByDomain={countsByDomain}
      icp={icpProfiles[0] ?? null}
      filters={{
        q: filters.q,
        email: filters.emailStatus,
        tier: filters.tier,
        industry: filters.industry,
      }}
      industries={industries}
    />
  );
}
