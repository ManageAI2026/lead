import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CtaBand } from '@/components/marketing/CtaBand';
import { IndustryContact } from '@/components/marketing/cards';
import { INDUSTRIES, INDUSTRY_SLUGS } from '@/components/marketing/industries';

export function generateStaticParams() {
  return INDUSTRY_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const ind = INDUSTRIES[params.slug];
  if (!ind) return { title: 'Industry — Lead Booster Pro' };
  return { title: `${ind.name} — Lead Booster Pro`, description: ind.headline };
}

export default function IndustryPage({ params }: { params: { slug: string } }) {
  const ind = INDUSTRIES[params.slug];
  if (!ind) notFound();

  const statLbl = { font: '600 10px var(--f)', color: '#8FA1B5', letterSpacing: '.04em' } as const;

  return (
    <div className="lbpm-fade">
      <section style={{ background: 'var(--navy)' }}>
        <div data-pad="" style={{ maxWidth: 1140, margin: '0 auto', padding: '56px 40px' }}>
          <Link href="/industries" style={{ font: '600 12.5px var(--f)', color: '#B7C4D4', display: 'inline-block', marginBottom: 16 }}>
            ← All industries
          </Link>
          <div style={{ font: '700 12px var(--f)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>Built for {ind.name}</div>
          <h1 data-h1="" style={{ font: '800 42px/1.1 var(--f)', letterSpacing: '-.03em', margin: 0, color: '#fff', maxWidth: 800 }}>{ind.headline}</h1>
          <p style={{ font: '400 17px/1.6 var(--f)', color: '#B7C4D4', margin: '18px 0 0', maxWidth: 720 }}>{ind.blurb}</p>
          <div style={{ display: 'flex', gap: 26, marginTop: 26, flexWrap: 'wrap' }}>
            <div><div style={{ font: '800 26px var(--f)', color: '#fff' }}>{ind.stat[0]}</div><div style={statLbl}>BUSINESSES IN A TYPICAL SWEEP</div></div>
            <div><div style={{ font: '800 26px var(--f)', color: 'var(--green)' }}>{ind.stat[1]}</div><div style={statLbl}>DATA COST, FREE SOURCES</div></div>
            <div><div style={{ font: '800 26px var(--f)', color: '#fff' }}>{ind.stat[2]}</div><div style={statLbl}>CONTACTS EXPECTED</div></div>
          </div>
        </div>
      </section>

      <section data-pad="" style={{ maxWidth: 1140, margin: '0 auto', padding: '50px 40px 20px' }}>
        <div data-2col="" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 40, alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ font: '700 12px var(--f)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--green)' }}>Where this industry’s data lives</span>
              <span style={{ font: '700 9px var(--f)', color: 'var(--green)', background: 'var(--green-light)', border: '1px solid #BFE6CE', borderRadius: 5, padding: '2px 7px' }}>FREE</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ind.free.map((f) => (
                <div key={f.n} style={{ background: '#fff', border: '1px solid var(--border)', borderLeft: '3px solid var(--green)', borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ font: '700 15px var(--f)', color: 'var(--navy)' }}>{f.n}</span>
                    <span style={{ fontFamily: 'var(--fm)', fontSize: 10.5, color: 'var(--green)' }}>free · {f.src}</span>
                  </div>
                  <div style={{ font: '400 13.5px/1.5 var(--f)', color: 'var(--text2)', marginTop: 5 }}>{f.y}</div>
                  <div style={{ font: '500 11.5px var(--f)', color: 'var(--text3)', marginTop: 6 }}>{f.j}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ font: '700 12px var(--f)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>A contact it finds</div>
            <IndustryContact pn={ind.person} />
            <div style={{ font: '700 12px var(--f)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text3)', margin: '26px 0 12px' }}>Websites we read</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ind.sites.map((s) => (
                <div key={s} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#fff', border: '1px solid var(--border)', borderRadius: 11, padding: '12px 14px' }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.9} style={{ flex: 'none', marginTop: 1 }}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
                  </svg>
                  <span style={{ font: '500 13px/1.45 var(--f)', color: 'var(--text2)' }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </div>
  );
}
