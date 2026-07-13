import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/sources — connect / manage a provider credential.
 *
 * STUBBED PENDING GATEWAY (Phase 2). Provider credentials are secrets;
 * validating and storing them (org_provider_configs + vault) belongs to the
 * server gateway, not to the dashboard. Until the gateway is booted and
 * reachable, this fails honestly with 501 instead of writing fake-"valid"
 * rows into the shared table. The Sources screen still reads
 * org_provider_configs (RLS) to display what the server has stored.
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

  let body: { provider?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  if (!body.provider?.trim()) {
    return NextResponse.json({ error: 'provider required' }, { status: 400 });
  }

  return NextResponse.json(
    { error: 'action pending gateway connection' },
    { status: 501 }
  );
}
