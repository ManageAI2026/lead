'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, ICONS } from '@/components/ui';

const OPERATE: { href: string; label: string; icon: string }[] = [
  { href: '/app', label: 'Runs', icon: ICONS.runs },
  { href: '/app/data', label: 'Data', icon: ICONS.data },
  { href: '/app/talk', label: 'Talk', icon: ICONS.talk },
];
const CONFIGURE: { href: string; label: string; icon: string }[] = [
  { href: '/app/build', label: 'Build', icon: ICONS.build },
  { href: '/app/sources', label: 'Sources', icon: ICONS.keys },
  { href: '/app/billing', label: 'Billing', icon: ICONS.billing },
  { href: '/app/settings', label: 'Settings', icon: ICONS.settings },
];

export function Sidebar({
  freeFirst,
  userName,
  orgName,
}: {
  freeFirst: boolean;
  userName: string;
  orgName: string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/app' ? pathname === '/app' : pathname.startsWith(href);

  const navItem = (item: { href: string; label: string; icon: string }) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          width: '100%',
          padding: '8px 12px',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontFamily: 'var(--f)',
          fontWeight: active ? 700 : 500,
          fontSize: 13,
          textDecoration: 'none',
          transition: 'background .15s,color .15s',
          background: active ? 'var(--accentl)' : 'transparent',
          color: active ? 'var(--accentd)' : 'var(--text2)',
        }}
      >
        <Icon path={item.icon} size={17} />
        {item.label}
      </Link>
    );
  };

  const initials =
    userName
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'ME';

  return (
    <aside
      style={{
        width: 230,
        flex: 'none',
        background: '#fff',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          height: 64,
          flex: 'none',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '0 18px',
        }}
      >
        <span style={{ fontFamily: 'var(--f)', fontWeight: 800, fontSize: 17, letterSpacing: '-.02em' }}>
          <span style={{ color: 'var(--text)' }}>MANAGE </span>
          <span style={{ color: 'var(--accent)' }}>AI</span>
        </span>
      </div>

      <div style={{ padding: '14px 14px 6px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--surf)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '8px 10px',
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              flex: 'none',
              borderRadius: 6,
              background: 'var(--accentl)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon path='<path d="m13 2-3 7h5l-3 7"/><circle cx="12" cy="12" r="9"/>' size={13} strokeWidth={1.9} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ font: '700 12px var(--f)', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Lead Booster Pro
            </div>
            <div style={{ font: '500 10px var(--fm)', color: 'var(--text3)' }}>v2 · byok</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '8px 10px', overflow: 'auto' }}>
        <div style={{ font: '700 10px var(--f)', letterSpacing: '.11em', color: 'var(--text3)', padding: '10px 12px 6px' }}>
          OPERATE
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{OPERATE.map(navItem)}</div>
        <div style={{ font: '700 10px var(--f)', letterSpacing: '.11em', color: 'var(--text3)', padding: '16px 12px 6px' }}>
          CONFIGURE
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{CONFIGURE.map(navItem)}</div>
      </nav>

      <div style={{ padding: '12px 14px' }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12, background: 'var(--surf)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: freeFirst ? 'var(--green)' : 'var(--text3)' }} />
            <span style={{ font: '700 11px var(--f)', color: 'var(--text)' }}>
              {freeFirst ? 'Free-first is on' : 'Free-first is off'}
            </span>
          </div>
          <div style={{ font: '500 11px/1.45 var(--f)', color: 'var(--text2)' }}>
            Paid providers fire only below the 0.70 confidence threshold.
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 9 }}>
        <span
          style={{
            width: 28,
            height: 28,
            flex: 'none',
            borderRadius: '50%',
            background: 'var(--accentl)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            font: '700 11px var(--f)',
          }}
        >
          {initials}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: '600 12px var(--f)', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userName}
          </div>
          <div style={{ font: '500 10px var(--f)', color: 'var(--text3)' }}>{orgName}</div>
        </div>
      </div>
    </aside>
  );
}
