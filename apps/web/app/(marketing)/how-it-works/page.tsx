import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { CtaBand } from '@/components/marketing/CtaBand';
import { LiveDemo } from '@/components/marketing/LiveDemo';
import { WaterfallCard, EvidenceCard } from '@/components/marketing/cards';

export const metadata: Metadata = {
  title: 'How it works — Lead Booster Pro',
  description: 'Free public data, read intelligently, with a receipt for every fact. Watch the pipeline run stage by stage.',
};

const SOURCE_ROWS: { source: string; yield: string; cost: string; costStyle: CSSProperties }[] = [
  { source: 'Company websites', yield: 'team pages, leadership, contact info', cost: 'Free', costStyle: { font: '700 12px var(--f)', color: 'var(--green)' } },
  { source: 'Government registries', yield: 'NPI, SAM.gov, SEC, county assessors', cost: 'Free', costStyle: { font: '700 12px var(--f)', color: 'var(--green)' } },
  { source: 'Licensing boards', yield: 'contractors, brokers, clinicians, dealers', cost: 'Free', costStyle: { font: '700 12px var(--f)', color: 'var(--green)' } },
  { source: 'Search', yield: 'finds the pages worth reading', cost: '~$0.001', costStyle: { font: '700 12px var(--fm)', color: 'var(--amber)' } },
  { source: 'Paid providers (optional)', yield: 'Hunter, Apollo, PDL, only when enabled', cost: 'metered', costStyle: { font: '700 11px var(--f)', color: 'var(--amber)' } },
];

const HOW_SECTIONS: { title: string; body: string; ui: React.ReactNode }[] = [
  { title: 'How free-first actually works', body: 'Free sources and verification run first. Paid providers only fire when you’ve enabled them and free data falls short, and you see the cost before it spends.', ui: <WaterfallCard /> },
  { title: 'What “evidence” means', body: 'A real contact record with its timeline: this email came from the company’s contact page on this date, verified deliverable, confidence 0.98.', ui: <EvidenceCard /> },
  { title: 'How it stays clean', body: 'Public and licensed sources only, no logged-in social scraping, suppression lists, polite rate limits, and your approval gates on anything automated.', ui: null },
  { title: 'How it gets smarter', body: 'It remembers which sources work for each kind of business and gets cheaper and faster the more you run it.', ui: null },
];

const gridHeader: CSSProperties = { display: 'grid', gridTemplateColumns: '1.3fr 1.5fr 0.8fr', gap: 14, padding: '12px 20px' };

export default function HowItWorksPage() {
  return (
    <div className="lbpm-fade">
      <section data-pad="" style={{ maxWidth: 1000, margin: '0 auto', padding: '70px 40px 30px', textAlign: 'center' }}>
        <h1 data-h1="" style={{ font: '800 44px/1.1 var(--f)', letterSpacing: '-.03em', margin: 0, color: 'var(--navy)' }}>
          Free public data, read intelligently, with a receipt for every fact.
        </h1>
        <p style={{ font: '400 18px/1.6 var(--f)', color: 'var(--text2)', margin: '20px auto 0', maxWidth: 640 }}>
          For the people who want to know how the sausage is made, because with lead data, that’s the whole point.
        </p>
      </section>

      <section data-pad="" style={{ maxWidth: 1140, margin: '0 auto', padding: '10px 40px 30px' }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 22px' }}>
          <div style={{ font: '700 12px var(--f)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>Watch it work</div>
          <p style={{ font: '400 15.5px/1.6 var(--f)', color: 'var(--text2)', margin: 0 }}>
            This is the product, running. Free sources first, every contact traced to its source, cost shown as it goes.
          </p>
        </div>
        <LiveDemo />
        <div style={{ textAlign: 'center', marginTop: 22 }}>
          <Link href="/signup" style={{ font: '700 15px var(--f)', color: '#fff', background: 'var(--accent)', padding: '14px 24px', borderRadius: 11, display: 'inline-block' }}>
            Start free, no credit card
          </Link>
        </div>
      </section>

      <section data-pad="" style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 40px' }}>
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ font: '700 22px var(--f)', color: 'var(--navy)', margin: '0 0 16px' }}>Where the data comes from</h3>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ ...gridHeader, background: 'var(--surf)', borderBottom: '1px solid var(--border)', font: '700 10px var(--f)', letterSpacing: '.08em', color: 'var(--text3)' }}>
              <span>SOURCE</span>
              <span>WHAT IT YIELDS</span>
              <span>COST</span>
            </div>
            {SOURCE_ROWS.map((r) => (
              <div key={r.source} style={{ ...gridHeader, borderTop: '1px solid var(--border-l)', alignItems: 'center' }}>
                <span style={{ font: '600 13.5px var(--f)', color: 'var(--navy)' }}>{r.source}</span>
                <span style={{ font: '400 13px var(--f)', color: 'var(--text2)' }}>{r.yield}</span>
                <span style={r.costStyle}>{r.cost}</span>
              </div>
            ))}
          </div>
        </div>
        {HOW_SECTIONS.map((h) => (
          <div key={h.title} style={{ marginBottom: 32, background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
            <h3 style={{ font: '700 21px var(--f)', color: 'var(--navy)', margin: '0 0 10px' }}>{h.title}</h3>
            <p style={{ font: '400 15px/1.6 var(--f)', color: 'var(--text2)', margin: 0 }}>{h.body}</p>
            {h.ui && <div style={{ marginTop: 16 }}>{h.ui}</div>}
          </div>
        ))}
      </section>

      <CtaBand />
    </div>
  );
}
