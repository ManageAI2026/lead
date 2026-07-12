/**
 * ICP scoring helpers. The heavy lifting (LLM rubric scoring) happens in the
 * worker's `score` stage; these are the deterministic pieces shared between
 * worker and web: tiering, seniority classification, and email-status derivation.
 */

import type { EmailStatus, EvidenceSource, IcpProfile, Tier } from './types.js';

/** Cut points parsed from an IcpProfile.tierCut string like "60 / 75 / 90". */
export function parseTierCuts(tierCut: string): [number, number, number] {
  const parts = tierCut
    .split('/')
    .map((p) => parseInt(p.trim(), 10))
    .filter((n) => !Number.isNaN(n));
  const [c = 60, b = 75, a = 90] = parts;
  return [c, b, a];
}

/** Map a fit score to a tier using the profile's cut points. */
export function tierForFit(fit: number, tierCut = '60 / 75 / 90'): Tier {
  const [, b, a] = parseTierCuts(tierCut);
  if (fit >= a) return 'A';
  if (fit >= b) return 'B';
  return 'C';
}

/** Classify a job title into a seniority band. */
export function seniorityOf(title: string): string {
  const l = title.toLowerCase();
  if (/founder|owner|ceo|president|principal|partner/.test(l)) return 'Owner';
  if (/chief|cxo|coo|cfo|cto|cmo/.test(l)) return 'CXO';
  if (/vp|vice president|head of/.test(l)) return 'VP';
  if (/director/.test(l)) return 'Director';
  return 'Manager';
}

/**
 * Derive an email deliverability status from the strongest evidence source and
 * an optional SMTP verification result. A pattern guess with no verification is
 * always a 'guess' and must be gated out of delivery.
 */
export function deriveEmailStatus(
  sources: EvidenceSource[],
  smtp?: { accepted: boolean; catchAll: boolean }
): EmailStatus {
  const best = sources.reduce(
    (acc, s) => (s.confidence > acc ? s.confidence : acc),
    0
  );
  const isGuess = sources.some((s) => s.provider === 'guess' || s.method === 'pattern');
  if (smtp) {
    if (smtp.accepted && !smtp.catchAll) return 'deliverable';
    if (smtp.catchAll) return 'risky';
    return isGuess ? 'guess' : 'risky';
  }
  if (isGuess) return 'guess';
  if (best >= 0.9) return 'deliverable';
  if (best >= 0.6) return 'risky';
  return 'guess';
}

/**
 * A cheap, deterministic ICP fit prior computed from firmographics and the
 * profile. The worker uses this as a fallback and as a prior for the LLM rubric
 * so scores are stable when the model is unavailable.
 */
export function fitPrior(
  input: {
    industry?: string | null;
    employees?: number | null;
    geo?: string | null;
    seniority?: string;
    title?: string;
  },
  profile: Pick<IcpProfile, 'industries' | 'empMin' | 'empMax' | 'geo' | 'seniority' | 'disqualifiers'>
): number {
  let score = 50;

  if (input.industry && profile.industries.some((i) => match(input.industry!, i))) {
    score += 18;
  }
  if (input.employees != null) {
    if (input.employees >= profile.empMin && input.employees <= profile.empMax) score += 12;
    else score -= 8;
  }
  if (input.geo && profile.geo && match(input.geo, profile.geo)) score += 10;

  const sen = input.seniority ?? (input.title ? seniorityOf(input.title) : undefined);
  if (sen && profile.seniority.some((s) => match(sen, s))) score += 12;

  // Disqualifiers are semicolon-separated substrings.
  const dq = profile.disqualifiers
    .split(';')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const hay = `${input.industry ?? ''} ${input.title ?? ''}`.toLowerCase();
  if (dq.some((d) => hay.includes(d))) score -= 30;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function match(a: string, b: string): boolean {
  return a.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(a.toLowerCase());
}

/** Guess the most likely email for a name at a domain (pattern fallback). */
export function guessEmail(fullName: string, domain: string): string {
  const parts = fullName.trim().toLowerCase().split(/\s+/);
  const first = parts[0] ?? '';
  const last = parts[parts.length - 1] ?? '';
  if (!first) return '';
  const local = last ? `${first[0]}.${last}` : first;
  return `${local}@${domain}`.replace(/[^a-z0-9.@_-]/g, '');
}
