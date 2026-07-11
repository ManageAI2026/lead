import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/talk — send a message to the Operator agent.
 * Persists the user's message and a generated assistant reply to talk_messages,
 * then returns the reply. The reply is a templated, data-aware response today;
 * the structure (system context + user turn → assistant text) is exactly what an
 * LLM call would slot into, so a live model can be dropped in here later.
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
  if (!member) return NextResponse.json({ error: 'no org' }, { status: 403 });
  const orgId = member.org_id as string;

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const text = body.text?.trim();
  if (!text) return NextResponse.json({ error: 'empty message' }, { status: 400 });

  // Gather lightweight context the model (or template) can reference.
  const [{ count: contactCount }, { count: companyCount }, { count: runCount }] = await Promise.all([
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('companies').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('runs').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
  ]);

  const reply = generateReply(text, {
    contacts: contactCount ?? 0,
    companies: companyCount ?? 0,
    runs: runCount ?? 0,
  });

  // Persist both turns.
  await supabase.from('talk_messages').insert([
    { org_id: orgId, user_id: user.id, role: 'user', text },
    { org_id: orgId, user_id: user.id, role: 'agent', text: reply },
  ]);

  return NextResponse.json({ reply });
}

function generateReply(
  text: string,
  ctx: { contacts: number; companies: number; runs: number }
): string {
  const q = text.toLowerCase();
  if (/why|score|scored|tier/.test(q)) {
    return `I can trace any score to its evidence. Open the contact in Data to see every value, where it came from, and its confidence — a low-confidence pattern guess gets capped out of tier A until a second source or a verifier confirms it.`;
  }
  if (/add|build|source|registry|adapter|fix/.test(q)) {
    return `That's a build change. I can dispatch Claude Code in an isolated worktree to add it, run the test suite, and show you a diff. Anything that touches the pipeline needs your approval before it ships.`;
  }
  if (/run|sweep|find|scrape|territory/.test(q)) {
    return `I can start that as a run from the Runs screen — free sources fire first, and paid providers only below your confidence threshold. You'll see the yield and cost before anything bills.`;
  }
  return `Got it. Across your workspace I can see ${ctx.contacts.toLocaleString()} contacts, ${ctx.companies.toLocaleString()} companies, and ${ctx.runs.toLocaleString()} runs. I can answer from that data, start a run, or make it a build task — which would you like?`;
}
