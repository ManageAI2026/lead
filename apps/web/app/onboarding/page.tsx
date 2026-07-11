'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RUN_PROFILES, type RunProfileId } from '@lead/core';
import { MarketingStyles } from '@/components/marketing/MarketingStyles';

const STEPS = [
  { k: 'org', title: 'Create your organization', sub: 'This is your workspace. You can rename it or invite your team later.', label: 'organization' },
  { k: 'profile', title: 'Pick a run profile', sub: 'How aggressive should the machine be? Start free, add paid providers anytime.', label: 'run profile' },
  { k: 'aikey', title: 'Add an AI key', sub: 'Required. This funds extraction, scoring, and outreach. You pay Anthropic or OpenAI directly.', label: 'AI key' },
  { k: 'run', title: 'You’re ready. Run your first list.', sub: 'Point it at a company, a list, or a territory. Free sources run first.', label: 'First run' },
] as const;

const PROFILE_ORDER: RunProfileId[] = ['scraper', 'free-max', 'hunter-apollo', 'full-stack'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState('');
  const [profile, setProfile] = useState<RunProfileId>('free-max');
  const [aiKey, setAiKey] = useState('');

  const meta = STEPS[step];
  const total = STEPS.length;
  const pct = `${Math.round(((step + 1) / total) * 100)}%`;
  const canNext = meta.k === 'org' ? orgName.trim().length > 0 : meta.k === 'aikey' ? aiKey.trim().length > 6 : true;

  const back = () => setStep((s) => Math.max(0, s - 1));
  const next = () => setStep((s) => Math.min(total - 1, s + 1));
  const finish = () => router.push('/app');

  const labelStyle: CSSProperties = { font: '600 12px var(--f)', color: 'var(--text2)', display: 'block' };
  const inputStyle: CSSProperties = { width: '100%', boxSizing: 'border-box', marginTop: 6, border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', font: '500 14px var(--f)', outline: 'none' };

  return (
    <div className="mkt" style={{ fontFamily: 'var(--f)', color: 'var(--text)' }}>
      <MarketingStyles />
      <div style={{ minHeight: '100vh', background: 'var(--surf)', padding: '40px 20px' }}>
        <div className="lbpm-fade" style={{ maxWidth: 620, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <Link href="/" style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.02em' }}>
              <span style={{ color: 'var(--navy)' }}>MANAGE </span>
              <span style={{ color: 'var(--accent)' }}>AI</span>
            </Link>
          </div>

          {/* stepper */}
          <div data-row="" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 20 }}>
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={s.k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      flex: 'none',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      font: '700 11px var(--f)',
                      background: done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--surf)',
                      color: i <= step ? '#fff' : 'var(--text3)',
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    }}
                  >
                    {done ? '✓' : ''}
                  </span>
                  <span style={{ font: '600 12.5px var(--f)', color: active ? 'var(--navy)' : done ? 'var(--text2)' : 'var(--text3)' }}>{s.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 22 }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,var(--accent),var(--accent-mid))', borderRadius: 3, width: pct, transition: 'width .4s ease' }} />
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 18, padding: 30, boxShadow: '0 8px 30px rgba(30,51,72,.08)' }}>
            <div style={{ font: '800 22px/1.2 var(--f)', letterSpacing: '-.02em', color: 'var(--navy)' }}>{meta.title}</div>
            <div style={{ font: '400 14px/1.6 var(--f)', color: 'var(--text2)', margin: '8px 0 22px' }}>{meta.sub}</div>

            {meta.k === 'org' && (
              <label style={labelStyle}>
                Organization name
                <input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Northwind Growth" style={inputStyle} />
              </label>
            )}

            {meta.k === 'profile' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {PROFILE_ORDER.map((id) => {
                    const sel = profile === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setProfile(id)}
                        style={{
                          textAlign: 'left',
                          borderRadius: 11,
                          padding: '14px 16px',
                          font: '600 13.5px var(--f)',
                          cursor: 'pointer',
                          background: sel ? 'var(--accent-light)' : '#fff',
                          color: sel ? 'var(--accent-dark)' : 'var(--text)',
                          border: `1px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                        }}
                      >
                        {RUN_PROFILES[id].label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ font: '500 12px/1.5 var(--f)', color: 'var(--green)', marginTop: 12 }}>
                  Free Max runs entirely on free public sources plus your AI key, $0 in data fees.
                </div>
              </>
            )}

            {meta.k === 'aikey' && (
              <>
                <label style={labelStyle}>
                  Anthropic or OpenAI API key
                  <input value={aiKey} onChange={(e) => setAiKey(e.target.value)} placeholder="sk-…" style={{ ...inputStyle, fontFamily: 'var(--fm)', fontSize: 13 }} />
                </label>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, padding: '11px 13px', background: 'var(--accent-light)', border: '1px solid #CBE0F5', borderRadius: 10 }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.8} style={{ flex: 'none', marginTop: 1 }}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  <span style={{ font: '500 12px/1.5 var(--f)', color: 'var(--text2)' }}>
                    Nothing runs without an AI key, it funds extraction, scoring, and outreach. You pay your provider directly, we never mark it up.
                  </span>
                </div>
              </>
            )}

            {meta.k === 'run' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 11, padding: '12px 14px' }}>
                  <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.8}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <span style={{ font: '500 13px var(--f)', color: 'var(--text2)' }}>e.g. behavioral health orgs in Maricopa County</span>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 14, padding: 14, background: 'var(--green-light)', border: '1px solid #BFE6CE', borderRadius: 11 }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={1.9} style={{ flex: 'none' }}>
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  <span style={{ font: '500 12.5px/1.5 var(--f)', color: '#15603A' }}>Org created, profile set, AI key added. You’re ready to run.</span>
                </div>
              </>
            )}

            <div data-row="" style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              {meta.k === 'run' ? (
                <button onClick={finish} style={{ flex: 1, textAlign: 'center', font: '700 14px var(--f)', color: '#fff', background: 'var(--accent)', padding: 13, borderRadius: 11, border: 'none', cursor: 'pointer' }}>
                  Run your first list →
                </button>
              ) : (
                <>
                  <button onClick={back} disabled={step === 0} style={{ font: '600 13.5px var(--f)', color: 'var(--text2)', background: '#fff', border: '1px solid var(--border)', borderRadius: 11, padding: '13px 20px', cursor: step === 0 ? 'default' : 'pointer', opacity: step === 0 ? 0.5 : 1 }}>
                    Back
                  </button>
                  <div style={{ flex: 1 }} />
                  {meta.k === 'aikey' && (
                    <button onClick={next} style={{ font: '600 13.5px var(--f)', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '13px 8px' }}>
                      Add later
                    </button>
                  )}
                  <button onClick={next} disabled={!canNext} style={{ font: '700 14px var(--f)', color: '#fff', background: 'var(--accent)', border: 'none', borderRadius: 11, padding: '13px 24px', cursor: canNext ? 'pointer' : 'default', opacity: canNext ? 1 : 0.5 }}>
                    Continue
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link href="/" style={{ font: '600 12.5px var(--f)', color: 'var(--text3)' }}>Do this later, back to site</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
