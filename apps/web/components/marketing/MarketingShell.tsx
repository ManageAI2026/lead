'use client';

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MarketingStyles } from './MarketingStyles';

const NAV = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/industries', label: 'Industries' },
  { href: '/videos', label: 'Videos' },
];

const FOOTER_LINKS = ['Product', 'Pricing', 'Docs', 'Security', 'Privacy', 'Terms', 'Status', 'Contact'];

function Wordmark({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-.02em' }}>
        <span style={{ color: 'var(--text)' }}>MANAGE </span>
        <span style={{ color: 'var(--accent)' }}>AI</span>
      </span>
      {subtitle && (
        <>
          <span style={{ width: 1, height: 18, background: 'var(--border)' }} />
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text2)' }}>Lead Booster Pro</span>
        </>
      )}
    </span>
  );
}

export function MarketingShell({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const linkStyle = (href: string): CSSProperties => ({
    font: '600 13.5px var(--f)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '9px 12px',
    borderRadius: 8,
    color: isActive(href) ? 'var(--accent)' : 'var(--text2)',
    whiteSpace: 'nowrap',
  });

  return (
    <div className="mkt" style={{ fontFamily: 'var(--f)', color: 'var(--text)', background: '#fff', minHeight: '100vh' }}>
      <MarketingStyles />

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(255,255,255,.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          data-pad=""
          style={{ maxWidth: 1240, margin: '0 auto', height: 66, display: 'flex', alignItems: 'center', gap: 24, padding: '0 40px' }}
        >
          <Link href="/" aria-label="Lead Booster Pro home">
            <Wordmark />
          </Link>
          <nav data-navlinks="" style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 14 }}>
            {NAV.map((l) => (
              <Link key={l.href} href={l.href} style={linkStyle(l.href)}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div style={{ flex: 1 }} />
          <Link href="/login" style={{ font: '600 13.5px var(--f)', color: 'var(--text2)', padding: '9px 14px' }}>
            Log in
          </Link>
          <Link
            href="/signup"
            style={{ font: '600 13.5px var(--f)', color: '#fff', background: 'var(--accent)', padding: '10px 18px', borderRadius: 9 }}
          >
            Start free
          </Link>
        </div>
        <nav
          data-mobilenav=""
          style={{ display: 'none', gap: 4, overflowX: 'auto', padding: '0 20px 12px', WebkitOverflowScrolling: 'touch' }}
        >
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} style={{ ...linkStyle(l.href), flex: 'none' }}>
              {l.label}
            </Link>
          ))}
        </nav>
      </header>

      <main>{children}</main>

      {footer && (
        <footer style={{ borderTop: '1px solid var(--border)', background: '#fff' }}>
          <div
            data-pad=""
            style={{
              maxWidth: 1240,
              margin: '0 auto',
              padding: '32px 40px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Wordmark subtitle={false} />
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text3)' }} />
            <nav style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
              {FOOTER_LINKS.map((l) => (
                <Link key={l} href="/" style={{ font: '500 13px var(--f)', color: 'var(--text2)' }}>
                  {l}
                </Link>
              ))}
            </nav>
          </div>
          <div style={{ textAlign: 'center', paddingBottom: 26, font: '400 12px var(--f)', color: 'var(--text3)' }}>
            © ManageAI · Built by ManageAI · Phoenix, AZ.
          </div>
        </footer>
      )}
    </div>
  );
}
