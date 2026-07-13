import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RUN_PROFILES, type RunInput, type RunProfileId } from '@lead/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/runs — start a run.
 *
 * STUBBED PENDING GATEWAY (Phase 2). The dashboard is a companion to the
 * server: job creation and dispatch belong to the server gateway, which owns
 * writes to the shared `jobs` table. The old BullMQ enqueue path is gone.
 * Until the gateway is booted and reachable, this validates the request and
 * fails honestly with 501 rather than writing rows nothing will process.
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

  let body: {
    profile?: string;
    input?: RunInput;
    icpProfileId?: string | null;
    label?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const profile = (body.profile ?? 'free-max') as RunProfileId;
  if (!RUN_PROFILES[profile]) {
    return NextResponse.json({ error: 'invalid profile' }, { status: 400 });
  }

  return NextResponse.json(
    { error: 'action pending gateway connection' },
    { status: 501 }
  );
}
