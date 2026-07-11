/**
 * Stage 5 — verify. Runs a real MX lookup (+ optional conservative SMTP RCPT
 * probe) on every email via the built-in MX/SMTP adapter. If the run profile
 * allows NeverBounce and a valid key exists, escalates risky/guess emails to it.
 * Derives EmailStatus via @lead/core deriveEmailStatus from the accumulated
 * evidence + any SMTP result.
 */

import { deriveEmailStatus, type EmailStatus } from '@lead/core';
import { verifyMxSmtp } from '../adapters/verify/mxsmtp.js';
import { verifyNeverBounce, NEVERBOUNCE_COST } from '../adapters/verify/neverbounce.js';
import type { PaidGate } from '../registry.js';
import type { Person, Spend, VerifyOutcome } from '../adapters/types.js';
import type { Log } from '../log.js';
import { cfg } from '../config.js';

export interface VerifiedContact {
  person: Person;
  emailStatus: EmailStatus;
}

export interface VerifyDeps {
  gate: PaidGate;
  spend: (s: Spend) => void;
  log: Log;
}

export async function runVerify(people: Person[], deps: VerifyDeps): Promise<VerifiedContact[]> {
  const { log } = deps;
  const out: VerifiedContact[] = [];

  for (const person of people) {
    if (!person.email) {
      out.push({ person, emailStatus: 'unknown' });
      continue;
    }
    let outcome: VerifyOutcome | null = await verifyMxSmtp.verify(person.email, log);

    // Escalate to NeverBounce when allowed and MX-only left us uncertain.
    const uncertain = !outcome || (!outcome.accepted && outcome.method === 'dns');
    if (uncertain) {
      const best = person.sources.reduce((a, s) => Math.max(a, s.confidence), 0);
      const decision = deps.gate.canFire('NeverBounce', best);
      if (decision.allowed && verifyNeverBounce.available()) {
        const nb = await verifyNeverBounce.verify(person.email, log);
        deps.spend({ provider: 'NeverBounce', kind: 'paid', spend: NEVERBOUNCE_COST, calls: 1 });
        deps.gate.record('NeverBounce', NEVERBOUNCE_COST);
        if (nb) outcome = nb;
      }
    }

    // Record the verification as an evidence source.
    let smtp: { accepted: boolean; catchAll: boolean } | undefined;
    if (outcome) {
      person.sources.push({
        provider: outcome.provider,
        method: outcome.method,
        confidence: outcome.confidence,
      });
      if (outcome.method === 'probe' || outcome.method === 'api') {
        smtp = { accepted: outcome.accepted, catchAll: outcome.catchAll };
      }
      if (!outcome.mxFound) smtp = { accepted: false, catchAll: false };
    }

    const emailStatus = deriveEmailStatus(person.sources, smtp);
    out.push({ person, emailStatus });
  }

  // Keep threshold reachable in logs.
  log.debug(`verify done for ${out.length} contacts (threshold ${cfg.paidThreshold})`);
  return out;
}
