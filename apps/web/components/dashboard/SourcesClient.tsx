'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import {
  PROVIDER_CATALOG,
  AI_PROVIDERS,
  VERTICALS,
  type ProviderDef,
  type SourceKey,
} from '@lead/core';

/**
 * Sources — the parts catalog for the machine. Ported from the approved
 * prototype (renderVals mkCard / catGroups). Free + builtin providers are
 * always connected; gov/paid connect only when their key validates. Paid cards
 * dim out under the paid master switch. Keys are write-only: we send them to the
 * API and only ever read back status + last4.
 */

interface SourcesClientProps {
  /** Configured source keys, keyed by provider name. */
  sourceKeys: Record<string, SourceKey>;
  paidEnabled: boolean;
  hasOrg: boolean;
}

type ActionKind = 'none' | 'fix' | 'manage' | 'connect';

// Shades with no CSS-token equivalent (borders / deep text accents).
const RED_BORDER = '#F0C2C2';
const PURPLE_BORDER = '#CDB9FB';
const AMBER_BORDER = '#F5E2B8';

export function SourcesClient({ sourceKeys, paidEnabled, hasOrg }: SourcesClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [vFilter, setVFilter] = useState('all');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [keyDraft, setKeyDraft] = useState('');
  const [budgetDraft, setBudgetDraft] = useState('');
  const [paidMaster, setPaidMaster] = useState(paidEnabled);
  const [busy, setBusy] = useState(false);

  // ---- filters ----------------------------------------------------------
  const sq = search.trim().toLowerCase();
  const matchesV = (it: ProviderDef) =>
    vFilter === 'all' ||
    it.verticals === 'all' ||
    (Array.isArray(it.verticals) && it.verticals.includes(vFilter));
  const matchesS = (it: ProviderDef) =>
    !sq || it.name.toLowerCase().includes(sq) || it.tag.toLowerCase().includes(sq);

  // ---- mutations --------------------------------------------------------
  async function postSource(body: Record<string, unknown>) {
    if (!hasOrg || busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `request failed (${res.status})` }));
        window.alert(`Source not saved: ${data.error ?? res.status}`);
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function togglePaidMaster() {
    const next = !paidMaster;
    setPaidMaster(next);
    if (!hasOrg) return;
    await fetch('/api/org', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paidEnabled: next }),
    });
    router.refresh();
  }

  function openPanel(it: ProviderDef) {
    const ks = sourceKeys[it.name];
    setExpandedKey(it.name);
    setKeyDraft('');
    setBudgetDraft(ks?.budgetCap != null ? String(ks.budgetCap) : '');
  }
  function closePanel() {
    setExpandedKey(null);
    setKeyDraft('');
    setBudgetDraft('');
  }
  function saveDraft(it: ProviderDef) {
    const cap = parseInt(budgetDraft, 10);
    void postSource({
      provider: it.name,
      key: keyDraft.trim() || undefined,
      budgetCap: it.kind === 'paid' && Number.isFinite(cap) && cap > 0 ? cap : undefined,
      enabled: true,
    });
    closePanel();
  }
  function disconnect(it: ProviderDef) {
    void postSource({ provider: it.name, action: 'disconnect' });
    closePanel();
  }

  // ---- summary counts (across the full catalog) -------------------------
  const allItems: ProviderDef[] = [
    ...AI_PROVIDERS.items,
    ...PROVIDER_CATALOG.flatMap((g) => g.items),
  ];
  const connectedCount = allItems.filter((it) => {
    if (it.kind === 'free' || it.kind === 'builtin') return true;
    return sourceKeys[it.name]?.status === 'valid';
  }).length;
  const freeCount = allItems.filter(
    (it) => it.kind === 'free' || it.kind === 'builtin' || it.kind === 'gov'
  ).length;
  const paidCatalogCount = allItems.filter(
    (it) => it.kind === 'paid' || it.kind === 'ai'
  ).length;
  const monthlyPaid = Object.values(sourceKeys).reduce((a, k) => a + (k.budgetUsed || 0), 0);

  // ---- visible groups ---------------------------------------------------
  const catGroups = PROVIDER_CATALOG.map((g) => {
    if (catFilter !== 'all' && g.cat !== catFilter) return null;
    const items = g.items.filter(matchesV).filter(matchesS);
    if (!items.length) return null;
    return { cat: g.cat, items };
  }).filter((g): g is { cat: string; items: ProviderDef[] } => g !== null);

  const aiItems = AI_PROVIDERS.items.filter(matchesS);
  const aiConnected = AI_PROVIDERS.items.some(
    (a) => sourceKeys[a.name]?.status === 'valid'
  );
  const showAi = (catFilter === 'all' || catFilter === 'AI') && aiItems.length > 0;

  let paidCount = 0;
  catGroups.forEach((g) =>
    g.items.forEach((i) => {
      if (i.kind === 'paid' || i.kind === 'ai') paidCount += 1;
    })
  );
  const paidReadout = paidMaster
    ? `${paidCount} paid providers armed in this view · they fire only below the confidence threshold`
    : 'Paid off — free scraping, registries, and MX/SMTP verification still run at zero cost';

  const catChips: { key: string; label: string }[] = [
    { key: 'all', label: 'All' },
    ...PROVIDER_CATALOG.map((g) => ({ key: g.cat, label: g.cat })),
  ];
  const verticalChips: { key: string; label: string }[] = [
    { key: 'all', label: 'All verticals' },
    ...VERTICALS.map((v) => ({ key: v, label: v })),
  ];

  // ---- card renderer ----------------------------------------------------
  const renderCard = (it: ProviderDef, isAi: boolean) => {
    const ks = sourceKeys[it.name];
    const isFree = it.kind === 'free' || it.kind === 'builtin';
    const isGov = it.kind === 'gov';
    const costsMoney = it.kind === 'paid' || it.kind === 'ai';
    const valid = ks?.status === 'valid';
    const invalid = ks?.status === 'invalid';
    const connected = isFree ? true : !!valid;
    const dimmed = costsMoney && !paidMaster;
    const expanded = expandedKey === it.name;

    let badgeText: string;
    let badgeColor: string;
    let badgeBg: string;
    if (costsMoney) {
      badgeText = it.kind === 'ai' ? 'AI · paid' : 'Paid';
      badgeColor = 'var(--amber)';
      badgeBg = 'var(--amberl)';
    } else {
      badgeText = isGov ? 'Free · key' : 'Free';
      badgeColor = 'var(--green)';
      badgeBg = 'var(--greenl)';
    }

    let statusText: string;
    let statusColor: string;
    if (isFree) {
      statusText = 'On · free';
      statusColor = 'var(--green)';
    } else if (invalid) {
      statusText = 'Key invalid';
      statusColor = 'var(--red)';
    } else if (connected) {
      statusText = 'Connected · ••' + (ks?.last4 ?? '—');
      statusColor = 'var(--green)';
    } else {
      statusText = isGov ? 'Free key needed' : 'Not connected';
      statusColor = 'var(--text3)';
    }

    let actionLabel = '';
    let actionKind: ActionKind = 'none';
    if (isFree) actionKind = 'none';
    else if (invalid) {
      actionLabel = 'Re-enter key';
      actionKind = 'fix';
    } else if (connected) {
      actionLabel = 'Manage';
      actionKind = 'manage';
    } else {
      actionLabel = isGov ? 'Add free key' : 'Connect';
      actionKind = 'connect';
    }
    const hasAction = actionKind !== 'none';

    const cap = ks?.budgetCap ?? null;
    const used = ks?.budgetUsed ?? 0;
    const hasBudget = cap != null && connected && !dimmed;
    const budgetPct = hasBudget && cap ? Math.min(100, (used / cap) * 100) : 0;
    const budgetOver = hasBudget && cap ? used / cap >= 0.9 : false;

    const actionStyle: CSSProperties = {
      background: actionKind === 'connect' ? 'var(--accent)' : '#fff',
      border: `1px solid ${
        actionKind === 'fix'
          ? RED_BORDER
          : actionKind === 'manage'
            ? 'var(--border)'
            : 'var(--accent)'
      }`,
      color:
        actionKind === 'fix'
          ? 'var(--red)'
          : actionKind === 'manage'
            ? 'var(--text2)'
            : '#fff',
      borderRadius: 8,
      padding: '6px 12px',
      font: '600 11.5px var(--f)',
      cursor: 'pointer',
    };

    const cardStyle: CSSProperties = {
      background: '#fff',
      border: `1px solid ${invalid ? RED_BORDER : 'var(--border)'}`,
      borderRadius: 12,
      padding: 15,
      boxShadow: '0 1px 3px rgba(0,0,0,.04)',
      transition: 'opacity .2s',
      ...(dimmed ? { opacity: 0.45, pointerEvents: 'none' as const } : {}),
    };

    return (
      <div key={it.name} style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ font: '700 13.5px var(--f)', color: 'var(--text)' }}>{it.name}</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              font: '700 10px var(--f)',
              padding: '3px 9px',
              borderRadius: 6,
              color: badgeColor,
              background: badgeBg,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: badgeColor }} />
            {badgeText}
          </span>
        </div>

        <div style={{ font: '500 11.5px/1.5 var(--f)', color: 'var(--text2)', marginTop: 6 }}>
          {it.tag}
        </div>

        {(!isAi && (!!it.cost || !!it.jurisdiction)) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginTop: 9 }}>
            {costsMoney && !!it.cost && (
              <span
                style={{
                  fontFamily: 'var(--fm)',
                  fontSize: 10.5,
                  color: 'var(--amber)',
                  background: 'var(--amberl)',
                  border: `1px solid ${AMBER_BORDER}`,
                  borderRadius: 5,
                  padding: '2px 7px',
                }}
              >
                {it.cost}
              </span>
            )}
            {!!it.jurisdiction && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontFamily: 'var(--fm)',
                  fontSize: 10,
                  color: 'var(--text2)',
                  background: 'var(--surf)',
                  border: '1px solid var(--border)',
                  borderRadius: 5,
                  padding: '2px 7px',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 21s-7-5.7-7-11a7 7 0 0 1 14 0c0 5.3-7 11-7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                {it.jurisdiction}
              </span>
            )}
          </div>
        )}

        {!isAi && !!it.rateNote && (
          <div style={{ font: '500 10.5px/1.45 var(--f)', color: 'var(--amber)', marginTop: 8, display: 'flex', gap: 5 }}>
            <span>⚠</span>
            <span>{it.rateNote}</span>
          </div>
        )}

        {invalid && (
          <div style={{ font: '500 10.5px/1.45 var(--f)', color: 'var(--red)', marginTop: 8, display: 'flex', gap: 5 }}>
            <span>⚠</span>
            <span>This {it.name} key didn’t validate. Re-enter it, or turn it off for now.</span>
          </div>
        )}

        {hasBudget && cap != null && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ font: '600 10px var(--f)', color: 'var(--text3)', letterSpacing: '.04em' }}>BUDGET CAP</span>
              <span style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--text2)' }}>
                ${used.toFixed(2)} / ${cap} this month
              </span>
            </div>
            <div style={{ height: 5, background: 'var(--surf)', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${budgetPct}%`,
                  height: '100%',
                  borderRadius: 3,
                  background: budgetOver ? 'var(--red)' : 'var(--amber)',
                }}
              />
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--borderl)',
          }}
        >
          <span style={{ font: '600 11px var(--f)', color: statusColor }}>{statusText}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!isAi && it.getKey && (
              <a href="#" style={{ font: '600 11px var(--f)', color: 'var(--accent)', textDecoration: 'none' }}>
                Get a free key →
              </a>
            )}
            {hasAction && (
              <button
                type="button"
                onClick={() => (expanded ? closePanel() : openPanel(it))}
                style={actionStyle}
              >
                {actionLabel}
              </button>
            )}
          </div>
        </div>

        {expanded && (
          <div style={{ marginTop: 12, padding: 12, background: 'var(--surf)', border: '1px solid var(--borderl)', borderRadius: 10 }}>
            <div style={{ font: '600 10px var(--f)', letterSpacing: '.05em', color: 'var(--text3)', marginBottom: 6 }}>
              API KEY
            </div>
            <input
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder={isAi ? 'sk-…' : 'Paste your key…'}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 10px',
                fontFamily: 'var(--fm)',
                fontSize: 12,
                color: 'var(--text)',
                outline: 'none',
                background: '#fff',
              }}
            />
            {it.kind === 'paid' && (
              <>
                <div style={{ font: '600 10px var(--f)', letterSpacing: '.05em', color: 'var(--text3)', margin: '10px 0 6px' }}>
                  MONTHLY BUDGET CAP (OPTIONAL)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: 12, color: 'var(--text3)' }}>$</span>
                  <input
                    value={budgetDraft}
                    onChange={(e) => setBudgetDraft(e.target.value)}
                    placeholder="e.g. 80"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontFamily: 'var(--fm)',
                      fontSize: 12,
                      color: 'var(--text)',
                      outline: 'none',
                      background: '#fff',
                    }}
                  />
                </div>
              </>
            )}
            {!isAi && !!it.rateNote && (
              <div style={{ font: '500 10px/1.4 var(--f)', color: 'var(--text3)', marginTop: 8 }}>{it.rateNote}</div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                type="button"
                onClick={() => saveDraft(it)}
                disabled={busy}
                style={{
                  flex: 1,
                  background: 'var(--accent)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 8,
                  padding: 8,
                  font: '600 12px var(--f)',
                  cursor: 'pointer',
                }}
              >
                Save &amp; validate
              </button>
              {connected && !isFree && (
                <button
                  type="button"
                  onClick={() => disconnect(it)}
                  disabled={busy}
                  style={{
                    background: '#fff',
                    border: `1px solid ${RED_BORDER}`,
                    color: 'var(--red)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    font: '600 12px var(--f)',
                    cursor: 'pointer',
                  }}
                >
                  Disconnect
                </button>
              )}
              <button
                type="button"
                onClick={closePanel}
                style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  color: 'var(--text2)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  font: '600 12px var(--f)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const chipStyle = (active: boolean, activeBg: string): CSSProperties => ({
    borderRadius: 999,
    padding: '6px 12px',
    font: '600 12px var(--f)',
    cursor: 'pointer',
    transition: '.15s',
    background: active ? activeBg : '#fff',
    color: active ? '#fff' : 'var(--text2)',
    border: `1px solid ${active ? activeBg : 'var(--border)'}`,
  });

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))',
    gap: 12,
  };

  return (
    <div style={{ padding: '30px 32px 60px', maxWidth: 1200, margin: '0 auto' }}>
      {/* header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ font: '700 30px/1.2 var(--f)', letterSpacing: '-.02em', margin: 0, color: 'var(--text)' }}>
            Sources
          </h1>
          <div style={{ marginTop: 4, font: '500 13px var(--f)', color: 'var(--text3)' }}>
            Your data sources — a parts catalog for the machine you’re assembling. Bring your own keys; you fund every call.
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,.04)',
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <div style={{ font: '700 12.5px var(--f)', color: 'var(--text)' }}>Paid sources</div>
            <div style={{ font: '500 10.5px var(--f)', color: 'var(--text3)' }}>{paidCount} in view</div>
          </div>
          <button
            type="button"
            onClick={togglePaidMaster}
            aria-pressed={paidMaster}
            style={{
              position: 'relative',
              width: 40,
              height: 22,
              flex: 'none',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: paidMaster ? 'var(--accent)' : 'var(--surfh)',
              transition: '.2s',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: paidMaster ? 20 : 2,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 2px rgba(0,0,0,.2)',
                transition: '.2s',
              }}
            />
          </button>
        </div>
      </div>

      {/* empty-org notice */}
      {!hasOrg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '11px 14px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--surf)',
            color: 'var(--text2)',
            font: '600 12px var(--f)',
            marginBottom: 16,
          }}
        >
          <span style={{ font: '700 12px var(--f)', color: 'var(--text)' }}>No organization yet.</span>
          <span style={{ font: '500 12px var(--f)', color: 'var(--text3)' }}>
            Browse the catalog below — connect keys once your workspace is set up.
          </span>
        </div>
      )}

      {/* amber readout strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 14px',
          borderRadius: 10,
          border: `1px solid ${AMBER_BORDER}`,
          background: 'var(--amberl)',
          color: '#92400E',
          font: '600 12px var(--f)',
          marginBottom: 20,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2}>
          <path d="m12 2 2.2 6.6H21l-5.4 4 2 6.6L12 15.6 6.4 19.2l2-6.6L3 8.6h6.8z" />
        </svg>
        <span>{paidReadout}</span>
      </div>

      {/* summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { value: String(connectedCount), label: 'CONNECTED & ON', color: 'var(--text)' },
          { value: String(freeCount), label: 'FREE SOURCES', color: 'var(--green)' },
          { value: String(paidCatalogCount), label: 'PAID · NEED A KEY', color: 'var(--amber)' },
          { value: '$' + monthlyPaid.toFixed(2), label: 'PAID SPEND / MO', color: 'var(--text)' },
        ].map((t) => (
          <div
            key={t.label}
            style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '14px 16px',
              boxShadow: '0 1px 3px rgba(0,0,0,.04)',
            }}
          >
            <div style={{ font: '700 22px var(--f)', color: t.color }}>{t.value}</div>
            <div style={{ font: '600 10px var(--f)', color: 'var(--text3)', letterSpacing: '.04em', marginTop: 2 }}>
              {t.label}
            </div>
          </div>
        ))}
      </div>

      {/* search + category filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '0 12px',
            flex: 1,
            minWidth: 220,
            maxWidth: 320,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.8}>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search providers…"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--text)',
              font: '500 13px var(--f)',
              padding: '10px 0',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {catChips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCatFilter(c.key)}
              style={chipStyle(catFilter === c.key, 'var(--accent)')}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* vertical filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
        <span style={{ font: '700 10px var(--f)', letterSpacing: '.1em', color: 'var(--text3)', marginRight: 2 }}>
          VERTICAL
        </span>
        {verticalChips.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setVFilter(v.key)}
            style={chipStyle(vFilter === v.key, 'var(--navy)')}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* AI · required (pinned) */}
      {showAi && (
        <div
          style={{
            background: '#fff',
            border: `1px solid ${PURPLE_BORDER}`,
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ font: '700 11px var(--f)', letterSpacing: '.09em', color: 'var(--purple)' }}>
              AI · REQUIRED
            </span>
          </div>
          {!aiConnected ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '14px 16px',
                background: 'var(--redl)',
                border: `1px solid ${RED_BORDER}`,
                borderRadius: 12,
                marginBottom: 14,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth={2} style={{ flex: 'none', marginTop: 1 }}>
                <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
              </svg>
              <div>
                <div style={{ font: '700 13px var(--f)', color: '#991B1B' }}>Nothing runs without an AI key.</div>
                <div style={{ font: '500 12px/1.5 var(--f)', color: '#B45252', marginTop: 2 }}>
                  This funds extraction, scoring, and outreach. You pay Anthropic or OpenAI directly. Connect one below before anything else on this screen matters.
                </div>
              </div>
            </div>
          ) : (
            <div style={{ font: '500 12px var(--f)', color: 'var(--text2)', marginBottom: 14 }}>
              These fund extraction, scoring, and outreach. You pay your provider directly. At least one is connected — good.
            </div>
          )}
          <div style={gridStyle}>{aiItems.map((it) => renderCard(it, true))}</div>
        </div>
      )}

      {/* catalog */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        {catGroups.map((g) => (
          <div key={g.cat}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
              <span style={{ font: '700 11px var(--f)', letterSpacing: '.09em', color: 'var(--text3)' }}>{g.cat}</span>
              <span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--text3)' }}>{g.items.length}</span>
            </div>
            <div style={gridStyle}>{g.items.map((it) => renderCard(it, false))}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, font: '500 12px var(--f)', color: 'var(--text3)' }}>
        Keys are write-only — after saving, only status and the last 4 characters are ever shown. No LinkedIn scraping: public sources only.
      </div>
    </div>
  );
}
