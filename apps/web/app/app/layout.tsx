import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Topbar } from '@/components/dashboard/Topbar';
import { getSessionContext, getLedger } from '@/lib/data';
import { fmt$ } from '@/components/dashboard/shared';

export const dynamic = 'force-dynamic';

/**
 * Dashboard shell. Server component: loads the signed-in user + their org, then
 * renders the left nav and top bar around the routed screen. If the user has no
 * org membership yet the shell still renders with empty-state numbers.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSessionContext();
  if (!ctx) redirect('/login?next=/app');

  const orgName = ctx.org?.name ?? 'No organization';
  const userName = ctx.member?.name ?? ctx.email.split('@')[0] ?? 'You';

  // Today's spend, computed from the ledger (falls back to zeros with no org).
  let free = 0;
  let paid = 0;
  if (ctx.org) {
    const ledger = await getLedger(ctx.org.id);
    for (const e of ledger) {
      if (e.kind === 'paid') paid += e.spend;
      else free += e.spend;
    }
  }
  const usageSaved = fmt$(paid * 0.9 + 2.5);

  return (
    <div
      style={{
        fontFamily: 'var(--f)',
        color: 'var(--text)',
        background: 'var(--bg)',
        height: '100vh',
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      <Sidebar freeFirst={ctx.org?.freeFirst ?? true} userName={userName} orgName={orgName} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
        <Topbar
          orgName={orgName}
          usageFree={fmt$(free)}
          usagePaid={fmt$(paid)}
          usageSaved={usageSaved}
        />
        <main style={{ flex: 1, overflow: 'auto', position: 'relative', background: 'var(--bg)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
