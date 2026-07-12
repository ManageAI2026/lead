/**
 * Pure presentational helpers ported from the approved prototype's renderVals().
 * No React, no server-only imports — safe to use from both server and client
 * components. Colors reference the CSS tokens in globals.css.
 */
import type { CSSProperties } from 'react';
import type { Contact, EmailStatus, EvidenceSource, Tier } from '@lead/core';

export const STAGES_META: { key: string; label: string; acts: [string, string][] }[] = [
  { key: 'discover', label: 'Discover', acts: [['Places API…', 'free'], ['SAM.gov lookup…', 'free'], ['SoS registry…', 'free'], ['Exa search…', 'paid']] },
  { key: 'scrape', label: 'Scrape', acts: [['Playwright render…', 'free'], ['fetch /team…', 'free'], ['Bright Data proxy…', 'paid'], ['Apify fallback…', 'paid']] },
  { key: 'extract', label: 'Extract', acts: [['Haiku extract…', 'paid'], ['person-block parse…', 'paid']] },
  { key: 'enrich', label: 'Enrich', acts: [['NPI registry…', 'free'], ['Hunter lookup…', 'paid'], ['Apollo match…', 'paid'], ['PDL enrich…', 'paid'], ['Clay waterfall…', 'paid']] },
  { key: 'verify', label: 'Verify', acts: [['MX / SMTP…', 'free'], ['catch-all probe…', 'free'], ['NeverBounce…', 'paid']] },
  { key: 'score', label: 'Score', acts: [['Sonnet score…', 'paid'], ['ICP rubric…', 'free']] },
  { key: 'deliver', label: 'Deliver', acts: [['CSV export', 'free'], ['→ Pipedrive', 'free'], ['→ Instantly', 'free']] },
];

export const STAGE_INDEX: Record<string, number> = Object.fromEntries(
  STAGES_META.map((s, i) => [s.key, i])
);

export function esMeta(es: EmailStatus | string): { label: string; color: string; bg: string } {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    deliverable: { label: 'Deliverable', color: '#16A34A', bg: '#E8F8EE' },
    risky: { label: 'Risky', color: '#D97706', bg: '#FEF8E8' },
    guess: { label: 'Guess', color: '#DC2626', bg: '#FEF2F2' },
    unknown: { label: 'Unknown', color: '#7A8B9A', bg: '#F5F6F8' },
  };
  return map[es] ?? map.unknown;
}

export function tierMeta(t: Tier | string): { color: string; bg: string } {
  const map: Record<string, { color: string; bg: string }> = {
    A: { color: '#16A34A', bg: '#E8F8EE' },
    B: { color: '#4A8FD6', bg: '#EBF3FC' },
    C: { color: '#7A8B9A', bg: '#F1F5F9' },
  };
  return map[t] ?? map.C;
}

export function chipStyle(conf: number | string): CSSProperties {
  const c = typeof conf === 'number' ? conf : parseFloat(conf);
  const low = c < 0.5;
  return {
    fontFamily: 'var(--fm)',
    fontSize: 10,
    padding: '2px 7px',
    borderRadius: 6,
    background: 'var(--surf)',
    border: '1px solid var(--border)',
    color: low ? '#DC2626' : '#475569',
    whiteSpace: 'nowrap',
  };
}

export function fmt$(n: number): string {
  return '$' + (Number.isFinite(n) ? n : 0).toFixed(2);
}

export function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
}

export function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** score → badge style (fit/intent pills). */
export function scoreBadge(val: number): CSSProperties {
  const color = val >= 75 ? 'var(--green)' : val >= 60 ? 'var(--accent)' : 'var(--amber)';
  const bg = val >= 75 ? 'var(--greenl)' : val >= 60 ? 'var(--accentl)' : 'var(--amberl)';
  return { font: '700 10px var(--f)', padding: '1px 6px', borderRadius: 5, color, background: bg };
}

export interface EvidenceRow {
  field: string;
  value: string;
  meta: string;
  time: string;
  color: string;
}

/** Build the evidence timeline for a contact from its sources. */
export function buildEvidence(c: Contact): EvidenceRow[] {
  const ev: EvidenceRow[] = [];
  const s0 = c.sources[0];
  ev.push({
    field: 'company',
    value: `${c.companyName || c.domain} · ${c.domain}`,
    meta: s0 ? `${s0.provider} · ${s0.method} · ${s0.confidence.toFixed(2)}` : 'scrape · resolved · 0.98',
    time: 'day 1 · 09:04',
    color: 'var(--green)',
  });
  ev.push({
    field: 'name / title',
    value: `${c.name} — ${c.title}`,
    meta: 'scrape · person-block · 0.94',
    time: 'day 1 · 09:05',
    color: 'var(--green)',
  });
  c.sources.forEach((s: EvidenceSource, i: number) => {
    ev.push({
      field: 'email',
      value: c.email ?? '—',
      meta: `${s.provider} · ${s.method} · ${s.confidence.toFixed(2)}`,
      time: 'day 1 · 09:0' + (6 + i),
      color:
        s.provider === 'guess'
          ? 'var(--red)'
          : ['hunter', 'apollo', 'pdl'].includes(s.provider)
            ? 'var(--amber)'
            : 'var(--green)',
    });
  });
  ev.push({
    field: 'email verification',
    value:
      c.emailStatus === 'deliverable'
        ? 'MX + SMTP → deliverable'
        : c.emailStatus === 'risky'
          ? 'catch-all domain → risky'
          : 'unverified guess — gated from delivery',
    meta:
      'smtp · probe · ' +
      (c.emailStatus === 'deliverable' ? '0.98' : c.emailStatus === 'risky' ? '0.55' : '0.30'),
    time: 'day 1 · 09:11',
    color:
      c.emailStatus === 'deliverable'
        ? 'var(--green)'
        : c.emailStatus === 'risky'
          ? 'var(--amber)'
          : 'var(--red)',
  });
  ev.push({
    field: 'ICP score',
    value: `tier ${c.tier} · ${c.fit}/100`,
    meta: 'sonnet · rubric · applied',
    time: 'day 1 · 09:13',
    color: 'var(--accent)',
  });
  return ev;
}

/** Badge tone per target status. [bg, color, label]. */
export const BADGE_TONE: Record<string, [string, string, string]> = {
  running: ['#EBF3FC', '#2D6AAF', 'RUNNING'],
  repairing: ['#FEF8E8', '#D97706', 'REPAIR'],
  failed: ['#FEF2F2', '#DC2626', 'FAILED'],
  done: ['#E8F8EE', '#16A34A', 'DONE'],
  queued: ['#F1F5F9', '#475569', 'QUEUED'],
  cancelled: ['#F1F5F9', '#475569', 'CANCELLED'],
};

export function activityColor(kind: string): string {
  return kind === 'paid'
    ? 'var(--amber)'
    : kind === 'danger'
      ? 'var(--red)'
      : kind === 'idle'
        ? 'var(--text3)'
        : 'var(--green)';
}

export const VERTICAL_LIST = [
  'Automotive',
  'B2B Services',
  'Construction',
  'CPG & Retail',
  'Financial',
  'Hospitality',
  'Manufacturing',
  'Real Estate',
  'Healthcare',
];
