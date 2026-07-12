/**
 * Stage 6 — score. Computes ICP fit via the deterministic prior (always), then
 * optionally refines with a Claude Sonnet rubric pass (ANTHROPIC_MODEL_SCORE).
 * Intent is heuristic. Tier comes from tierForFit against the profile cut points.
 */

import { tierForFit, type IcpProfile, type Tier } from '@lead/core';
import { scorePrior, intentPrior, type ScoreInput } from '../adapters/score/prior.js';
import { scoreClaude } from '../adapters/score/claude.js';
import type { CompanyFacts, Person } from '../adapters/types.js';
import type { EmailStatus } from '@lead/core';
import type { Log } from '../log.js';

export interface ScoredContact {
  person: Person;
  emailStatus: EmailStatus;
  fit: number;
  intent: number;
  tier: Tier;
}

export async function runScore(
  contacts: Array<{ person: Person; emailStatus: EmailStatus }>,
  company: CompanyFacts,
  profile: IcpProfile,
  log: Log,
  useClaude: boolean
): Promise<ScoredContact[]> {
  const out: ScoredContact[] = [];
  for (const c of contacts) {
    const input: ScoreInput = {
      person: c.person,
      company,
      evidence: c.person.sources.reduce((a, s) => Math.max(a, s.confidence), 0),
    };
    const prior = scorePrior(input, profile);
    let fit = prior;
    if (useClaude) {
      const refined = await scoreClaude(input, profile, prior, log);
      if (refined) fit = refined.fit;
    }
    const intent = intentPrior(input);
    const tier = tierForFit(fit, profile.tierCut);
    out.push({ person: c.person, emailStatus: c.emailStatus, fit, intent, tier });
  }
  const avg = out.length ? Math.round(out.reduce((a, c) => a + c.fit, 0) / out.length) : 0;
  log.info(`scored ${out.length} contacts (avg fit ${avg})`);
  return out;
}
