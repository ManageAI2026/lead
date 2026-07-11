/**
 * Claude people extractor — REAL Anthropic Messages API with a tool/JSON schema.
 *
 * Sends the scraped page text to the model named by ANTHROPIC_MODEL_EXTRACT and
 * forces a single tool call whose input is a `{ people: [...] }` array of
 * {name, title, email?, phone?}. Returns [] (and the caller falls back to the
 * heuristic extractor) when ANTHROPIC_API_KEY is absent or the call fails.
 */

import Anthropic from '@anthropic-ai/sdk';
import { cfg } from '../../config.js';
import type { ExtractAdapter, ExtractCtx, Person } from '../types.js';

const TOOL = {
  name: 'record_people',
  description:
    'Record every real person (staff, leadership, team members) found in the page text, with their job title and any contact details shown.',
  input_schema: {
    type: 'object' as const,
    properties: {
      people: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Full name of the person' },
            title: { type: 'string', description: 'Their job title / role' },
            email: { type: 'string', description: 'Email if explicitly shown' },
            phone: { type: 'string', description: 'Direct phone if explicitly shown' },
          },
          required: ['name', 'title'],
        },
      },
    },
    required: ['people'],
  },
};

interface RawPerson {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
}

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!cfg.anthropicKey) return null;
  if (!client) client = new Anthropic({ apiKey: cfg.anthropicKey });
  return client;
}

export const extractClaude: ExtractAdapter = {
  provider: 'Anthropic',
  kind: 'ai',
  available: () => Boolean(cfg.anthropicKey),

  async extract(text: string, ctx: ExtractCtx): Promise<Person[]> {
    const anthropic = getClient();
    if (!anthropic) {
      ctx.log.path('skipped', 'no ANTHROPIC_API_KEY — using heuristic extractor');
      return [];
    }
    if (!text || text.length < 20) return [];
    const clipped = text.slice(0, 24000);
    try {
      const res = await anthropic.messages.create({
        model: ctx.model,
        max_tokens: 2048,
        tools: [TOOL],
        tool_choice: { type: 'tool', name: 'record_people' },
        messages: [
          {
            role: 'user',
            content:
              `Extract the real people (with titles) from this website text for the domain ${ctx.domain}. ` +
              `Ignore navigation, testimonials, and generic inboxes like info@ or sales@ unless tied to a named person.\n\n` +
              clipped,
          },
        ],
      });
      const block = res.content.find((b) => b.type === 'tool_use');
      if (!block || block.type !== 'tool_use') {
        ctx.log.warn('claude extract returned no tool_use');
        return [];
      }
      const input = block.input as { people?: RawPerson[] };
      const people: Person[] = (input.people ?? [])
        .filter((p) => p.name && p.name.trim().split(/\s+/).length >= 2)
        .map((p) => ({
          name: p.name!.trim(),
          title: (p.title ?? '').trim(),
          email: normEmail(p.email),
          phone: p.phone?.trim() || null,
          sources: [
            { provider: 'claude', method: 'extract', confidence: 0.7 },
            ...(normEmail(p.email)
              ? [{ provider: 'scrape', method: 'mailto', confidence: 0.8 }]
              : []),
          ],
        }));
      ctx.log.path('live', `claude extracted ${people.length} people via ${ctx.model}`);
      return people;
    } catch (err) {
      ctx.log.warn('claude extract failed — falling back to heuristic', err instanceof Error ? err.message : err);
      return [];
    }
  },
};

function normEmail(e?: string): string | null {
  if (!e) return null;
  const t = e.trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(t) ? t : null;
}
