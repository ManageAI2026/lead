import Link from 'next/link';
import type { Metadata } from 'next';
import { CtaBand } from '@/components/marketing/CtaBand';
import { INDUSTRIES, INDUSTRY_SLUGS } from '@/components/marketing/industries';

export const metadata: Metadata = {
  title: 'Industries — Lead Booster Pro',
  description: 'Contractors on license boards, clinics in the NPI registry, dealers on dealer-license rolls. See where each vertical’s data lives — most of it free.',
};

export default function IndustriesIndexPage() {
  return (
    <div className="lbpm-fade">
      <section style={{ background: 'var(--navy)' }}>
        <div data-pad="" style={{ maxWidth: 1140, margin: '0 auto', padding: '64px 40px' }}>
          <div style={{ font: '700 12px var(--f)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>Industries</div>
          <h1 data-h1="" style={{ font: '800 42px/1.1 var(--f)', letterSpacing: '-.03em', margin: 0, color: '#fff', maxWidth: 820 }}>
            Different markets live in different places. It knows where yours is.
          </h1>
          <p style={{ font: '400 17px/1.6 var(--f)', color: '#B7C4D4', margin: '18px 0 0', maxWidth: 720 }}>
            Contractors are on state license boards; clinics are in the NPI registry; dealers are on dealer-license rolls. Lead Booster Pro knows where each vertical’s data lives, and most of it is free.
          </p>
        </div>
      </section>

      <section data-pad="" style={{ maxWidth: 1140, margin: '0 auto', padding: '50px 40px 20px' }}>
        <div data-cols="" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {INDUSTRY_SLUGS.map((slug) => {
            const ind = INDUSTRIES[slug];
            return (
              <Link
                key={slug}
                href={`/industries/${slug}`}
                style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}
              >
                <span style={{ alignSelf: 'flex-start', font: '700 10.5px var(--f)', letterSpacing: '.05em', color: 'var(--accent)', background: 'var(--accent-light)', padding: '4px 10px', borderRadius: 999, marginBottom: 14 }}>
                  {ind.chip}
                </span>
                <div style={{ font: '700 17px/1.3 var(--f)', color: 'var(--navy)', marginBottom: 8 }}>{ind.headline}</div>
                <div style={{ display: 'flex', gap: 18, marginTop: 'auto', paddingTop: 16 }}>
                  <div><div style={{ font: '800 18px var(--f)', color: 'var(--navy)' }}>{ind.stat[0]}</div><div style={{ font: '600 9px var(--f)', color: 'var(--text3)', letterSpacing: '.04em' }}>BUSINESSES</div></div>
                  <div><div style={{ font: '800 18px var(--f)', color: 'var(--green)' }}>{ind.stat[1]}</div><div style={{ font: '600 9px var(--f)', color: 'var(--text3)', letterSpacing: '.04em' }}>DATA COST</div></div>
                  <div><div style={{ font: '800 18px var(--f)', color: 'var(--navy)' }}>{ind.stat[2]}</div><div style={{ font: '600 9px var(--f)', color: 'var(--text3)', letterSpacing: '.04em' }}>CONTACTS</div></div>
                </div>
                <span style={{ font: '600 13px var(--f)', color: 'var(--accent)', marginTop: 16 }}>See where its data lives →</span>
              </Link>
            );
          })}
        </div>
      </section>

      <CtaBand />
    </div>
  );
}
