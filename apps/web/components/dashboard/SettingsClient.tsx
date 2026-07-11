'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { initialsOf } from '@/components/dashboard/shared';

export interface SettingsProfile {
  name: string;
  email: string;
}

export interface SettingsMember {
  name: string;
  role: string;
  you: boolean;
  initials: string;
}

type TabKey = 'profile' | 'org' | 'notifications' | 'privacy' | 'security';

const TABS: [TabKey, string][] = [
  ['profile', 'Profile'],
  ['org', 'Organization'],
  ['notifications', 'Notifications'],
  ['privacy', 'Data & privacy'],
  ['security', 'Security'],
];

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  marginTop: 6,
  border: '1px solid var(--border)',
  borderRadius: 9,
  padding: '10px 12px',
  font: '500 13.5px var(--f)',
  outline: 'none',
};

const labelStyle: CSSProperties = {
  font: '600 12px var(--f)',
  color: 'var(--text2)',
};

const primaryBtn: CSSProperties = {
  font: '600 13px var(--f)',
  color: '#fff',
  background: 'var(--accent)',
  border: 'none',
  borderRadius: 9,
  padding: '10px 18px',
  cursor: 'pointer',
};

/**
 * Settings screen client. Owns the active-tab state and the save wiring.
 * Both the Profile "Save changes" and the Organization name field persist the
 * org name via PATCH /api/org, then refresh the route. Ported from the approved
 * prototype's isSettings block.
 */
export function SettingsClient({
  profile,
  orgName: initialOrgName,
  members,
}: {
  profile: SettingsProfile;
  orgName: string;
  members: SettingsMember[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('profile');
  const [fullName, setFullName] = useState(profile.name);
  const [orgName, setOrgName] = useState(initialOrgName);

  async function saveOrg() {
    try {
      await fetch('/api/org', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orgName }),
      });
    } catch {
      // best-effort; a missing org is handled server-side
    }
    router.refresh();
  }

  const rows: SettingsMember[] =
    members.length > 0
      ? members
      : [{ name: fullName, role: 'Owner', you: true, initials: initialsOf(fullName || profile.email) }];

  return (
    <div style={{ padding: '30px 32px 60px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ font: '700 30px/1.2 var(--f)', letterSpacing: '-.02em', margin: 0, color: 'var(--text)' }}>
          Settings
        </h1>
        <div style={{ marginTop: 4, font: '500 13px var(--f)', color: 'var(--text3)' }}>
          Your profile, organization, and account.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {TABS.map(([key, label]) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  textAlign: 'left',
                  font: '600 13px var(--f)',
                  padding: '9px 12px',
                  borderRadius: 9,
                  cursor: 'pointer',
                  border: 'none',
                  background: active ? 'var(--accentl)' : 'transparent',
                  color: active ? 'var(--accentd)' : 'var(--text2)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 26,
            boxShadow: '0 1px 3px rgba(0,0,0,.04)',
          }}
        >
          {tab === 'profile' && (
            <>
              <div style={{ font: '700 16px var(--f)', color: 'var(--text)', marginBottom: 18 }}>Profile</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <span
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: 'var(--accentl)',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    font: '700 20px var(--f)',
                  }}
                >
                  {initialsOf(fullName || profile.email)}
                </span>
                <button
                  style={{
                    font: '600 12.5px var(--f)',
                    color: 'var(--accent)',
                    background: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: 9,
                    padding: '8px 14px',
                    cursor: 'pointer',
                  }}
                >
                  Change avatar
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label style={labelStyle}>
                  Full name
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Email
                  <input defaultValue={profile.email} style={inputStyle} />
                </label>
              </div>
              <button onClick={saveOrg} style={{ ...primaryBtn, marginTop: 20 }}>
                Save changes
              </button>
            </>
          )}

          {tab === 'org' && (
            <>
              <div style={{ font: '700 16px var(--f)', color: 'var(--text)', marginBottom: 6 }}>Organization</div>
              <label style={{ ...labelStyle, display: 'block', marginBottom: 20 }}>
                Organization name
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  onBlur={saveOrg}
                  style={{ ...inputStyle, maxWidth: 340 }}
                />
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <span style={{ font: '700 10px var(--f)', letterSpacing: '.08em', color: 'var(--text3)' }}>
                  MEMBERS
                </span>
                <button
                  style={{
                    font: '600 12px var(--f)',
                    color: 'var(--accent)',
                    background: '#fff',
                    border: '1px solid var(--accent)',
                    borderRadius: 8,
                    padding: '7px 13px',
                    cursor: 'pointer',
                  }}
                >
                  Invite member
                </button>
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                {rows.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderTop: '1px solid var(--borderl)',
                    }}
                  >
                    <span
                      style={{
                        width: 30,
                        height: 30,
                        flex: 'none',
                        borderRadius: 8,
                        background: 'var(--accentl)',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        font: '700 11px var(--f)',
                      }}
                    >
                      {m.initials}
                    </span>
                    <span style={{ flex: 1, font: '600 13px var(--f)', color: 'var(--text)' }}>
                      {m.name}
                      {m.you && <span style={{ font: '600 10px var(--f)', color: 'var(--text3)' }}> · you</span>}
                    </span>
                    <span
                      style={{
                        font: '600 11px var(--f)',
                        color: 'var(--text2)',
                        background: 'var(--surf)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '3px 9px',
                      }}
                    >
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'notifications' && (
            <>
              <div style={{ font: '700 16px var(--f)', color: 'var(--text)', marginBottom: 18 }}>Notifications</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  ['Run finished', true],
                  ['A build task needs approval', true],
                  ['Provider key invalid or budget hit', true],
                  ['Weekly summary email', false],
                ].map(([label, checked], i) => (
                  <label key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ font: '500 13.5px var(--f)', color: 'var(--text)' }}>{label as string}</span>
                    <input
                      type="checkbox"
                      defaultChecked={checked as boolean}
                      style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                    />
                  </label>
                ))}
              </div>
            </>
          )}

          {tab === 'privacy' && (
            <>
              <div style={{ font: '700 16px var(--f)', color: 'var(--text)', marginBottom: 8 }}>Data &amp; privacy</div>
              <p style={{ font: '400 13.5px/1.6 var(--f)', color: 'var(--text2)', margin: '0 0 18px' }}>
                Your data is yours. Export everything, or delete it — we don’t resell data or train on your lists.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a
                  href="/api/export"
                  style={{
                    font: '600 13px var(--f)',
                    color: 'var(--text)',
                    background: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: 9,
                    padding: '10px 16px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                >
                  Export my data
                </a>
                <button
                  style={{
                    font: '600 13px var(--f)',
                    color: 'var(--red)',
                    background: '#fff',
                    border: '1px solid var(--redl)',
                    borderRadius: 9,
                    padding: '10px 16px',
                    cursor: 'pointer',
                  }}
                >
                  Delete my data
                </button>
              </div>
            </>
          )}

          {tab === 'security' && (
            <>
              <div style={{ font: '700 16px var(--f)', color: 'var(--text)', marginBottom: 18 }}>Security</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 340 }}>
                <label style={labelStyle}>
                  Current password
                  <input type="password" placeholder="••••••••" style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  New password
                  <input type="password" placeholder="At least 8 characters" style={inputStyle} />
                </label>
                <button style={{ ...primaryBtn, alignSelf: 'flex-start' }}>Update password</button>
              </div>
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 18,
                  borderTop: '1px solid var(--borderl)',
                  font: '500 12.5px var(--f)',
                  color: 'var(--text3)',
                }}
              >
                Keys and Billing live in their own screens —{' '}
                <Link href="/app/sources" style={{ font: '600 12.5px var(--f)', color: 'var(--accent)' }}>
                  Sources
                </Link>{' '}
                ·{' '}
                <Link href="/app/billing" style={{ font: '600 12.5px var(--f)', color: 'var(--accent)' }}>
                  Billing
                </Link>
                .
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
