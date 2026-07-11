import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { RUN_PROFILES, type RunProfileId } from '@lead/core';
import { CtaBand } from '@/components/marketing/CtaBand';
import { Faq } from '@/components/marketing/Faq';

export const metadata: Metadata = {
  title: 'Pricing — Lead Booster Pro',
  description: 'Simple flat platform pricing. You bring the keys; we run the machine. Free sources cost nothing but your AI tokens.',
};

interface Tier {
  name: string;
  price: string;
  who: string;
  sub: string;
  popular: boolean;
  features: string[];
}

const TIERS: Tier[] = [
  { name: 'Starter', price: '$49', who: 'Solo operators and founders testing outbound.', sub: 'flat · no per-seat · no credits', popular: false, features: ['1 seat', 'Free sources + web scraper', 'Bring your own AI key', 'Evidence on every contact', 'CSV export · caps apply'] },
  { name: 'Pro', price: '$149', who: 'Growing teams running real outbound.', sub: 'flat · up to 5 seats included', popular: true, features: ['Up to 5 seats', 'All providers (your keys)', 'ICP scoring · fit + intent', 'Territory sweep', 'CRM push + outreach', 'Higher caps · priority runs'] },
  { name: 'Agency', price: '$399', who: 'Teams running many clients at once.', sub: 'flat · unlimited seats', popular: false, features: ['Unlimited seats', 'Client workspaces', 'Highest caps', 'White-label option', 'Priority support'] },
];

const PROFILE_ORDER: RunProfileId[] = ['scraper', 'free-max', 'hunter-apollo', 'full-stack'];

const stat: CSSProperties = { textAlign: 'center' };
const statNum = (color: string): CSSProperties => ({ font: '800 30px var(--f)', color });
const statLbl: CSSProperties = { font: '600 10px var(--f)', color: '#8FA1B5', letterSpacing: '.04em' };

export default function PricingPage() {
  return (
    <div className="lbpm-fade">
      <section data-pad="" style={{ maxWidth: 1000, margin: '0 auto', padding: '70px 40px 20px', textAlign: 'center' }}>
        <h1 data-h1="" style={{ font: '800 46px/1.08 var(--f)', letterSpacing: '-.03em', margin: 0, color: 'var(--navy)' }}>
          Simple platform pricing. You bring the keys; we run the machine.
        </h1>
        <p style={{ font: '400 18px/1.6 var(--f)', color: 'var(--text2)', margin: '20px auto 0', maxWidth: 660 }}>
          You pay for the platform. Your data and AI usage run on your own API keys, no markup, no reselling, full cost control. Free sources cost nothing but your AI tokens.
        </p>
      </section>

      <section data-pad="" style={{ maxWidth: 1140, margin: '0 auto', padding: '20px 40px' }}>
        <div style={{ display: 'flex', gap: 12, background: 'var(--green-light)', border: '1px solid #BFE6CE', borderRadius: 12, padding: '16px 20px', marginBottom: 32 }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={1.9} style={{ flex: 'none', marginTop: 1 }}>
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          <span style={{ font: '500 14.5px/1.55 var(--f)', color: '#15603A' }}>
            We charge for the software that finds, verifies, scores, and organizes your leads. We never charge you for data or resell it, you use your own provider keys and pay them directly.
          </span>
        </div>

        <div data-tiers="" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
          {TIERS.map((t) => (
            <div
              key={t.name}
              style={{
                position: 'relative',
                background: '#fff',
                border: t.popular ? '2px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: 18,
                padding: 26,
                boxShadow: t.popular ? '0 12px 40px rgba(74,143,214,.14)' : '0 1px 3px rgba(0,0,0,.04)',
              }}
            >
              {t.popular && (
                <div style={{ font: '700 10px var(--f)', letterSpacing: '.08em', color: '#fff', background: 'var(--accent)', padding: '4px 10px', borderRadius: 999, position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)' }}>
                  MOST POPULAR
                </div>
              )}
              <div style={{ font: '700 18px var(--f)', color: 'var(--navy)' }}>{t.name}</div>
              <div style={{ font: '400 13.5px var(--f)', color: 'var(--text3)', marginTop: 4, minHeight: 38 }}>{t.who}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '16px 0 4px' }}>
                <span style={{ font: '800 34px var(--f)', color: 'var(--navy)' }}>{t.price}</span>
                <span style={{ font: '500 14px var(--f)', color: 'var(--text3)' }}>/mo</span>
              </div>
              <div style={{ font: '500 11px var(--f)', color: 'var(--text3)', marginBottom: 18 }}>{t.sub}</div>
              <Link
                href="/signup"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  font: '700 14px var(--f)',
                  borderRadius: 10,
                  padding: 11,
                  ...(t.popular
                    ? { background: 'var(--accent)', color: '#fff' }
                    : { background: '#fff', color: 'var(--accent)', border: '1px solid var(--accent)' }),
                }}
              >
                Start free
              </Link>
              <div style={{ height: 1, background: 'var(--border-l)', margin: '20px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {t.features.map((ft) => (
                  <div key={ft} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2.2} style={{ flex: 'none', marginTop: 1 }}>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span style={{ font: '400 13.5px/1.45 var(--f)', color: 'var(--text2)' }}>{ft}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* RUN PROFILES — how aggressive each run is, all on your own keys */}
        <div style={{ marginTop: 44 }}>
          <h2 style={{ font: '700 24px var(--f)', letterSpacing: '-.02em', color: 'var(--navy)', margin: '0 0 6px' }}>Every plan runs on your keys, at the speed you choose</h2>
          <p style={{ font: '400 15px/1.6 var(--f)', color: 'var(--text2)', margin: '0 0 20px', maxWidth: 720 }}>
            A run profile decides how aggressive the machine gets. Start free, add paid providers whenever you want, they only fire below your confidence threshold.
          </p>
          <div data-cols="" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {PROFILE_ORDER.map((id) => {
              const p = RUN_PROFILES[id];
              return (
                <div key={id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ font: '700 14px var(--f)', color: 'var(--navy)' }}>{p.label}</span>
                    <span style={{ font: '700 8.5px var(--f)', letterSpacing: '.05em', padding: '2px 7px', borderRadius: 5, color: p.paid ? 'var(--amber)' : 'var(--green)', background: p.paid ? 'var(--amber-light)' : 'var(--green-light)' }}>
                      {p.paid ? 'PAID ON' : 'FREE'}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: 11, lineHeight: 1.55, color: 'var(--text2)' }}>{p.readout}</div>
                  {p.paidProviders.length > 0 && (
                    <div style={{ font: '500 11px var(--f)', color: 'var(--text3)', marginTop: 10 }}>
                      Paid waterfall: {p.paidProviders.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* WORKED EXAMPLE */}
        <div data-row="" style={{ display: 'flex', alignItems: 'center', gap: 24, background: 'var(--navy)', borderRadius: 18, padding: '28px 32px', marginTop: 32 }}>
          <div style={{ flex: 1 }}>
            <div style={{ font: '700 12px var(--f)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>A worked example</div>
            <div style={{ font: '700 22px/1.3 var(--f)', color: '#fff' }}>
              A county-wide construction sweep: <span style={{ color: 'var(--green)' }}>$0 in data fees</span>, ~$2 in your own AI tokens, ~1,400 contacts.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 18 }}>
            <div style={stat}><div style={statNum('var(--green)')}>$0</div><div style={statLbl}>DATA FEES</div></div>
            <div style={stat}><div style={statNum('#fff')}>~$2</div><div style={statLbl}>YOUR AI KEY</div></div>
            <div style={stat}><div style={statNum('#fff')}>1,400</div><div style={statLbl}>CONTACTS</div></div>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 44 }}>
          <h2 style={{ font: '700 28px var(--f)', letterSpacing: '-.02em', color: 'var(--navy)', margin: '0 0 20px', textAlign: 'center' }}>Questions people actually ask</h2>
          <Faq />
        </div>
      </section>

      <CtaBand />
    </div>
  );
}
