import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/sources — connect / manage a provider credential.
 * Body: { provider, key?, budgetCap?, enabled?, action? }
 *   action 'disconnect' → set status 'off', clear last4.
 *   otherwise → validate + store status 'valid', last4, budget_cap.
 *
 * SECURITY: the raw key is never persisted to a client-readable column and is
 * never echoed back. We store only status + last4 + budget. In production the
 * secret would be written to Vault and referenced by secret_ref.
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

  let body: {
    provider?: string;
    key?: string;
    budgetCap?: number | null;
    enabled?: boolean;
    action?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const provider = body.provider?.trim();
  if (!provider) return NextResponse.json({ error: 'provider required' }, { status: 400 });

  if (body.action === 'disconnect') {
    const { error } = await supabase
      .from('source_keys')
      .upsert(
        { org_id: orgId, provider, status: 'off', last4: null, enabled: false },
        { onConflict: 'org_id,provider' }
      );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, status: 'off' });
  }

  // Connect / update. If a key was supplied, validate its shape and derive last4.
  const key = body.key?.trim();
  const row: Record<string, unknown> = {
    org_id: orgId,
    provider,
    enabled: body.enabled ?? true,
  };
  if (typeof body.budgetCap === 'number') row.budget_cap = body.budgetCap;
  if (key) {
    if (key.length < 6) return NextResponse.json({ error: 'key too short' }, { status: 400 });
    row.status = 'valid';
    row.last4 = key.slice(-4);
    // secret_ref would point at the Vault entry; we never store the raw key here.
    row.secret_ref = `vault://${orgId}/${provider}`;
  } else {
    row.status = 'valid';
  }

  const { data, error } = await supabase
    .from('source_keys')
    .upsert(row, { onConflict: 'org_id,provider' })
    .select('provider,status,last4,budget_cap,budget_used,enabled')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, source: data });
}
