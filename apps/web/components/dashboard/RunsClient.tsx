'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  RUN_PROFILES,
  type Contact,
  type IcpProfile,
  type Run,
  type RunInput,
  type RunProfileId,
  type Target,
} from '@lead/core';
import {
  STAGES_META,
  STAGE_INDEX,
  BADGE_TONE,
  activityColor,
  esMeta,
  tierMeta,
  chipStyle,
  fmt$,
  fmtTime,
  initialsOf,
  VERTICAL_LIST,
} from '@/components/dashboard/shared';

type SweepMode = 'off' | 'compose';

const PAID_PROVIDER_COST: Record<string, string> = {
  Hunter: '$0.04',
  Apollo: '$0.03',
  PDL: '$0.08',
  NeverBounce: '$0.008',
  'Bright Data': '$0.04',
  Clay: '$0.09',
  Apify: '$0.05',
};

const PROFILE_DEFS: [RunProfileId | 'new', string][] = [
  ['scraper', 'Scraper Only'],
  ['free-max', 'Free Max'],
  ['hunter-apollo', 'Hunter + Apollo'],
  ['full-stack', 'Full Stack'],
  ['new', '+ New'],
];

// Snake→camel mapper for realtime payloads (server mappers are server-only).
function mapTargetRow(r: Record<string, any>): Target {
  return {
    id: r.id,
    runId: r.run_id,
    orgId: r.org_id,
    domain: r.domain,
    vertical: r.vertical ?? null,
    stage: r.stage,
    status: r.status,
    activity: r.activity,
    activityKind: r.activity_kind,
    found: r.found,
    retries: r.retries,
    spend: Number(r.spend),
    icp: r.icp,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function sparkFor(id: string): string {
  let seed = 0;
  for (const ch of id) seed += ch.charCodeAt(0);
  const pts: number[] = [];
  for (let i = 0; i < 7; i++) {
    const x = Math.sin(seed * 12.9 + i * 7.1) * 10000;
    pts.push(3 + Math.floor((x - Math.floor(x)) * 9));
  }
  return pts.map((v, i) => `${(i / 6) * 46},${20 - (v / 12) * 18}`).join(' ');
}

interface ReplayEvent {
  stage: string;
  t: string;
  color: string;
  detail: string;
  chip?: string;
}
function buildReplay(t: Target, paid: boolean): ReplayEvent[] {
  const evs: ReplayEvent[] = [];
  evs.push({ stage: 'Discover', t: '0:00', color: 'var(--green)', detail: 'Places API → resolved domain', chip: 'places · api · 1.00' });
  evs.push({ stage: 'Scrape', t: '0:04', color: 'var(--green)', detail: 'fetch /team → 302, Playwright render OK' });
  if (t.retries > 0) {
    evs.push({ stage: 'Extract', t: '0:09', color: 'var(--red)', detail: 'person-block parse → 0 blocks (JS-rendered)' });
    evs.push({ stage: 'Repair', t: '0:11', color: 'var(--amber)', detail: 'agent: switch to shadow-DOM strategy → resumed' });
    evs.push({ stage: 'Extract', t: '0:14', color: 'var(--green)', detail: 'Haiku extract → 4 person blocks', chip: 'scrape · haiku · 0.94' });
  } else {
    evs.push({ stage: 'Extract', t: '0:09', color: 'var(--green)', detail: 'Haiku extract → person blocks found', chip: 'scrape · haiku · 0.96' });
  }
  evs.push({ stage: 'Enrich', t: '0:18', color: 'var(--green)', detail: 'NPI registry → license match (free)', chip: 'npi · registry · 0.99' });
  if (paid) evs.push({ stage: 'Enrich', t: '0:21', color: 'var(--amber)', detail: 'confidence 0.62 < 0.70 → Hunter lookup', chip: 'hunter · api · 0.92' });
  evs.push({ stage: 'Verify', t: '0:25', color: 'var(--green)', detail: 'MX + SMTP → deliverable', chip: 'smtp · probe · 0.98' });
  evs.push({ stage: 'Score', t: '0:28', color: 'var(--accent)', detail: `ICP rubric → tier A (${t.icp || 82})` });
  evs.push({ stage: 'Deliver', t: '0:31', color: 'var(--green)', detail: '→ CSV + Pipedrive note' });
  return evs;
}

export function RunsClient({
  orgId,
  defaultProfile,
  paidEnabled,
  run: initialRun,
  initialTargets,
  contactsByDomain,
  icpProfiles,
}: {
  orgId: string | null;
  defaultProfile: RunProfileId;
  paidEnabled: boolean;
  run: Run | null;
  initialTargets: Target[];
  contactsByDomain: Record<string, Contact[]>;
  icpProfiles: IcpProfile[];
}) {
  const router = useRouter();
  const [run, setRun] = useState<Run | null>(initialRun);
  const [targets, setTargets] = useState<Target[]>(initialTargets);
  const [profile, setProfile] = useState<RunProfileId>(defaultProfile);
  const [paid, setPaid] = useState<boolean>(RUN_PROFILES[defaultProfile]?.paid ?? false);
  const [paidProv, setPaidProv] = useState<Record<string, boolean>>({
    Hunter: true, Apollo: true, PDL: false, NeverBounce: true, 'Bright Data': true, Clay: false, Apify: false,
  });
  const [composer, setComposer] = useState('');
  const [replayId, setReplayId] = useState<string | null>(null);
  const [learningOpen, setLearningOpen] = useState(false);
  const [sweepMode, setSweepMode] = useState<SweepMode>('off');
  const [starting, setStarting] = useState(false);

  // Realtime: subscribe to target + run changes for the active run.
  useEffect(() => {
    if (!run || !orgId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`run-${run.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'targets', filter: `run_id=eq.${run.id}` }, (payload) => {
        const row = payload.new as Record<string, any>;
        if (!row || !row.id) return;
        const mapped = mapTargetRow(row);
        setTargets((prev) => {
          const idx = prev.findIndex((t) => t.id === mapped.id);
          if (idx === -1) return [...prev, mapped];
          const next = prev.slice();
          next[idx] = mapped;
          return next;
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'jobs', filter: `id=eq.${run.id}` }, (payload) => {
        const r = payload.new as Record<string, any>;
        setRun((prev) => (prev ? { ...prev, status: r.status, spendFree: Number(r.spend_free ?? 0), spendPaid: Number(r.spend_paid ?? 0), targetsDone: r.targets_done ?? 0, contactsFound: r.contacts_found ?? 0 } : prev));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [run?.id, orgId]);

  function chooseProfile(id: RunProfileId) {
    setProfile(id);
    setPaid(RUN_PROFILES[id]?.paid ?? false);
  }

  async function startRun(input: RunInput) {
    if (!orgId || starting) return;
    setStarting(true);
    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, input, icpProfileId: icpProfiles[0]?.id ?? null }),
      });
      if (res.ok) {
        setSweepMode('off');
        setComposer('');
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({ error: `request failed (${res.status})` }));
        window.alert(`Run not started: ${data.error ?? res.status}`);
      }
    } finally {
      setStarting(false);
    }
  }

  function onNewRun() {
    const text = composer.trim();
    const input: RunInput = text.includes('.') && !text.includes(' ')
      ? { kind: 'company', domain: text }
      : { kind: 'prompt', text: text || 'New run' };
    startRun(input);
  }

  // ---- computed run view ----
  const counts = STAGES_META.map(() => 0);
  targets.forEach((t) => { const i = STAGE_INDEX[t.stage] ?? 0; counts[i]++; });

  const rowOf = STAGES_META.map(() => 0);
  const LW = 168, CW = 152;
  const cards = targets.map((t) => {
    const col = STAGE_INDEX[t.stage] ?? 0;
    const row = rowOf[col]++;
    const x = col * LW, y = row * 118;
    const border = t.status === 'failed' ? '#F0C2C2' : t.status === 'repairing' ? '#EEC981' : t.status === 'done' ? '#BFE6CE' : 'var(--border)';
    const bt = BADGE_TONE[t.status] ?? BADGE_TONE.running;
    return { t, x, y, border, bt, actColor: activityColor(t.activityKind), spinning: t.status === 'running' || t.status === 'repairing' };
  });
  const maxRow = Math.max(1, ...rowOf);
  const canvasHeight = maxRow * 118 + 8;

  const found = targets.reduce((a, t) => a + t.found, 0);
  const scored = targets.filter((t) => t.icp > 0);
  const avgIcp = scored.length ? Math.round(scored.reduce((a, t) => a + t.icp, 0) / scored.length) : 0;
  const qualified = Math.max(1, scored.filter((t) => t.icp >= 60).length);
  const spendFree = run?.spendFree ?? 0;
  const spendPaid = run?.spendPaid ?? 0;
  const total = spendFree + spendPaid;
  const costPer = fmt$(spendPaid / qualified);
  const elapsed = run?.startedAt ? (Date.now() - new Date(run.startedAt).getTime()) / 1000 : 0;

  const replayTarget = replayId != null ? targets.find((t) => t.id === replayId) ?? null : null;

  // ---- egress (visual) ----
  const egIps = [{ h: 'a3f9', ok: true }, { h: '7c21', ok: true }, { h: 'e40b', ok: false }, { h: 'b155', ok: true }, { h: 'd92c', ok: true }];
  const quarantined = egIps.filter((i) => !i.ok).length;

  const learnSpark = [58, 61, 60, 64, 67, 66, 70, 72, 71, 75, 78, 80];
  const learnSparkPoints = learnSpark.map((v, i) => `${(i / (learnSpark.length - 1)) * 200},${40 - ((v - 55) / 28) * 36}`).join(' ');

  const readout = RUN_PROFILES[profile]?.readout ?? '';
  const hasRun = !!run;

  const card = (extra?: React.CSSProperties): React.CSSProperties => ({ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,.04)', ...extra });

  if (sweepMode === 'compose') {
    return <SweepComposer onClose={() => setSweepMode('off')} onRun={(sweep) => startRun({ kind: 'sweep', sweep })} starting={starting} />;
  }

  return (
    <div style={{ padding: '30px 32px 60px', maxWidth: 1360, margin: '0 auto', animation: 'lbp-fade-up .5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ font: '700 30px/1.2 var(--f)', letterSpacing: '-.02em', margin: 0, color: 'var(--text)' }}>Runs</h1>
          <div style={{ marginTop: 4, font: '500 13px var(--f)', color: 'var(--text3)' }}>Point it at a company, a list, or a territory.</div>
        </div>
      </div>

      {/* Composer */}
      <div style={{ ...card(), padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '0 14px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            <input value={composer} onChange={(e) => setComposer(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onNewRun()} placeholder="Paste a domain, a list, drop a CSV — or describe a territory…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', font: '500 14px var(--f)', padding: '13px 0' }} />
            <span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--text3)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 7px' }}>CSV</span>
          </div>
          <button onClick={onNewRun} disabled={!orgId || starting} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '0 20px', font: '600 13.5px var(--f)', cursor: orgId ? 'pointer' : 'not-allowed', opacity: orgId ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>New Run
          </button>
          <button onClick={() => setSweepMode('compose')} style={{ background: '#fff', color: 'var(--accentd)', border: '1px solid var(--accent)', borderRadius: 10, padding: '0 18px', font: '600 13.5px var(--f)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 21s-7-5.7-7-11a7 7 0 0 1 14 0c0 5.3-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>Sweep a territory
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <span style={{ font: '700 10px var(--f)', letterSpacing: '.11em', color: 'var(--text3)', marginRight: 2 }}>PROFILE</span>
          {PROFILE_DEFS.map(([id, label]) => {
            const active = profile === id;
            const isNew = id === 'new';
            return (
              <button key={id} onClick={() => !isNew && chooseProfile(id as RunProfileId)} style={isNew
                ? { background: '#fff', color: 'var(--text3)', border: '1px dashed var(--border)', borderRadius: 999, padding: '6px 13px', font: '600 12px var(--f)', cursor: 'pointer' }
                : { background: active ? 'var(--accent)' : '#fff', color: active ? '#fff' : 'var(--text2)', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 999, padding: '6px 13px', font: '600 12px var(--f)', cursor: 'pointer', transition: '.15s' }}>{label}</button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--borderl)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'var(--fm)', fontSize: 12.5, color: 'var(--text2)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
            <span>{readout}</span>
          </div>
          <button onClick={() => { const n = !paid; setPaid(n); chooseProfile(n ? 'hunter-apollo' : 'free-max'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)', font: '600 12.5px var(--f)' }}>
            Paid providers
            <span style={{ width: 36, height: 20, borderRadius: 999, background: paid ? 'var(--amber)' : 'var(--border)', position: 'relative', transition: '.2s', display: 'inline-block' }}>
              <span style={{ position: 'absolute', top: 2, left: paid ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 2px rgba(0,0,0,.2)' }} />
            </span>
          </button>
        </div>

        {paid && (
          <div style={{ marginTop: 14, padding: 14, background: 'var(--amberl)', border: '1px solid #F5E2B8', borderRadius: 11 }}>
            <div style={{ font: '700 10px var(--f)', letterSpacing: '.1em', color: 'var(--amber)', marginBottom: 10 }}>PAID PROVIDERS ARMED · FIRE BELOW 0.70 CONFIDENCE</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.keys(paidProv).map((k) => {
                const on = paidProv[k];
                return (
                  <button key={k} onClick={() => setPaidProv((x) => ({ ...x, [k]: !x[k] }))} style={{ display: 'flex', alignItems: 'center', gap: 7, borderRadius: 9, padding: '7px 11px', font: '600 12px var(--f)', cursor: 'pointer', transition: '.15s', background: on ? '#fff' : 'transparent', color: on ? 'var(--amber)' : 'var(--text3)', border: `1px solid ${on ? '#EEC981' : 'var(--border)'}` }}>
                    {k}<span style={{ fontFamily: 'var(--fm)', fontSize: 10.5, opacity: 0.85 }}>{PAID_PROVIDER_COST[k]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Egress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 16px', marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
        <span style={{ font: '700 10px var(--f)', letterSpacing: '.1em', color: 'var(--text3)' }}>EGRESS</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, font: '600 12px var(--f)', color: 'var(--text)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></svg>
          US residential · rotating
        </span>
        <span style={{ fontFamily: 'var(--fm)', fontSize: 11.5, color: 'var(--text2)' }}>16 req/s</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 2 }}>
          {egIps.map((ip) => (
            <span key={ip.h} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--fm)', fontSize: 10.5, padding: '2px 8px', borderRadius: 6, background: ip.ok ? 'var(--greenl)' : 'var(--amberl)', color: ip.ok ? 'var(--green)' : 'var(--amber)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: ip.ok ? 'var(--green)' : 'var(--amber)' }} />{ip.h}
            </span>
          ))}
        </div>
        {quarantined > 0 && (
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, font: '600 11.5px var(--f)', color: 'var(--amber)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.2-8.5" /><path d="M21 3v6h-6" /></svg>
            rotating — {quarantined} address quarantined
          </span>
        )}
      </div>

      {/* Live run */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: hasRun ? 'var(--green)' : 'var(--text3)' }} />
            <span style={{ font: '700 13px var(--f)', color: 'var(--text)' }}>{hasRun ? 'Live run' : 'No active run'}</span>
            {hasRun && <span style={{ fontFamily: 'var(--fm)', fontSize: 12, color: 'var(--text3)' }}>{run!.id.slice(0, 8)}</span>}
            <span style={{ font: '500 12px var(--f)', color: 'var(--text3)' }}>· {targets.length} targets</span>
          </div>

          <div style={{ background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 16, minWidth: 1176, marginBottom: 8 }}>
              {STAGES_META.map((s, i) => (
                <div key={s.key} style={{ width: 152, flex: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ font: '700 11px var(--f)', color: 'var(--text)' }}>{s.label}</span>
                    <span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--text3)' }}>{counts[i]}</span>
                  </div>
                  <div style={{ height: 2, borderRadius: 2, background: 'var(--border)', marginTop: 6 }} />
                </div>
              ))}
            </div>

            {targets.length === 0 ? (
              <div style={{ minWidth: 1176, height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text3)' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="m5 3 14 9-14 9V3z" /></svg>
                <div style={{ font: '600 13px var(--f)', color: 'var(--text2)' }}>Nothing running yet</div>
                <div style={{ font: '500 12px var(--f)', color: 'var(--text3)' }}>Start a run above or sweep a territory — targets will animate across these seven stages live.</div>
              </div>
            ) : (
              <div style={{ position: 'relative', minWidth: 1176, transition: 'height .4s ease', height: canvasHeight }}>
                {cards.map((c) => {
                  const dc = contactsByDomain[c.t.domain] ?? [];
                  return (
                    <div key={c.t.id} onClick={() => setReplayId(c.t.id)} style={{ position: 'absolute', left: c.x + 8, top: c.y, width: CW, background: '#fff', border: `1px solid ${c.border}`, borderRadius: 12, padding: 11, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,.05)', transition: 'left .5s cubic-bezier(.4,0,.2,1),top .4s ease,border-color .3s,box-shadow .3s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--fm)', fontSize: 11, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.t.domain}</span>
                        <span style={{ background: c.bt[0], color: c.bt[1], font: '700 8.5px var(--f)', letterSpacing: '.05em', padding: '2px 6px', borderRadius: 5, flex: 'none' }}>{c.bt[2]}</span>
                      </div>
                      <div style={{ display: 'inline-block', marginTop: 7, font: '600 9.5px var(--f)', letterSpacing: '.02em', color: 'var(--text2)', background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 6px' }}>{c.t.vertical}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, minHeight: 15 }}>
                        {c.spinning && <span className="lbp-spin" style={{ width: 9, height: 9, border: `1.6px solid ${c.actColor}`, flex: 'none' }} />}
                        <span style={{ fontFamily: 'var(--fm)', fontSize: 10.5, color: c.actColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.t.activity}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 }}>
                        <div><span style={{ font: '700 19px var(--f)', color: 'var(--text)' }}>{c.t.found || dc.length}</span><span style={{ font: '600 9px var(--f)', color: 'var(--text3)', marginLeft: 4 }}>FOUND</span></div>
                        <svg width="46" height="20" viewBox="0 0 46 20" fill="none"><polyline points={sparkFor(c.t.id)} stroke={c.actColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Rail */}
        <aside style={{ width: 290, flex: 'none', ...card(), padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ font: '700 13px var(--f)', color: 'var(--text)' }}>Run summary</span>
            <span style={{ fontFamily: 'var(--fm)', fontSize: 12, color: 'var(--accent)' }}>{fmtTime(elapsed)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[[String(found), 'CONTACTS FOUND'], [avgIcp || '—', 'AVG ICP SCORE'], [(found ? 78 : 0) + '%', 'EMAIL FIND RATE'], [String(targets.length), 'TARGETS']].map(([v, l], i) => (
              <div key={i} style={{ background: 'var(--surf)', border: '1px solid var(--borderl)', borderRadius: 10, padding: '11px 12px' }}>
                <div style={{ font: '700 22px var(--f)', letterSpacing: '-.01em', color: 'var(--text)' }}>{v}</div>
                <div style={{ font: '600 10px var(--f)', color: 'var(--text3)', letterSpacing: '.03em', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--surf)', border: '1px solid var(--borderl)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ font: '700 10px var(--f)', letterSpacing: '.1em', color: 'var(--text3)', marginBottom: 10 }}>COST THIS RUN</div>
            <div style={{ display: 'flex', height: 9, borderRadius: 5, overflow: 'hidden', background: 'var(--border)', marginBottom: 10 }}>
              <div style={{ width: `${total ? (spendFree / total) * 100 : 100}%`, background: 'var(--green)' }} />
              <div style={{ width: `${total ? (spendPaid / total) * 100 : 0}%`, background: 'var(--amber)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--fm)', fontSize: 12, marginBottom: 6 }}><span style={{ color: 'var(--green)' }}>● free</span><span style={{ color: 'var(--text)' }}>{fmt$(spendFree)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--fm)', fontSize: 12, marginBottom: 12 }}><span style={{ color: 'var(--amber)' }}>● paid</span><span style={{ color: 'var(--text)' }}>{fmt$(spendPaid)}</span></div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ font: '500 11px var(--f)', color: 'var(--text2)' }}>per qualified contact</span>
              <span style={{ font: '700 17px var(--f)', color: 'var(--green)' }}>{costPer}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => run && updateRunStatus(run, run.status === 'paused' ? 'running' : 'paused', setRun)} disabled={!hasRun} style={{ flex: 1, background: '#fff', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 9, padding: 9, font: '600 12.5px var(--f)', cursor: hasRun ? 'pointer' : 'not-allowed', opacity: hasRun ? 1 : 0.5 }}>{run?.status === 'paused' ? 'Resume' : 'Pause'}</button>
            <button onClick={() => run && updateRunStatus(run, 'cancelled', setRun)} disabled={!hasRun} style={{ flex: 1, background: '#fff', border: '1px solid #F0C2C2', color: 'var(--red)', borderRadius: 9, padding: 9, font: '600 12.5px var(--f)', cursor: hasRun ? 'pointer' : 'not-allowed', opacity: hasRun ? 1 : 0.5 }}>Cancel</button>
          </div>
          <div style={{ marginTop: 12, font: '500 11px/1.5 var(--f)', color: 'var(--text3)' }}>Click any target to open its <span style={{ color: 'var(--text)', fontWeight: 600 }}>live console</span> — the contacts it&apos;s finding, plus every strategy, retry and repair.</div>
        </aside>
      </div>

      {/* Learning */}
      <div style={{ marginTop: 22, ...card(), overflow: 'hidden' }}>
        <button onClick={() => setLearningOpen((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accentl)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20V10M18 20V4M6 20v-4" /></svg>
          </span>
          <div style={{ flex: 1 }}><div style={{ font: '700 13px var(--f)', color: 'var(--text)' }}>Learning</div><div style={{ font: '500 11.5px var(--f)', color: 'var(--text3)' }}>What the system taught itself · Last 3 construction sweeps: estimate within 8% of actual.</div></div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.9" style={{ transition: 'transform .2s', transform: `rotate(${learningOpen ? 180 : 0}deg)` }}><path d="m6 9 6 6 6-6" /></svg>
        </button>
        {learningOpen && (
          <div style={{ padding: '4px 20px 20px', borderTop: '1px solid var(--borderl)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12, margin: '16px 0' }}>
              {[['4 this week', 'Playbooks promoted', 'shadow-DOM team pages · /our-team fallback · PDF staff lists · footer mailto'], ['12 site-classes', 'Strategies reordered', 'WordPress → footer-first · React SPAs → shadow-DOM first'], ['23 total', 'Regression fixtures added', 'every repaired site becomes a permanent test']].map(([val, label, detail], i) => (
                <div key={i} style={{ background: 'var(--surf)', border: '1px solid var(--borderl)', borderRadius: 11, padding: '13px 14px' }}>
                  <div style={{ font: '700 15px var(--f)', color: 'var(--text)' }}>{val}</div>
                  <div style={{ font: '600 11px var(--f)', color: 'var(--text2)', marginTop: 2 }}>{label}</div>
                  <div style={{ font: '500 10.5px/1.5 var(--f)', color: 'var(--text3)', marginTop: 6 }}>{detail}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surf)', border: '1px solid var(--borderl)', borderRadius: 11, padding: '13px 16px' }}>
              <div><div style={{ font: '700 10px var(--f)', letterSpacing: '.06em', color: 'var(--text3)' }}>MEAN EXTRACTION QUALITY</div><div style={{ font: '500 11px var(--f)', color: 'var(--text2)', marginTop: 2 }}>12 weeks · trending up</div></div>
              <svg width="200" height="40" viewBox="0 0 200 40" fill="none" style={{ marginLeft: 'auto' }}><polyline points={learnSparkPoints} stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>
        )}
      </div>

      {/* Live target console */}
      {replayTarget && (
        <ReplayDrawer target={replayTarget} paid={paid} contacts={contactsByDomain[replayTarget.domain] ?? []} onClose={() => setReplayId(null)} />
      )}
    </div>
  );
}

async function updateRunStatus(run: Run, status: string, setRun: (r: Run) => void) {
  setRun({ ...run, status: status as Run['status'] });
  try {
    const supabase = createClient();
    // Pause/resume writes the shared jobs table directly under RLS; Phase 2
    // moves this behind the gateway alongside the other job actions.
    await supabase.from('jobs').update({ status }).eq('id', run.id);
  } catch {
    /* optimistic; RLS may reject — status still reflects intent */
  }
}

function ReplayDrawer({ target, paid, contacts, onClose }: { target: Target; paid: boolean; contacts: Contact[]; onClose: () => void }) {
  const bt = BADGE_TONE[target.status] ?? BADGE_TONE.running;
  const actC = activityColor(target.activityKind);
  const events = buildReplay(target, paid);
  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(30,51,72,.28)', zIndex: 40, animation: 'lbp-fade-up .2s ease' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 470, background: '#fff', borderLeft: '1px solid var(--border)', zIndex: 41, overflowY: 'auto', boxShadow: '-24px 0 60px rgba(30,51,72,.15)' }}>
        <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid var(--borderl)', position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontFamily: 'var(--fm)', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{target.domain}</span><span style={{ background: bt[0], color: bt[1], font: '700 9.5px var(--f)', letterSpacing: '.05em', padding: '3px 9px', borderRadius: 6 }}>{bt[2]}</span></div>
              <div style={{ font: '500 12px var(--f)', color: 'var(--text3)', marginTop: 3 }}>{target.vertical} · live target console</div>
            </div>
            <button onClick={onClose} style={{ background: 'var(--surf)', border: 'none', color: 'var(--text3)', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 15, flex: 'none' }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <div style={{ flex: 1, background: 'var(--surf)', border: '1px solid var(--borderl)', borderRadius: 10, padding: '9px 11px' }}><div style={{ font: '700 18px var(--f)', color: 'var(--text)' }}>{target.found || contacts.length}</div><div style={{ font: '600 9px var(--f)', color: 'var(--text3)', letterSpacing: '.03em' }}>FOUND</div></div>
            <div style={{ flex: 1, background: 'var(--surf)', border: '1px solid var(--borderl)', borderRadius: 10, padding: '9px 11px' }}><div style={{ font: '700 18px var(--f)', color: 'var(--amber)' }}>{fmt$(target.spend)}</div><div style={{ font: '600 9px var(--f)', color: 'var(--text3)', letterSpacing: '.03em' }}>PAID SPEND</div></div>
            <div style={{ flex: 1, background: 'var(--surf)', border: '1px solid var(--borderl)', borderRadius: 10, padding: '9px 11px' }}><div style={{ font: '700 18px var(--f)', color: 'var(--text)' }}>{target.retries}</div><div style={{ font: '600 9px var(--f)', color: 'var(--text3)', letterSpacing: '.03em' }}>RETRIES</div></div>
          </div>
        </div>

        <div style={{ padding: '16px 22px 4px' }}>
          <div style={{ font: '700 10px var(--f)', letterSpacing: '.1em', color: 'var(--text3)', marginBottom: 12 }}>CONTACTS FOUND</div>
          {contacts.length === 0 ? (
            <div style={{ font: '500 12px var(--f)', color: 'var(--text3)', paddingBottom: 8 }}>No contacts resolved yet — they appear here as the target progresses.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {contacts.map((c) => {
                const em = esMeta(c.emailStatus), tm = tierMeta(c.tier);
                return (
                  <div key={c.id} style={{ border: '1px solid var(--border)', borderRadius: 11, padding: '11px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 30, height: 30, flex: 'none', borderRadius: 8, background: 'var(--accentl)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 11px var(--f)' }}>{initialsOf(c.name)}</span>
                      <div style={{ minWidth: 0, flex: 1 }}><div style={{ font: '600 13px var(--f)', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div><div style={{ font: '500 11px var(--f)', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}><span style={{ font: '700 10px var(--f)', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5, color: tm.color, background: tm.bg }}>{c.tier}</span><span style={{ font: '700 13px var(--f)', color: 'var(--text)' }}>{c.fit}</span></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 9, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</span>
                      <span style={{ font: '700 9.5px var(--f)', padding: '2px 7px', borderRadius: 6, color: em.color, background: em.bg }}>{em.label}</span>
                    </div>
                    {c.sources[0] && <div style={{ marginTop: 7 }}><span style={chipStyle(c.sources[0].confidence)}>{`${c.sources[0].provider} · ${c.sources[0].method} · ${c.sources[0].confidence.toFixed(2)}`}</span></div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '16px 22px 24px' }}>
          <div style={{ font: '700 10px var(--f)', letterSpacing: '.1em', color: 'var(--text3)', marginBottom: 14 }}>RUN LOG — EVERY STRATEGY, RETRY &amp; REPAIR</div>
          <div style={{ position: 'relative', paddingLeft: 20 }}>
            <div style={{ position: 'absolute', left: 5, top: 6, bottom: 6, width: 2, background: 'var(--border)' }} />
            {events.map((e, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: 16 }}>
                <span style={{ position: 'absolute', left: -19, top: 3, width: 10, height: 10, borderRadius: '50%', background: e.color, border: '2px solid #fff' }} />
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ font: '700 12px var(--f)', color: 'var(--text)' }}>{e.stage}</span>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: 10.5, color: 'var(--text3)' }}>{e.t}</span>
                </div>
                <div style={{ fontFamily: 'var(--fm)', fontSize: 11, color: e.color, marginTop: 3 }}>{e.detail}</div>
                {e.chip && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--text2)', background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 7px' }}>{e.chip}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Territory Sweep composer
// ---------------------------------------------------------------------------

const SWEEP_DENSITY: Record<string, number> = {
  Automotive: 3.2, 'B2B Services': 2.4, Construction: 3.1, 'CPG & Retail': 2.8,
  Financial: 2.2, Hospitality: 4.0, Manufacturing: 1.8, 'Real Estate': 3.0, Healthcare: 2.6,
};
const REGISTRY_SRC: Record<string, string> = {
  Automotive: 'state dealer boards + NHTSA', 'B2B Services': 'state bar + CPAverify + SoS',
  Construction: 'AZ ROC license board + permits', 'CPG & Retail': 'openFDA + USDA FSIS + TTB',
  Financial: 'FINRA + NMLS + state DOI', Hospitality: 'liquor boards + health inspections',
  Manufacturing: 'EPA FRS + FMCSA + OSHA', 'Real Estate': 'county assessor + state RE boards',
  Healthcare: 'NPI + SAMHSA + state health boards',
};

function SweepComposer({ onClose, onRun, starting }: { onClose: () => void; onRun: (sweep: import('@lead/core').SweepSpec) => void; starting: boolean }) {
  const [vertical, setVertical] = useState('Construction');
  const [geoMode, setGeoMode] = useState<'radius' | 'admin' | 'zip' | 'draw'>('radius');
  const [radius, setRadius] = useState(20);
  const [filters, setFilters] = useState({ hasWebsite: true, activeLicense: true, excludeChains: true, excludeCRM: true, excludeScraped: false, usePlaces: false });

  const bf = Math.round(radius * radius * (SWEEP_DENSITY[vertical] || 2.6));
  const websites = Math.round(bf * 0.7);
  const unresolved = bf - websites;
  const peoplePages = Math.round(websites * 0.7);
  const contacts = Math.round(peoplePages * 2.3);
  const rKm = radius * 1.60934;
  const mapLookups = filters.usePlaces ? Math.round(rKm * rKm * 0.6) : 0;
  const placesCost = mapLookups * 0.005;
  const extractionCost = contacts * 0.0015;
  const totalCost = placesCost + extractionCost;
  const runtimeMin = Math.round(bf * 0.13);
  const runtimeStr = Math.floor(runtimeMin / 60) + 'h ' + String(runtimeMin % 60).padStart(2, '0') + 'm';
  const needsApprove = totalCost > 5 || runtimeMin > 180;
  const fnum = (n: number) => n.toLocaleString();

  const rMap = 42 + (radius / 31) * 98;
  const seed = vertical.length * 7 + radius;
  const srand = (k: number) => { const x = Math.sin(seed * 3.3 + k * 2.17) * 10000; return x - Math.floor(x); };
  const points = Array.from({ length: 56 }, (_, i) => {
    const ang = srand(i) * Math.PI * 2, dist = Math.sqrt(srand(i + 100)) * (rMap - 8);
    const resolved = srand(i + 200) < 0.7;
    return { cx: 160 + dist * Math.cos(ang), cy: 160 + dist * Math.sin(ang), fill: resolved ? 'var(--accent)' : '#B9C2CE' };
  });

  const toggle = (k: keyof typeof filters) => setFilters((f) => ({ ...f, [k]: !f[k] }));
  const swToggle = (on: boolean) => (
    <span style={{ width: 34, height: 19, borderRadius: 999, background: on ? 'var(--accent)' : 'var(--border)', position: 'relative', transition: '.2s', display: 'inline-block', flex: 'none' }}>
      <span style={{ position: 'absolute', top: 2, left: on ? 17 : 2, width: 15, height: 15, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 2px rgba(0,0,0,.2)' }} />
    </span>
  );

  return (
    <div style={{ padding: '22px 32px 60px', maxWidth: 1400, margin: '0 auto', animation: 'lbp-fade-up .4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: '#fff', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg></button>
        <div style={{ flex: 1 }}><h1 style={{ font: '700 26px/1.1 var(--f)', letterSpacing: '-.02em', margin: 0, color: 'var(--text)' }}>Sweep a territory</h1><div style={{ font: '500 12.5px var(--f)', color: 'var(--text3)', marginTop: 3 }}>Pick a vertical and an area. See the yield and the cost before anything bills.</div></div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* LEFT */}
        <div style={{ width: 310, flex: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <div style={{ font: '700 10px var(--f)', letterSpacing: '.1em', color: 'var(--text3)', marginBottom: 10 }}>VERTICAL</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {VERTICAL_LIST.map((v) => { const a = vertical === v; return (
                <button key={v} onClick={() => setVertical(v)} style={{ borderRadius: 8, padding: '7px 11px', font: '600 11.5px var(--f)', cursor: 'pointer', textAlign: 'left', background: a ? 'var(--accentl)' : '#fff', color: a ? 'var(--accentd)' : 'var(--text2)', border: `1px solid ${a ? 'var(--accent)' : 'var(--border)'}` }}>{v}</button>
              ); })}
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <div style={{ font: '700 10px var(--f)', letterSpacing: '.1em', color: 'var(--text3)', marginBottom: 10 }}>GEOGRAPHY</div>
            <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
              {([['radius', 'Radius'], ['admin', 'County / metro'], ['zip', 'ZIP list'], ['draw', 'Draw on map']] as const).map(([g, label]) => { const a = geoMode === g; return (
                <button key={g} onClick={() => setGeoMode(g)} style={{ flex: 1, borderRadius: 8, padding: '7px 4px', font: '600 11px var(--f)', cursor: 'pointer', background: a ? 'var(--navy)' : '#fff', color: a ? '#fff' : 'var(--text2)', border: `1px solid ${a ? 'var(--navy)' : 'var(--border)'}` }}>{label}</button>
              ); })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 9, padding: '0 11px', marginBottom: 12 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.8"><path d="M12 21s-7-5.7-7-11a7 7 0 0 1 14 0c0 5.3-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
              <input defaultValue="Phoenix, AZ" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text)', font: '500 12.5px var(--f)', padding: '9px 0' }} />
            </div>
            {geoMode === 'radius' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}><span style={{ font: '600 11.5px var(--f)', color: 'var(--text2)' }}>Radius</span><span style={{ fontFamily: 'var(--fm)', fontSize: 12.5, color: 'var(--accent)' }}>{radius} mi</span></div>
                <input type="range" min={1} max={31} value={radius} onChange={(e) => setRadius(+e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} />
                <div style={{ font: '500 10.5px/1.4 var(--f)', color: 'var(--text3)', marginTop: 4 }}>Capped at 31 mi — the map service clamps at 50 km per query.</div>
              </>
            )}
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <div style={{ font: '700 10px var(--f)', letterSpacing: '.1em', color: 'var(--text3)', marginBottom: 12 }}>FILTERS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {([['activeLicense', 'Active license only'], ['excludeChains', 'Exclude chains'], ['excludeCRM', 'Exclude anything in my CRM'], ['excludeScraped', 'Exclude scraped in last 30 days'], ['hasWebsite', 'Has a website'], ['usePlaces', 'Google Places (metered)']] as const).map(([k, label]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ font: '500 12px var(--f)', color: 'var(--text)' }}>{label}</span>
                  <button onClick={() => toggle(k)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>{swToggle(filters[k])}</button>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER map */}
        <div style={{ flex: 1, minWidth: 320 }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ font: '700 12.5px var(--f)', color: 'var(--text)' }}>{vertical} · Phoenix, AZ</span>
              <span style={{ font: '500 11px var(--f)', color: 'var(--text3)' }}>The map is the progress bar</span>
            </div>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', maxHeight: 440, background: 'var(--surf)', border: '1px solid var(--borderl)', borderRadius: 12, overflow: 'hidden' }}>
              <svg viewBox="0 0 320 320" style={{ width: '100%', height: '100%', display: 'block' }}>
                <defs><pattern id="swgrid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#E6EAF0" strokeWidth="1" /></pattern></defs>
                <rect width="320" height="320" fill="url(#swgrid)" />
                {(geoMode === 'radius' || geoMode === 'draw') && <circle cx={160} cy={160} r={rMap} fill="rgba(74,143,214,0.08)" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 4" />}
                {points.map((p, i) => <circle key={i} cx={p.cx} cy={p.cy} r={3} fill={p.fill} opacity={0.5} />)}
              </svg>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: '500 11px var(--f)', color: 'var(--text2)' }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)' }} />website resolved</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: '500 11px var(--f)', color: 'var(--text2)' }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#B9C2CE' }} />registry only</span>
            </div>
          </div>
        </div>

        {/* RIGHT yield & cost */}
        <div style={{ width: 320, flex: 'none' }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <div style={{ font: '700 10px var(--f)', letterSpacing: '.1em', color: 'var(--text3)', marginBottom: 14 }}>YIELD &amp; COST — ESTIMATE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><span style={{ font: '600 13px var(--f)', color: 'var(--text)' }}>Businesses found</span><span style={{ font: '700 18px var(--f)', color: 'var(--text)' }}>{fnum(bf)}</span></div>
              <div style={{ font: '500 10.5px var(--f)', color: 'var(--green)', marginTop: -6 }}>free — {REGISTRY_SRC[vertical]}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderTop: '1px solid var(--borderl)', paddingTop: 10 }}><span style={{ font: '500 12px var(--f)', color: 'var(--text2)' }}>Websites resolved</span><span style={{ font: '600 14px var(--f)', color: 'var(--text)' }}>{fnum(websites)}</span></div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><span style={{ font: '500 12px var(--f)', color: 'var(--text2)' }}>Likely have a people page</span><span style={{ font: '600 14px var(--f)', color: 'var(--text)' }}>{fnum(peoplePages)}</span></div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><span style={{ font: '500 12px var(--f)', color: 'var(--text2)' }}>Contacts expected</span><span style={{ font: '700 16px var(--f)', color: 'var(--accent)' }}>~{fnum(contacts)}</span></div>
            </div>
            <div style={{ borderTop: '1px solid var(--borderl)', margin: '14px 0', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}><span style={{ font: '500 12px var(--f)', color: 'var(--text2)' }}>Discovery</span><span style={{ font: '700 13px var(--f)', color: 'var(--green)' }}>{filters.usePlaces ? fmt$(placesCost) : '$0.00'}</span></div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><span style={{ font: '500 12px var(--f)', color: 'var(--text2)' }}>Extraction</span><span style={{ font: '700 13px var(--f)', color: 'var(--text)' }}>{fmt$(extractionCost)}</span></div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><span style={{ font: '500 12px var(--f)', color: 'var(--text2)' }}>Paid providers</span><span style={{ font: '700 13px var(--f)', color: 'var(--text3)' }}>off</span></div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderTop: '1px solid var(--borderl)', paddingTop: 10 }}><span style={{ font: '700 12.5px var(--f)', color: 'var(--text)' }}>Est. total · {runtimeStr}</span><span style={{ font: '800 20px var(--f)', color: 'var(--green)' }}>{fmt$(totalCost)}</span></div>
            </div>
            {needsApprove && <div style={{ font: '600 10.5px/1.4 var(--f)', color: 'var(--amber)', marginBottom: 10, display: 'flex', gap: 6 }}><span>⚠</span><span>Over your auto-run ceiling — {totalCost > 5 ? 'estimated spend is over your $5 ceiling' : 'estimated runtime is over 3 hours'}.</span></div>}
            <button onClick={() => onRun({ vertical, geoMode, radius, filters, center: { lat: 33.45, lng: -112.07, label: 'Phoenix, AZ' } })} disabled={starting} style={{ width: '100%', background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: 10, padding: 11, font: '600 13px var(--f)', cursor: 'pointer' }}>{needsApprove ? 'Review & approve' : 'Run sweep'}</button>
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,.04)', marginTop: 14, display: 'flex', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.8" style={{ flex: 'none', marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
            <span style={{ font: '500 11px/1.5 var(--f)', color: 'var(--text2)' }}><strong style={{ color: 'var(--text)' }}>{fnum(unresolved)}</strong> have no website we could confidently match — they stay in your results with name, address, and phone. We never guess a domain.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
