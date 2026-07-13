import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/talk — send a message to the Operator agent.
 *
 * STUBBED PENDING GATEWAY (Phase 2). The agent lives server-side; the old
 * templated-reply implementation wrote directly to talk_messages, which the
 * server now owns. Until the gateway is booted and reachable, this fails
 * honestly with 501. The Talk screen still reads talk_messages (RLS) for
 * history the server has written.
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('memberships')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
  if (!member) return NextResponse.json({ error: 'no org' }, { status: 403 });

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  if (!body.text?.trim()) {
    return NextResponse.json({ error: 'empty message' }, { status: 400 });
  }

  return NextResponse.json(
    { error: 'action pending gateway connection' },
    { status: 501 }
  );
}
