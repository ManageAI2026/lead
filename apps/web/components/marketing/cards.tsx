/**
 * Product-UI recreations used as visual proof across the marketing site.
 * Faithful ports of the approved prototype's card methods. Pure/server-safe,
 * except HeroRunCard and LiveDemo which live in their own client files.
 */
import type { CSSProperties } from 'react';
import type { Industry } from './industries';

type ChipTone = 'green' | 'amber' | 'slate';

function MonoChip({ children, tone = 'slate' }: { children: React.ReactNode; tone?: ChipTone }) {
  const map: Record<ChipTone, [string, string]> = {
    green: ['#16A34A', '#E8F8EE'],
    amber: ['#D97706', '#FEF8E8'],
    slate: ['#475569', '#EEF1F6'],
  };
  const [c, bg] = map[tone];
  return (
    <span style={{ fontFamily: 'var(--fm)', fontSize: 10, padding: '2px 7px', borderRadius: 6, color: c, background: bg, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

const cardBase: CSSProperties = {
  background: '#fff',
  border: '1px solid var(--border)',
  borderRadius: 16,
  boxShadow: '0 8px 30px rgba(30,51,72,.08)',
};

/* ---------------------------------------------------------------- RunCard */

export interface RunRow {
  domain: string;
  stage: string;
  activity: string;
  tone: 'green' | 'amber';
  found: number;
}

export function RunCard({ found = 3 }: { found?: number }) {
  const rows: RunRow[] = [
    { domain: 'sunridgebehavioral.com', stage: 'Enrich', activity: 'Hunter lookup…', tone: 'amber', found },
    { domain: 'brightpathdental.com', stage: 'Verify', activity: 'MX + SMTP…', tone: 'green', found: Math.max(1, found - 1) },
    { domain: 'valleyrecovery.org', stage: 'Scrape', activity: 'Playwright render…', tone: 'green', found: Math.max(0, found - 2) },
  ];
  return (
    <div style={{ ...cardBase, boxShadow: '0 12px 40px rgba(30,51,72,.12)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '13px 16px', borderBottom: '1px solid var(--border-l)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A' }} />
        <span style={{ font: '700 12.5px var(--f)', color: '#1E293B' }}>Live run</span>
        <span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: '#7A8B9A' }}>job_8f2c1a</span>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {rows.map((r) => (
          <div key={r.domain} style={{ border: '1px solid var(--border)', borderRadius: 11, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: '#1E293B' }}>{r.domain}</span>
              <span style={{ font: '700 8.5px var(--f)', letterSpacing: '.05em', color: '#2D6AAF', background: '#EBF3FC', padding: '2px 6px', borderRadius: 5 }}>
                {r.stage.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7 }}>
              <span
                className="lbp-spin"
                style={{ width: 9, height: 9, border: `1.6px solid ${r.tone === 'amber' ? '#D97706' : '#16A34A'}` }}
              />
              <span style={{ fontFamily: 'var(--fm)', fontSize: 10.5, color: r.tone === 'amber' ? '#D97706' : '#16A34A' }}>{r.activity}</span>
              <span style={{ marginLeft: 'auto', font: '700 13px var(--f)', color: '#1E293B' }}>{r.found}</span>
              <span style={{ font: '600 8px var(--f)', color: '#7A8B9A' }}>FOUND</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderTop: '1px solid var(--border-l)', background: '#F5F6F8' }}>
        <span style={{ font: '600 11px var(--f)', color: '#475569' }}>Cost this run</span>
        <span style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'var(--fm)', fontSize: 12, color: '#16A34A' }}>$0.00 free</span>
          <span style={{ fontFamily: 'var(--fm)', fontSize: 12, color: '#475569' }}>$1.90 AI key</span>
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- CostLedger */

export function CostLedger() {
  const rows: [string, string, string, string][] = [
    ['Free sources', '100%', '#16A34A', '$0.00'],
    ['Data providers', 'off', '#7A8B9A', '$0.00'],
    ['Your AI key', '1,240 pages', '#475569', '$2.10'],
  ];
  return (
    <div style={{ ...cardBase, padding: 22 }}>
      <div style={{ font: '700 10px var(--f)', letterSpacing: '.1em', color: '#7A8B9A', marginBottom: 14 }}>COST LEDGER · CONSTRUCTION SWEEP</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
        <span style={{ font: '800 42px var(--f)', color: '#16A34A', letterSpacing: '-.02em' }}>$0.00</span>
        <span style={{ font: '600 13px var(--f)', color: '#475569' }}>data cost</span>
      </div>
      <div style={{ font: '500 13px var(--f)', color: '#475569', marginBottom: 16 }}>1,400 contacts · free sources: 100%</div>
      <div style={{ height: 9, borderRadius: 5, overflow: 'hidden', background: '#EEF1F6', display: 'flex', marginBottom: 16 }}>
        <div style={{ width: '100%', background: '#16A34A' }} />
      </div>
      {rows.map((r, i) => (
        <div key={r[0]} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '8px 0', borderTop: i ? '1px solid var(--border-l)' : 'none' }}>
          <span style={{ font: '500 13px var(--f)', color: '#1E293B' }}>{r[0]}</span>
          <span style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
            <span style={{ font: '500 11px var(--f)', color: '#7A8B9A' }}>{r[1]}</span>
            <span style={{ fontFamily: 'var(--fm)', fontSize: 13, fontWeight: 600, color: r[2] }}>{r[3]}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------- EvidenceCard */

export function EvidenceCard() {
  const ev: [string, string, string, ChipTone][] = [
    ['company', 'Sunridge Behavioral', 'scrape · mailto · 0.98', 'green'],
    ['email', 'd.reyes@sunridgebehavioral.com', 'npi · registry · 0.99', 'green'],
    ['verification', 'deliverable', 'smtp · probe · 0.98', 'green'],
    ['ICP', 'fit 91 · intent 74', 'sonnet · rubric', 'slate'],
  ];
  const dotColor: Record<string, string> = { green: '#16A34A', slate: '#4A8FD6' };
  return (
    <div style={{ ...cardBase, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
        <span style={{ width: 38, height: 38, borderRadius: 10, background: '#EBF3FC', color: '#4A8FD6', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 13px var(--f)' }}>DR</span>
        <div>
          <div style={{ font: '700 15px var(--f)', color: '#1E293B' }}>Dana Reyes</div>
          <div style={{ font: '500 12px var(--f)', color: '#7A8B9A' }}>Director of Operations</div>
        </div>
      </div>
      <div style={{ font: '700 9.5px var(--f)', letterSpacing: '.1em', color: '#7A8B9A', marginBottom: 12 }}>CONTACT EVIDENCE</div>
      <div style={{ position: 'relative', paddingLeft: 18 }}>
        <div style={{ position: 'absolute', left: 4, top: 4, bottom: 4, width: 2, background: '#E2E6EC' }} />
        {ev.map((e, i) => (
          <div key={e[0]} style={{ position: 'relative', marginBottom: i < ev.length - 1 ? 14 : 0 }}>
            <span style={{ position: 'absolute', left: -18, top: 3, width: 9, height: 9, borderRadius: '50%', background: dotColor[e[3]], border: '2px solid #fff' }} />
            <div style={{ font: '700 9px var(--f)', letterSpacing: '.06em', textTransform: 'uppercase', color: '#7A8B9A' }}>{e[0]}</div>
            <div style={{ font: '500 13px var(--f)', color: '#1E293B', margin: '2px 0 5px' }}>{e[1]}</div>
            <MonoChip tone={e[3]}>{e[2]}</MonoChip>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- ComposerCard */

export function ComposerCard() {
  return (
    <div style={{ ...cardBase, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border)', borderRadius: 10, padding: '11px 13px' }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#7A8B9A" strokeWidth={1.8}>
          <path d="M12 21s-7-5.7-7-11a7 7 0 0 1 14 0c0 5.3-7 11-7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        <span style={{ font: '500 13px var(--f)', color: '#1E293B' }}>construction companies within 30 mi of Phoenix</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
        <span style={{ font: '600 11px var(--f)', color: '#fff', background: '#4A8FD6', padding: '5px 11px', borderRadius: 999 }}>Free Max</span>
        <span style={{ font: '600 11px var(--f)', color: '#475569', background: '#fff', border: '1px solid var(--border)', padding: '5px 11px', borderRadius: 999 }}>Scraper Only</span>
        <span style={{ font: '600 11px var(--f)', color: '#475569', background: '#fff', border: '1px solid var(--border)', padding: '5px 11px', borderRadius: 999 }}>Full Stack</span>
      </div>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-l)', fontFamily: 'var(--fm)', fontSize: 11, color: '#475569' }}>
        Free scrape → verify → score. No paid providers. AI: Claude.
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- WaterfallCard */

export function WaterfallCard() {
  const steps: [string, string, string][] = [
    ['AZ ROC license board', 'free', '#16A34A'],
    ['Company website scrape', 'free', '#16A34A'],
    ['MX / SMTP verify', 'free', '#16A34A'],
    ['Hunter (only if email missing)', '$0.04', '#D97706'],
  ];
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {steps.map((s, i) => {
        const free = s[1] === 'free';
        return (
          <div key={s[0]} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: 9, border: `1px solid ${free ? 'var(--border)' : '#EEC981'}`, background: free ? '#fff' : '#FEF8E8' }}>
            <span style={{ width: 20, height: 20, flex: 'none', borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: '700 10px var(--f)', background: free ? '#E8F8EE' : '#FEF8E8', color: s[2] }}>{i + 1}</span>
            <span style={{ font: '600 12.5px var(--f)', color: '#1E293B', flex: 1 }}>{s[0]}</span>
            <span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: s[2] }}>{s[1]}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------- VerifyCard */

export function VerifyCard() {
  const rows: [string, string, string, string, string][] = [
    ['d.reyes@sunridgebehavioral.com', 'Deliverable', '#16A34A', '#E8F8EE', 'MX + SMTP · free'],
    ['t.alvarez@valleyrecovery.org', 'Risky', '#D97706', '#FEF8E8', 'catch-all · NeverBounce'],
    ['l.bianchi@cedarlogistics.com', 'Guess — gated', '#DC2626', '#FEF2F2', 'pattern · not sent'],
  ];
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 16, boxShadow: '0 8px 30px rgba(30,51,72,.08)', display: 'flex', flexDirection: 'column', gap: 9 }}>
      {rows.map((r) => (
        <div key={r[0]} style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 10 }}>
          <span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: '#1E293B', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r[0]}</span>
          <span style={{ font: '700 10px var(--f)', padding: '2px 8px', borderRadius: 6, color: r[2], background: r[3], flex: 'none' }}>{r[1]}</span>
          <span style={{ fontFamily: 'var(--fm)', fontSize: 9.5, color: '#7A8B9A', width: '100%' }}>{r[4]}</span>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- ScoreCard */

function ScoreBar({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ font: '600 12px var(--f)', color: '#1E293B' }}>{label}</span>
        <span style={{ font: '700 13px var(--f)', color }}>{val}</span>
      </div>
      <div style={{ height: 7, background: '#EEF1F6', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${val}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}

export function ScoreCard() {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 18, boxShadow: '0 8px 30px rgba(30,51,72,.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ width: 34, height: 34, borderRadius: 9, background: '#EBF3FC', color: '#4A8FD6', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 12px var(--f)' }}>DR</span>
        <div>
          <div style={{ font: '700 13.5px var(--f)', color: '#1E293B' }}>Dana Reyes</div>
          <div style={{ font: '500 11px var(--f)', color: '#7A8B9A' }}>Director of operations</div>
        </div>
        <span style={{ marginLeft: 'auto', font: '700 11px var(--f)', color: '#16A34A', background: '#E8F8EE', borderRadius: 6, padding: '3px 9px' }}>Tier A</span>
      </div>
      <ScoreBar label="Fit — structural" val={91} color="#16A34A" />
      <ScoreBar label="Intent — timing" val={74} color="#4A8FD6" />
      <div style={{ font: '500 11px var(--f)', color: '#7A8B9A', marginTop: 2 }}>Two scores, never blended. Tier off fit.</div>
    </div>
  );
}

/* ------------------------------------------------------------ DeliverCard */

export function DeliverCard() {
  const dests: [string, string][] = [
    ['Pipedrive', '#16A34A'],
    ['HubSpot', '#16A34A'],
    ['ActiveCampaign', '#16A34A'],
    ['CSV export', '#475569'],
    ['Webhook', '#475569'],
  ];
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 18, boxShadow: '0 8px 30px rgba(30,51,72,.08)' }}>
      <div style={{ font: '700 10px var(--f)', letterSpacing: '.08em', color: '#7A8B9A', marginBottom: 12 }}>PUSH 240 QUALIFIED CONTACTS TO</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {dests.map((d) => (
          <span key={d[0]} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '600 12px var(--f)', color: '#1E293B', background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 9, padding: '7px 11px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: d[1] }} />
            {d[0]}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <span style={{ font: '700 12.5px var(--f)', color: '#fff', background: 'var(--accent)', borderRadius: 9, padding: '9px 14px' }}>Draft outreach</span>
        <span style={{ font: '700 12.5px var(--f)', color: 'var(--accent)', background: '#fff', border: '1px solid var(--accent)', borderRadius: 9, padding: '9px 14px' }}>Push to CRM</span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- EngineerCard */

export function EngineerCard() {
  const steps: [string, boolean][] = [
    ['Wrote az-medicaid.adapter, free-source flag', true],
    ['Added fixture + 4 passing tests', true],
    ['Awaiting approval to promote', false],
  ];
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 8px 30px rgba(30,51,72,.08)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 15px', background: 'var(--surf)', borderBottom: '1px solid var(--border-l)' }}>
        <span style={{ font: '700 8.5px var(--f)', letterSpacing: '.06em', color: '#7C5CFC', background: '#F0EDFF', padding: '2px 6px', borderRadius: 5 }}>BUILD</span>
        <span style={{ font: '700 12.5px var(--f)', color: '#1E293B' }}>Add Arizona Medicaid source</span>
        <span style={{ marginLeft: 'auto', font: '700 9px var(--f)', letterSpacing: '.05em', color: '#D97706', background: '#FEF8E8', padding: '3px 8px', borderRadius: 6 }}>AWAITING APPROVAL</span>
      </div>
      <div style={{ padding: '14px 15px' }}>
        {steps.map((s) => (
          <div key={s[0]} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
            <span style={{ width: 15, height: 15, flex: 'none', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: s[1] ? '#16A34A' : '#EEF1F6', color: '#fff', fontSize: 9 }}>{s[1] ? '✓' : ''}</span>
            <span style={{ font: '500 12px var(--f)', color: s[1] ? '#1E293B' : '#7A8B9A' }}>{s[0]}</span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <span style={{ flex: 1, textAlign: 'center', font: '700 12px var(--f)', color: '#fff', background: 'var(--accent)', borderRadius: 9, padding: 9 }}>Approve & deploy</span>
          <span style={{ font: '700 12px var(--f)', color: '#475569', background: '#fff', border: '1px solid var(--border)', borderRadius: 9, padding: '9px 14px' }}>Reject</span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------- IndustryContact */

export function IndustryContact({ pn }: { pn: Industry['person'] }) {
  const em: Record<string, [string, string, string]> = {
    deliverable: ['#16A34A', '#E8F8EE', 'Deliverable'],
    risky: ['#D97706', '#FEF8E8', 'Risky'],
    guess: ['#DC2626', '#FEF2F2', 'Guess'],
  };
  const tm: Record<string, [string, string]> = {
    A: ['#16A34A', '#E8F8EE'],
    B: ['#4A8FD6', '#EBF3FC'],
    C: ['#7A8B9A', '#F1F5F9'],
  };
  const e = em[pn.es];
  const t = tm[pn.tier];
  const Badge = ({ label, val, c }: { label: string; val: number; c: [string, string] }) => (
    <span style={{ font: '700 10px var(--f)', padding: '2px 7px', borderRadius: 5, color: c[0], background: c[1] }}>
      {label} {val}
    </span>
  );
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 16, boxShadow: '0 8px 30px rgba(30,51,72,.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
        <span style={{ width: 40, height: 40, borderRadius: 10, background: '#EBF3FC', color: '#4A8FD6', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 13px var(--f)' }}>
          {pn.name.split(' ').map((w) => w[0]).join('')}
        </span>
        <div>
          <div style={{ font: '700 15px var(--f)', color: '#1E293B' }}>{pn.name}</div>
          <div style={{ font: '500 12px var(--f)', color: '#7A8B9A' }}>{pn.title} · {pn.co}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--fm)', fontSize: 11.5, color: '#1E293B' }}>{pn.email}</span>
        <span style={{ font: '700 10px var(--f)', padding: '2px 8px', borderRadius: 6, color: e[0], background: e[1] }}>{e[2]}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--fm)', fontSize: 10.5, color: '#16A34A', background: '#E8F8EE', border: '1px solid #BFE6CE', borderRadius: 6, padding: '2px 8px' }}>{pn.chip}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, borderTop: '1px solid var(--border-l)', paddingTop: 11 }}>
        <span style={{ font: '700 11px var(--f)', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: t[0], background: t[1] }}>{pn.tier}</span>
        <Badge label="fit" val={pn.fit} c={['#16A34A', '#E8F8EE']} />
        <Badge label="intent" val={pn.intent} c={['#4A8FD6', '#EBF3FC']} />
      </div>
    </div>
  );
}
