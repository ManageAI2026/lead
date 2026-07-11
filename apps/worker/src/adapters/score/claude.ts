/**
 * Claude Sonnet rubric scorer — REAL Anthropic Messages API, key-guarded.
 *
 * Given the ICP profile, the company facts, and the person, asks the model named
 * by ANTHROPIC_MODEL_SCORE for a fit score 0..100 with a one-line rationale,
 * anchored to the deterministic prior so results stay stable. Returns null
 * without ANTHROPIC_API_KEY (caller keeps the prior). Emitted via a forced tool
 * call so the output is always structured.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { IcpProfile } from '@lead/core';
import { cfg } from '../../config.js';
import type { Log } from '../../log.js';
import type { ScoreInput } from './prior.js';

const TOOL = {
  name: 'record_fit',
  description: 'Record the ICP fit score for this contact.',
  input_schema: {
    type: 'object' as const,
    properties: {
      fit: { type: 'number', description: 'ICP fit 0-100' },
      rationale: { type: 'string', description: 'One sentence justification' },
    },
    required: ['fit'],
  },
};

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!cfg.anthropicKey) return null;
  if (!client) client = new Anthropic({ apiKey: cfg.anthropicKey });
  return client;
}

export interface ScoreResult {
  fit: number;
  rationale: string | null;
}

export async function scoreClaude(
  input: ScoreInput,
  profile: IcpProfile,
  prior: number,
  log: Log
): Promise<ScoreResult | null> {
  const anthropic = getClient();
  if (!anthropic) {
    log.path('skipped', 'no ANTHROPIC_API_KEY — using deterministic prior');
    return null;
  }
  const profileSummary = [
    `Industries: ${profile.industries.join(', ') || 'any'}`,
    `Employees: ${profile.empMin}-${profile.empMax}`,
    `Geo: ${profile.geo || 'any'}`,
    `Seniority: ${profile.seniority.join(', ') || 'any'}`,
    `Functions: ${profile.functions.join(', ') || 'any'}`,
    `Title keywords: ${profile.titleKeywords || 'n/a'}`,
    `Disqualifiers: ${profile.disqualifiers || 'none'}`,
  ].join('\n');
  const contactSummary = [
    `Name: ${input.person.name}`,
    `Title: ${input.person.title}`,
    `Company: ${input.company.name ?? input.company.domain}`,
    `Industry: ${input.company.industry ?? 'unknown'}`,
    `Employees: ${input.company.employees ?? 'unknown'}`,
    `HQ: ${input.company.hq ?? 'unknown'}`,
  ].join('\n');
  try {
    const res = await anthropic.messages.create({
      model: cfg.modelScore,
      max_tokens: 512,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: 'record_fit' },
      messages: [
        {
          role: 'user',
          content:
            `Score how well this contact fits the Ideal Customer Profile, 0-100.\n\n` +
            `A deterministic prior scored this ${prior}. Adjust from there only with clear reason.\n\n` +
            `=== ICP ===\n${profileSummary}\n\n=== CONTACT ===\n${contactSummary}`,
        },
      ],
    });
    const block = res.content.find((b) => b.type === 'tool_use');
    if (!block || block.type !== 'tool_use') return null;
    const out = block.input as { fit?: number; rationale?: string };
    const fit = Math.max(0, Math.min(100, Math.round(Number(out.fit ?? prior))));
    log.path('live', `claude scored ${input.person.name} fit=${fit} (prior ${prior})`);
    return { fit, rationale: out.rationale ?? null };
  } catch (err) {
    log.warn('claude score failed — keeping prior', err instanceof Error ? err.message : err);
    return null;
  }
}
