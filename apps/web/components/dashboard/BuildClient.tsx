'use client';

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import type { RunProfileId } from '@lead/core';

/**
 * Build screen — the pipeline editor. Ported from the approved prototype's
 * `isBuild` block (markup) and its `prov()` / `buildStages` view-model. Owns
 * the free-first toggle, the paid-escalation threshold slider and the profile
 * presets, each of which persists to `PATCH /api/org` and then refreshes the
 * server component so the next render reflects the saved value.
 */

type KeyStatus = Record<string, 'valid' | 'invalid' | 'off'>;

type ProvKind = 'free' | 'ai' | 'paid' | 'gov' | 'builtin';

interface Props {
  freeFirst: boolean;
  /** 40..95 integer. */
  threshold: number;
  paidEnabled: boolean;
  defaultProfile: RunProfileId;
  keyStatus: KeyStatus;
}

interface Chip {
  name: string;
  kind: ProvKind;
  cost: string;
  isPaid: boolean;
  keyed: boolean;
  enabled: boolean;
  needsKey: boolean;
  style: CSSProperties;
  costStyle: CSSProperties;
}

// The 8 pipeline stages, each with its provider slots: [name, kind, cost?].
const STAGES: { label: string; prov: [string, ProvKind, string?][] }[] = [
  {
    label: 'Discovery',
    prov: [
      ['Google Places', 'free'],
      ['Registries', 'free'],
      ['SAM.gov', 'gov'],
      ['Apollo Org Search', 'paid', '$0.03'],
    ],
  },
  {
    label: 'Scrape',
    prov: [
      ['Playwright', 'builtin'],
      ['Bright Data', 'paid', '$0.04'],
      ['Apify', 'paid', '$0.05'],
    ],
  },
  { label: 'Extract', prov: [['Claude Haiku', 'ai']] },
  {
    label: 'Enrich',
    prov: [
      ['NPI / License / SoS', 'free'],
      ['Hunter', 'paid', '$0.04'],
      ['Apollo', 'paid', '$0.03'],
      ['PDL', 'paid', '$0.08'],
      ['Clay', 'paid', '$0.09'],
    ],
  },
  {
    label: 'Verify',
    prov: [
      ['MX / SMTP', 'builtin'],
      ['NeverBounce', 'paid', '$0.008'],
    ],
  },
  { label: 'Score', prov: [['Claude Sonnet', 'ai']] },
  { label: 'Outreach', prov: [['Claude Sonnet', 'ai']] },
  {
    label: 'Deliver',
    prov: [
      ['Pipedrive', 'free'],
      ['HubSpot', 'free'],
      ['Instantly', 'free'],
      ['CSV / Webhook', 'builtin'],
    ],
  },
];

const PRESETS: [RunProfileId, string][] = [
  ['scraper', 'Scraper Only'],
  ['free-max', 'Free Max'],
  ['hunter-apollo', 'Hunter + Apollo'],
  ['full-stack', 'Full Stack'],
];

/** Chip builder — ports `prov(name,kind,cost)` from the prototype. */
function buildChip(name: string, kind: ProvKind, cost: string | undefined, keyStatus: KeyStatus): Chip {
  const keyed = kind === 'free' || kind === 'ai' ? true : keyStatus[name] === 'valid';
  const enabled = kind === 'builtin' || keyed;
  const isPaid = kind === 'paid';
  const border = enabled
    ? kind === 'paid'
      ? '#EEC981'
      : kind === 'ai'
        ? '#CDB9FB'
        : 'var(--border)'
    : 'var(--border)';
  const bg = enabled
    ? kind === 'paid'
      ? 'var(--amberl)'
      : kind === 'ai'
        ? 'var(--purplel)'
        : '#fff'
    : 'var(--surf)';
  const color = enabled
    ? kind === 'paid'
      ? 'var(--amber)'
      : kind === 'ai'
        ? 'var(--purple)'
        : 'var(--text2)'
    : 'var(--text3)';
  return {
    name,
    kind,
    cost: cost || '',
    isPaid,
    keyed,
    enabled,
    needsKey: kind === 'paid' && !keyed,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      borderRadius: 8,
      padding: '6px 10px',
      font: '600 11.5px var(--f)',
      border: `1px solid ${border}`,
      background: bg,
      color,
      opacity: enabled ? 1 : 0.7,
    },
    costStyle: { fontFamily: 'var(--fm)', fontSize: 9.5, opacity: 0.85 },
  };
}

const card: CSSProperties = {
  background: '#fff',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,.04)',
};

export function BuildClient({ freeFirst: freeFirst0, threshold: threshold0, paidEnabled, defaultProfile, keyStatus }: Props) {
  const router = useRouter();
  const [freeFirst, setFreeFirst] = useState(freeFirst0);
  const [threshold, setThreshold] = useState(threshold0);
  const [profile, setProfile] = useState<RunProfileId>(defaultProfile);

  async function patchOrg(body: Record<string, unknown>) {
    try {
      const res = await fetch('/api/org', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) router.refresh();
    } catch {
      /* keep local state; a failed save is non-fatal here */
    }
  }

  function toggleFreeFirst() {
    const next = !freeFirst;
    setFreeFirst(next);
    void patchOrg({ freeFirst: next });
  }

  function commitThreshold() {
    void patchOrg({ threshold });
  }

  function selectProfile(id: RunProfileId) {
    setProfile(id);
    void patchOrg({ defaultProfile: id });
  }

  const stages = STAGES.map((st) => ({
    label: st.label,
    chips: st.prov.map(([name, kind, cost]) => buildChip(name, kind, cost, keyStatus)),
  }));

  // Cost-per-100-targets preview — ports the prototype's `costPaid100`.
  const enrichPaid = stages.find((s) => s.label === 'Enrich')?.chips.filter((c) => c.isPaid) ?? [];
  const paidActive = paidEnabled ? enrichPaid.filter((c) => c.enabled) : [];
  const stopFactor = 1 - (threshold - 40) / 110; // higher threshold → more paid calls fire
  const paidPer100 = paidActive.reduce((a, c) => {
    const n = parseFloat((c.cost || '0').replace(/[^0-9.]/g, '')) || 0;
    return a + n * 100 * Math.max(0.15, stopFactor);
  }, 0);
  const costFree100 = '$0.00';
  const costPaid100 = '$' + paidPer100.toFixed(2);

  const thresholdVal = (threshold / 100).toFixed(2);

  return (
    <div style={{ padding: '30px 32px 60px', maxWidth: 1160, margin: '0 auto', animation: 'lbp-up .5s ease' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 22,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ font: '700 30px/1.2 var(--f)', letterSpacing: '-.02em', margin: 0, color: 'var(--text)' }}>Build</h1>
          <div style={{ marginTop: 4, font: '500 13px var(--f)', color: 'var(--text3)' }}>
            Compose your run profile — fill each stage with the providers you&rsquo;ve enabled.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
              background: '#fff',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              borderRadius: 9,
              padding: '8px 13px',
              font: '600 12.5px var(--f)',
              cursor: 'pointer',
            }}
          >
            Scraper Only
          </button>
          <button
            style={{
              background: 'var(--accent)',
              border: 'none',
              color: '#fff',
              borderRadius: 9,
              padding: '8px 13px',
              font: '600 12.5px var(--f)',
              cursor: 'pointer',
            }}
          >
            Save profile
          </button>
        </div>
      </div>

      {/* Profile presets */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        {PRESETS.map(([id, label]) => {
          const active = profile === id;
          return (
            <button
              key={id}
              onClick={() => selectProfile(id)}
              style={{
                borderRadius: 999,
                padding: '7px 14px',
                font: '600 12px var(--f)',
                cursor: 'pointer',
                transition: '.15s',
                background: active ? 'var(--accent)' : '#fff',
                color: active ? '#fff' : 'var(--text2)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ ...card, flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ font: '700 12.5px var(--f)', color: 'var(--text)' }}>Free-first</div>
              <div style={{ font: '500 11px var(--f)', color: 'var(--text3)', marginTop: 2 }}>
                Exhaust free sources before any paid call
              </div>
            </div>
            <button
              onClick={toggleFreeFirst}
              aria-pressed={freeFirst}
              style={{
                width: 36,
                height: 20,
                borderRadius: 999,
                background: freeFirst ? 'var(--green)' : 'var(--border)',
                position: 'relative',
                transition: '.2s',
                display: 'inline-block',
                cursor: 'pointer',
                border: 'none',
                padding: 0,
                flex: 'none',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: freeFirst ? 18 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left .2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,.2)',
                }}
              />
            </button>
          </div>
        </div>

        <div style={{ ...card, flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ font: '700 12.5px var(--f)', color: 'var(--text)' }}>Paid escalation threshold</div>
            <span style={{ fontFamily: 'var(--fm)', fontSize: 13, color: 'var(--accent)' }}>{thresholdVal}</span>
          </div>
          <input
            type="range"
            min={40}
            max={95}
            value={threshold}
            onChange={(e) => setThreshold(+e.target.value)}
            onMouseUp={commitThreshold}
            onTouchEnd={commitThreshold}
            onKeyUp={commitThreshold}
            onBlur={commitThreshold}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
          />
          <div style={{ font: '500 11px var(--f)', color: 'var(--text3)', marginTop: 4 }}>
            Paid providers fire only when confidence falls below this.
          </div>
        </div>

        <div style={{ ...card, flex: 1, minWidth: 200 }}>
          <div style={{ font: '700 12.5px var(--f)', color: 'var(--text)' }}>ICP tier cutoffs</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {([['90', 'TIER A', 'var(--green)'], ['75', 'TIER B', 'var(--accent)'], ['60', 'TIER C', 'var(--text2)']] as const).map(
              ([n, tier, color]) => (
                <div
                  key={tier}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    background: 'var(--surf)',
                    border: '1px solid var(--borderl)',
                    borderRadius: 8,
                    padding: '8px 0',
                  }}
                >
                  <div style={{ font: '700 15px var(--f)', color }}>{n}</div>
                  <div style={{ font: '600 9px var(--f)', color: 'var(--text3)' }}>{tier}</div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ font: '700 10px var(--f)', letterSpacing: '.1em', color: 'var(--text3)' }}>
          PIPELINE — DRAG PROVIDERS TO SET WATERFALL ORDER
        </div>
        <div style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--text3)' }}>
          est. / 100 targets · free{' '}
          <span style={{ color: 'var(--green)' }}>{costFree100}</span> · paid{' '}
          <span style={{ color: 'var(--amber)' }}>{costPaid100}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {stages.map((st) => (
          <div
            key={st.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '14px 16px',
              boxShadow: '0 1px 3px rgba(0,0,0,.04)',
            }}
          >
            <div style={{ width: 96, flex: 'none', display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
              <span style={{ font: '700 13px var(--f)', color: 'var(--text)' }}>{st.label}</span>
            </div>
            <div style={{ width: 1, height: 28, background: 'var(--borderl)', flex: 'none' }} />
            <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {st.chips.map((p) => (
                <div key={p.name} style={p.style}>
                  {p.name}
                  {p.isPaid && <span style={p.costStyle}>{p.cost}</span>}
                  {p.needsKey && (
                    <span
                      style={{
                        font: '700 9px var(--f)',
                        color: 'var(--accent)',
                        borderLeft: '1px solid currentColor',
                        paddingLeft: 6,
                        marginLeft: 2,
                      }}
                    >
                      Add key
                    </span>
                  )}
                </div>
              ))}
              <button
                style={{
                  background: 'transparent',
                  border: '1px dashed var(--border)',
                  color: 'var(--text3)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  font: '600 11.5px var(--f)',
                  cursor: 'pointer',
                }}
              >
                + Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
