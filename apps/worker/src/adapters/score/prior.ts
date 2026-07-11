/**
 * Deterministic ICP fit — REAL, free, always available. Wraps @lead/core's
 * fitPrior so the pipeline always has a stable score even when Claude scoring is
 * unavailable. Also derives a coarse intent signal from scrape/registry
 * evidence (a real contact page + registry match reads as warmer than a bare
 * domain).
 */

import { fitPrior, type IcpProfile } from '@lead/core';
import type { CompanyFacts, Person } from '../types.js';

export interface ScoreInput {
  person: Person;
  company: CompanyFacts;
  /** Best evidence confidence gathered for this person (0..1). */
  evidence: number;
}

/** Parse Company.employees-like strings ("11-50", "200") to a midpoint number. */
export function parseEmployees(v: string | number | null): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  const nums = v.match(/\d+/g)?.map(Number) ?? [];
  if (nums.length === 0) return null;
  if (nums.length === 1) return nums[0];
  return Math.round((nums[0] + nums[1]) / 2);
}

export function scorePrior(input: ScoreInput, profile: IcpProfile): number {
  return fitPrior(
    {
      industry: input.company.industry,
      employees: parseEmployees(input.company.employees),
      geo: input.company.hq,
      title: input.person.title,
    },
    profile
  );
}

/** Heuristic intent 0..100 from the strength/kind of evidence collected. */
export function intentPrior(input: ScoreInput): number {
  let intent = 30;
  if (input.person.email) intent += 20;
  if (input.person.phone) intent += 10;
  if (input.person.sources.some((s) => s.method === 'registry')) intent += 20;
  if (input.person.sources.some((s) => s.provider === 'scrape')) intent += 10;
  intent += Math.round(input.evidence * 10);
  return Math.max(0, Math.min(100, intent));
}
