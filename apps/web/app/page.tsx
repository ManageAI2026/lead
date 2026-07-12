import Link from 'next/link';
import type { CSSProperties } from 'react';
import { Icon } from '@/components/ui';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { CtaBand } from '@/components/marketing/CtaBand';
import { HeroRunCard } from '@/components/marketing/HeroRunCard';
import { CostLedger, ComposerCard, RunCard, EvidenceCard } from '@/components/marketing/cards';
import { INDUSTRIES, INDUSTRY_SLUGS } from '@/components/marketing/industries';

const PAINS = [
  { title: 'Unverifiable.', body: '“Verified” with no source, no date, no confidence. Trust it or don’t, you can’t check.' },
  { title: 'Expensive by default.', body: 'Every lookup burns a credit, even when the answer was sitting on the company’s own public website for free.' },
  { title: 'One-size-fits-none.', body: 'A generic database that can’t tell a 12-person clinic from a 12,000-person hospital, or find the person you actually need.' },
];

const GAINS = [
  { title: 'Every field traceable.', body: 'Source, method, confidence, date, on every email and phone. Click any contact and see its whole history.' },
  { title: 'Free-first by design.', body: 'Public web, licensing boards, and government registries run first. Paid providers only fire when you turn them on and free data comes up short.' },
  { title: 'Any vertical, any scale.', body: 'One company or ten thousand. Filter by industry, size, revenue, role, and location. Built for how your market actually looks.' },
];

const STEPS = [
  { n: '1', title: 'Point it at your market.', body: 'A domain, an uploaded list, or a territory, “every construction company within 30 miles of Phoenix.”', ui: <ComposerCard /> },
  { n: '2', title: 'It finds the people, free sources first.', body: 'It locates each company’s website and public records, reads the team and leadership pages, and pulls names, titles, emails, and phones, showing the cost as it goes, usually $0.', ui: <RunCard /> },
  { n: '3', title: 'You get contacts with receipts.', body: 'Verified, scored against your ideal customer profile, each one traceable to its source. Export, push to your CRM, or draft outreach.', ui: <EvidenceCard /> },
];

const FEATURES = [
  { title: 'Territory sweep', body: 'Pick a vertical and a radius. It finds every business, resolves their websites, and pulls the people.', free: true, icon: '<path d="M12 21s-7-5.7-7-11a7 7 0 0 1 14 0c0 5.3-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>' },
  { title: 'Evidence on every contact', body: 'Source, method, confidence, date on every field. No black box.', free: false, icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15l2 2 4-4"/>' },
  { title: 'Bring your own keys', body: 'Your AI and data-provider keys. Your data, your cost, no markup, no reselling.', free: false, icon: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.5 12.5 8-8M16 5l3 3M13 8l2 2"/>' },
  { title: 'Free public sources', body: 'Government registries, licensing boards, and company sites, used before any paid provider.', free: true, icon: '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/>' },
  { title: 'ICP scoring', body: 'Score every contact on fit and intent against your ideal customer profile. Work the right accounts first.', free: false, icon: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.5" fill="currentColor"/>' },
  { title: 'It gets smarter every run', body: 'The system learns which sources work for your market and gets cheaper and faster over time.', free: false, icon: '<path d="M12 20V10M18 20V4M6 20v-4"/>' },
];

const TRUST = [
  { title: 'Public and licensed sources only.', body: 'It reads public data and data you’re licensed to use. It does not scrape logged-in social networks.', icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' },
  { title: 'Your keys, your data.', body: 'Bring your own API keys. We don’t resell data or train on your lists.', icon: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.5 12.5 8-8M16 5l3 3"/>' },
  { title: 'Compliance built in.', body: 'Suppression lists, rate limits, and honest source records so your outreach stays clean.', icon: '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>' },
  { title: 'You’re in control.', body: 'Every automated action can be gated on your approval. Nothing runs without you.', icon: '<path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="4"/>' },
];

const h2: CSSProperties = { font: '700 34px/1.15 var(--f)', letterSpacing: '-.02em', margin: 0, color: 'var(--navy)' };
const kicker = (color: string): CSSProperties => ({ font: '700 12px var(--f)', letterSpacing: '.1em', textTransform: 'uppercase', color, marginBottom: 14 });

export default function HomePage() {
  return (
    <MarketingShell>
      <div className="lbpm-fade">
        {/* HERO */}
        <section data-pad="" style={{ maxWidth: 1240, margin: '0 auto', padding: '74px 40px 40px' }}>
          <div data-hero="" style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 56, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: '600 12px var(--f)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--accent)', background: 'var(--accent-light)', padding: '6px 12px', borderRadius: 999, marginBottom: 22 }}>
                Sales intelligence that shows its work
              </div>
              <h1 data-h1="" style={{ font: '800 54px/1.06 var(--f)', letterSpacing: '-.03em', margin: 0, color: 'var(--navy)' }}>
                Stop paying for lead data you can’t trust.
              </h1>
              <p style={{ font: '400 18px/1.6 var(--f)', color: 'var(--text2)', margin: '22px 0 30px', maxWidth: 560 }}>
                Lead Booster Pro finds decision-makers from public and licensed sources, free data first, your own API keys, and every contact traceable to exactly where it came from. Point it at a company, a list, or a whole territory.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <Link href="/signup" style={{ font: '700 15px var(--f)', color: '#fff', background: 'var(--accent)', padding: '14px 24px', borderRadius: 11 }}>
                  Start free, no credit card
                </Link>
                <a href="#demo-anchor" style={{ font: '600 15px var(--f)', color: 'var(--accent)', padding: '14px 4px', display: 'flex', alignItems: 'center', gap: 7 }}>
                  See it find real contacts <span style={{ fontSize: 17 }}>↓</span>
                </a>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
              <div
                data-throb=""
                style={{
                  width: '100%',
                  maxWidth: 340,
                  aspectRatio: '1 / 1',
                  borderRadius: 28,
                  background: 'radial-gradient(circle at 50% 38%, #EBF3FC, #fff 68%)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 14,
                  animation: 'lbpm-throb 2.6s ease-in-out infinite',
                }}
              >
                <span style={{ width: 74, height: 74, borderRadius: 20, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon path='<path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 4-5"/>' size={38} stroke="#fff" strokeWidth={2} />
                </span>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-.02em' }}>
                    <span style={{ color: 'var(--navy)' }}>MANAGE </span>
                    <span style={{ color: 'var(--accent)' }}>AI</span>
                  </div>
                  <div style={{ font: '600 12px var(--f)', color: 'var(--text3)', marginTop: 4 }}>Lead Booster Intelligence System</div>
                </div>
              </div>
            </div>
          </div>

          <div id="demo-anchor" style={{ marginTop: 40 }}>
            <HeroRunCard />
          </div>

          <div style={{ marginTop: 52, padding: '20px 26px', background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ font: '600 14px var(--f)', color: 'var(--text)' }}>
              Free public sources first · Every field carries its source · Your keys, your data, your cost.
            </span>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['Evidence on every contact', 'Free-first, always', 'Your API keys, we never resell data'].map((b) => (
                <span key={b} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '600 12px var(--f)', color: 'var(--green)', background: 'var(--green-light)', padding: '6px 12px', borderRadius: 999 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
                  {b}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section data-pad="" style={{ maxWidth: 1240, margin: '0 auto', padding: '60px 40px' }}>
          <div style={{ maxWidth: 720 }}>
            <div style={kicker('var(--amber)')}>The problem</div>
            <h2 style={h2}>Lead data is a black box, and the box is usually wrong.</h2>
            <p style={{ font: '400 17px/1.6 var(--f)', color: 'var(--text2)', margin: '18px 0 0' }}>
              You pay per contact for emails that bounce, phone numbers that ring the wrong person, and “verified” data with no way to check what “verified” means. When a contact is wrong, you have no idea why, because the tool never told you where it came from. You’re renting someone else’s stale database and hoping.
            </p>
          </div>
          <div data-cols="" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 34 }}>
            {PAINS.map((p) => (
              <div key={p.title} style={{ background: '#fff', border: '1px solid var(--border)', borderLeft: '3px solid var(--amber)', borderRadius: 14, padding: 22 }}>
                <div style={{ font: '700 16px var(--f)', color: 'var(--navy)', marginBottom: 7 }}>{p.title}</div>
                <div style={{ font: '400 14px/1.55 var(--f)', color: 'var(--text2)' }}>{p.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* SHIFT */}
        <section style={{ background: 'var(--navy)' }}>
          <div data-pad="" style={{ maxWidth: 1240, margin: '0 auto', padding: '64px 40px' }}>
            <div style={{ maxWidth: 720 }}>
              <div style={kicker('var(--accent)')}>The shift</div>
              <h2 style={{ ...h2, color: '#fff' }}>What if every contact came with a receipt?</h2>
              <p style={{ font: '400 17px/1.6 var(--f)', color: '#B7C4D4', margin: '18px 0 0' }}>
                Lead Booster Pro reads the public web the way a person does, a company’s own team page, a state licensing board, a government registry, and pulls the people it finds with a full record of where each fact came from, when, and how confident it is. It exhausts free sources before it spends a cent of your paid credits. And it runs on your keys, so the data is yours and the cost is yours to control.
              </p>
            </div>
            <div data-cols="" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 34 }}>
              {GAINS.map((g) => (
                <div key={g.title} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', borderLeft: '3px solid var(--green)', borderRadius: 14, padding: 22 }}>
                  <div style={{ font: '700 16px var(--f)', color: '#fff', marginBottom: 7 }}>{g.title}</div>
                  <div style={{ font: '400 14px/1.55 var(--f)', color: '#B7C4D4' }}>{g.body}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW */}
        <section data-pad="" style={{ maxWidth: 1240, margin: '0 auto', padding: '70px 40px' }}>
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 40px' }}>
            <h2 style={h2}>Point it. Watch it work. Trust what it finds.</h2>
          </div>
          <div data-cols="" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 34, height: 34, flex: 'none', borderRadius: 9, background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 15px var(--f)' }}>{s.n}</span>
                  <div style={{ font: '700 17px var(--f)', color: 'var(--navy)' }}>{s.title}</div>
                </div>
                <div style={{ font: '400 14.5px/1.55 var(--f)', color: 'var(--text2)' }}>{s.body}</div>
                <div style={{ marginTop: 2 }}>{s.ui}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURE GRID */}
        <section style={{ background: 'var(--surf)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div data-pad="" style={{ maxWidth: 1240, margin: '0 auto', padding: '66px 40px' }}>
            <h2 style={{ font: '700 32px/1.15 var(--f)', letterSpacing: '-.02em', margin: '0 0 34px', color: 'var(--navy)' }}>What you get</h2>
            <div data-cols="" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {FEATURES.map((f) => (
                <div key={f.title} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, background: f.free ? 'var(--green-light)' : 'var(--accent-light)', color: f.free ? 'var(--green)' : 'var(--accent)' }}>
                    <Icon path={f.icon} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ font: '700 16px var(--f)', color: 'var(--navy)' }}>{f.title}</span>
                    {f.free && <span style={{ font: '700 9.5px var(--f)', letterSpacing: '.05em', color: 'var(--green)', background: 'var(--green-light)', padding: '2px 7px', borderRadius: 5 }}>FREE-FIRST</span>}
                  </div>
                  <div style={{ font: '400 14px/1.55 var(--f)', color: 'var(--text2)' }}>{f.body}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COST STORY */}
        <section data-pad="" style={{ maxWidth: 1240, margin: '0 auto', padding: '74px 40px' }}>
          <div data-2col="" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <div style={kicker('var(--green)')}>The cost story</div>
              <h2 style={{ font: '700 36px/1.12 var(--f)', letterSpacing: '-.02em', margin: 0, color: 'var(--navy)' }}>Watch the price of a lead go to zero.</h2>
              <p style={{ font: '400 17px/1.6 var(--f)', color: 'var(--text2)', margin: '18px 0 0' }}>
                Most of what you need is already public. A construction sweep across a whole county can cost <strong style={{ color: 'var(--green)' }}>$0</strong> in data fees, you only pay your own AI tokens to read the pages. Turn on paid providers when you want to go deeper; the system shows you the cost before it spends, and the free-vs-paid split after.
              </p>
            </div>
            <div><CostLedger /></div>
          </div>
        </section>

        {/* INDUSTRIES */}
        <section style={{ background: 'var(--navy)' }}>
          <div data-pad="" style={{ maxWidth: 1240, margin: '0 auto', padding: '60px 40px' }}>
            <h2 style={{ font: '700 28px/1.2 var(--f)', letterSpacing: '-.02em', margin: 0, color: '#fff' }}>Built for your industry</h2>
            <p style={{ font: '400 16px/1.6 var(--f)', color: '#B7C4D4', margin: '14px 0 26px', maxWidth: 720 }}>
              Different markets live in different places. Contractors are on state license boards; clinics are in the NPI registry; dealers are on dealer-license rolls. Lead Booster Pro knows where each vertical’s data lives, and most of it is free.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {INDUSTRY_SLUGS.map((slug) => (
                <Link key={slug} href={`/industries/${slug}`} style={{ font: '600 13.5px var(--f)', color: '#DCE6F2', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', padding: '9px 16px', borderRadius: 999 }}>
                  {INDUSTRIES[slug].chip}
                </Link>
              ))}
            </div>
            <div style={{ font: '500 12px var(--f)', color: '#7C8DA3', marginTop: 16 }}>Click any industry to see where its data lives.</div>
          </div>
        </section>

        {/* TRUST & CONTROL */}
        <section data-pad="" style={{ maxWidth: 1240, margin: '0 auto', padding: '70px 40px' }}>
          <h2 style={{ font: '700 32px/1.15 var(--f)', letterSpacing: '-.02em', margin: '0 0 8px', color: 'var(--navy)' }}>Built to be trusted with your outreach.</h2>
          <div data-cols="" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginTop: 28 }}>
            {TRUST.map((t) => (
              <div key={t.title} style={{ display: 'flex', gap: 14, background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
                <span style={{ width: 36, height: 36, flex: 'none', borderRadius: 9, background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon path={t.icon} />
                </span>
                <div>
                  <div style={{ font: '700 15.5px var(--f)', color: 'var(--navy)', marginBottom: 5 }}>{t.title}</div>
                  <div style={{ font: '400 14px/1.55 var(--f)', color: 'var(--text2)' }}>{t.body}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <CtaBand />
      </div>
    </MarketingShell>
  );
}
