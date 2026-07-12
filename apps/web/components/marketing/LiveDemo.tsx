'use client';

import { useEffect, useRef, useState } from 'react';

const DEMO_STAGES: { key: string; acts: [string, 'free' | 'paid'][] }[] = [
  { key: 'Discover', acts: [['Places API…', 'free'], ['SAM.gov lookup…', 'free']] },
  { key: 'Scrape', acts: [['fetch /team…', 'free'], ['Playwright render…', 'free']] },
  { key: 'Extract', acts: [['person-block parse…', 'paid'], ['Haiku extract…', 'paid']] },
  { key: 'Enrich', acts: [['NPI registry…', 'free'], ['Hunter lookup…', 'paid']] },
  { key: 'Verify', acts: [['MX / SMTP…', 'free'], ['NeverBounce…', 'paid']] },
  { key: 'Score', acts: [['ICP rubric…', 'free'], ['Sonnet score…', 'paid']] },
  { key: 'Deliver', acts: [['CSV export', 'free'], ['→ Pipedrive', 'free']] },
];

const DEMO_SEEDS: [string, string][] = [
  ['sunridge', 'Healthcare'], ['precisionauto', 'Automotive'], ['keystone', 'Financial'],
  ['cornerstone', 'Construction'], ['brightpath', 'Healthcare'], ['meridian', 'B2B Services'],
  ['ironwood', 'Construction'], ['harvestpantry', 'CPG & Retail'], ['lakeside', 'Hospitality'],
  ['forgeworks', 'Manufacturing'], ['sunbelt', 'Real Estate'], ['novacosmetics', 'CPG & Retail'],
];

interface DemoCard {
  id: number;
  name: string;
  industry: string;
  stage: number;
  found: number;
  spark: number[];
  flash: boolean;
  act?: string;
  kind?: 'free' | 'paid';
  _done?: boolean;
  _doneTicks?: number;
}

interface DemoState {
  cards: DemoCard[];
  next: number;
  tick: number;
  free: number;
  paid: number;
  qualified: number;
}

function initDemo(complete: boolean): DemoState {
  const cards: DemoCard[] = DEMO_SEEDS.slice(0, 9).map((s, i) => ({
    id: i,
    name: s[0],
    industry: s[1],
    stage: complete ? 6 : Math.min(6, Math.floor(i / 1.6)),
    found: complete ? 2 + (i % 3) : 0,
    spark: [5, 7, 6, 8, 6],
    flash: false,
  }));
  return { cards, next: 9, tick: 0, free: complete ? 1.9 : 0, paid: complete ? 0.06 : 0, qualified: complete ? 9 : 0 };
}

function tickDemo(d: DemoState): DemoState {
  let { free, paid, qualified, next } = d;
  const cards = d.cards.map((c) => {
    const n: DemoCard = { ...c, spark: c.spark.slice(), flash: false };
    const meta = DEMO_STAGES[n.stage];
    const act = meta.acts[Math.floor(Math.random() * meta.acts.length)];
    n.act = act[0];
    n.kind = act[1];
    if (act[1] === 'paid') paid += 0.0006 + Math.random() * 0.0012;
    else free += 0.008 + Math.random() * 0.02;
    if (n.stage >= 3 && n.stage <= 4 && Math.random() < 0.5) {
      n.found += 1;
      n.flash = true;
    }
    n.spark.push(3 + Math.floor(Math.random() * 9));
    if (n.spark.length > 6) n.spark.shift();
    if (Math.random() < 0.5) {
      n.stage++;
      if (n.stage > 6) {
        n.stage = 6;
        n._done = true;
        qualified++;
      }
    }
    return n;
  });
  const kept: DemoCard[] = [];
  cards.forEach((c) => {
    if (c._done) {
      c._doneTicks = (c._doneTicks || 0) + 1;
      if (c._doneTicks > 1) {
        const s = DEMO_SEEDS[next % DEMO_SEEDS.length];
        kept.push({ id: next, name: s[0], industry: s[1], stage: 0, found: 0, spark: [5, 7, 6, 8, 6], flash: false });
        next++;
        return;
      }
    }
    kept.push(c);
  });
  return { cards: kept, next, tick: d.tick + 1, free, paid, qualified };
}

const COLW = 150;
const GAP = 14;

export function LiveDemo() {
  const [demo, setDemo] = useState<DemoState | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setDemo(initDemo(true));
      return;
    }
    setDemo(initDemo(false));
    timer.current = setInterval(() => setDemo((d) => (d ? tickDemo(d) : d)), 750);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  if (!demo) return <div style={{ height: 360 }} />;

  const N = DEMO_STAGES.length;
  const counts = DEMO_STAGES.map((_, i) => demo.cards.filter((c) => c.stage >= i).length + Math.floor(demo.tick * 0.4));
  const rowOf = DEMO_STAGES.map(() => 0);
  const trackW = N * COLW + (N - 1) * GAP;

  const positioned = demo.cards.map((c) => {
    const row = rowOf[c.stage]++;
    return { c, x: c.stage * (COLW + GAP), y: row * 116 };
  });
  const maxRow = Math.max(1, ...rowOf);

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 8px 30px rgba(30,51,72,.08)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--border-l)', flexWrap: 'wrap' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', animation: 'lbpm-pulse 2s infinite' }} />
        <span style={{ font: '700 13px var(--f)', color: 'var(--navy)' }}>Live run</span>
        <span style={{ fontFamily: 'var(--fm)', fontSize: 12, color: '#7A8B9A' }}>job_8f2c1a</span>
        <span style={{ font: '500 12px var(--f)', color: '#7A8B9A' }}>· 18 targets · 9 verticals</span>
      </div>

      <div className="lbp-scroll" style={{ overflowX: 'auto', padding: '14px 18px' }}>
        <div style={{ minWidth: trackW }}>
          <div style={{ display: 'flex', gap: GAP, marginBottom: 8 }}>
            {DEMO_STAGES.map((s, i) => (
              <div key={s.key} style={{ width: COLW, flex: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ font: '700 11px var(--f)', color: 'var(--navy)' }}>{s.key}</span>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: '#7A8B9A' }}>{counts[i]}</span>
                </div>
                <div style={{ height: 2, borderRadius: 2, background: 'var(--border)', marginTop: 6 }} />
              </div>
            ))}
          </div>
          <div style={{ position: 'relative', height: maxRow * 116 + 4, transition: 'height .4s ease' }}>
            {positioned.map(({ c, x, y }) => {
              const dot = c.kind === 'paid' ? 'var(--amber)' : 'var(--green)';
              const spark = c.spark.map((v, i) => `${(i / (c.spark.length - 1)) * 40},${18 - (v / 12) * 16}`).join(' ');
              return (
                <div
                  key={c.id}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    width: COLW,
                    background: '#fff',
                    border: `1px solid ${c.flash ? 'var(--green)' : 'var(--border)'}`,
                    borderRadius: 11,
                    padding: 10,
                    boxShadow: c.flash ? '0 0 0 3px rgba(22,163,74,.18)' : '0 1px 3px rgba(30,51,72,.06)',
                    transition: 'left .55s cubic-bezier(.4,0,.2,1),top .4s ease,box-shadow .4s,border-color .4s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    <span style={{ font: '700 7.5px var(--f)', letterSpacing: '.05em', color: 'var(--accent)', background: 'var(--accent-light)', padding: '2px 5px', borderRadius: 4, flex: 'none' }}>RUNNING</span>
                  </div>
                  <div style={{ display: 'inline-block', marginTop: 6, font: '600 9px var(--f)', color: 'var(--text2)', background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 6px' }}>{c.industry}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, minHeight: 14 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flex: 'none' }} />
                    <span style={{ fontFamily: 'var(--fm)', fontSize: 10, color: dot, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.act || 'queued…'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 }}>
                    <span>
                      <span style={{ font: '700 16px var(--f)', color: 'var(--navy)' }}>{c.found}</span>
                      <span style={{ font: '700 8px var(--f)', color: '#7A8B9A', marginLeft: 4 }}>FOUND</span>
                    </span>
                    <svg width={40} height={18} viewBox="0 0 40 18" fill="none">
                      <polyline points={spark} stroke={dot} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderTop: '1px solid var(--border-l)', background: 'var(--surf)', fontFamily: 'var(--fm)', fontSize: 12.5, flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--green)', fontWeight: 600 }}>free ${demo.free.toFixed(2)}</span>
        <span style={{ color: '#C3CCD8' }}>·</span>
        <span style={{ color: 'var(--amber)' }}>paid ${demo.paid.toFixed(2)}</span>
        <span style={{ color: '#C3CCD8' }}>·</span>
        <span style={{ color: 'var(--text2)' }}>per qualified contact ${(demo.qualified ? demo.paid / demo.qualified : 0.001).toFixed(3)}</span>
      </div>
    </div>
  );
}
