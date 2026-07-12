import { getSessionContext, getLedgerByProvider, type LedgerRollup } from '@/lib/data';
import { BillingView } from '@/components/dashboard/BillingView';

export const dynamic = 'force-dynamic';

/**
 * Billing screen. Server component: loads the signed-in user's org and its
 * per-provider ledger rollup, then hands them to the presentational
 * BillingView. With no org membership yet it renders the billing chrome with
 * an empty ledger rather than crashing.
 */
export default async function BillingPage() {
  const ctx = await getSessionContext();
  const ledger: LedgerRollup[] = ctx?.org ? await getLedgerByProvider(ctx.org.id) : [];
  return <BillingView ledger={ledger} />;
}
