'use client';

import { usePathname } from 'next/navigation';

const TITLES: Record<string, string> = {
  '/app': 'Runs',
  '/app/data': 'Data',
  '/app/talk': 'Talk',
  '/app/build': 'Build',
  '/app/sources': 'Sources',
  '/app/billing': 'Billing',
  '/app/settings': 'Settings',
};

function titleFor(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  const hit = Object.keys(TITLES)
    .filter((k) => k !== '/app')
    .find((k) => pathname.startsWith(k));
  return hit ? TITLES[hit] : 'Runs';
}

export function Topbar({
  orgName,
  usageFree,
  usagePaid,
  usageSaved,
}: {
  orgName: string;
  usageFree: string;
  usagePaid: string;
  usageSaved: string;
}) {
  const pathname = usePathname();
  const pageTitle = titleFor(pathname);

  return (
    <header
      style={{
        height: 64,
        flex: 'none',
        background: '#fff',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 26px',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, font: '500 12px var(--f)', color: 'var(--text3)' }}>
        <span>Lead Booster Pro</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.8">
          <path d="m9 18 6-6-6-6" />
        </svg>
        <span style={{ color: 'var(--text)', fontWeight: 700 }}>{pageTitle}</span>
      </div>
      <div style={{ flex: 1 }} />
      <div
        title="Today: free vs paid spend"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          background: 'var(--surf)',
          border: '1px solid var(--border)',
          borderRadius: 999,
          padding: '6px 14px',
          fontFamily: 'var(--fm)',
          fontSize: 12,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)' }} />
          {usageFree} free
        </span>
        <span style={{ width: 1, height: 13, background: 'var(--border)' }} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--amber)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--amber)' }} />
          {usagePaid} paid
        </span>
        <span style={{ color: 'var(--text3)' }}>·</span>
        <span style={{ color: 'var(--green)', fontWeight: 600 }}>{usageSaved} saved</span>
      </div>
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#fff',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          borderRadius: 9,
          padding: '7px 11px',
          font: '600 12px var(--f)',
          cursor: 'pointer',
        }}
      >
        <span style={{ width: 15, height: 15, borderRadius: 4, background: 'var(--accent)', display: 'inline-block' }} />
        {orgName}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.9">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </header>
  );
}
