import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RUN_PROFILES, type RunProfileId } from '@lead/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/org — update the caller's org settings (free-first master switch,
 * paid escalation threshold, paid master switch, default profile, name).
 * Writes run under the user's RLS session, so only members with the right role
 * (per policy) can mutate.
 */
async function update(req: Request) {
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

  let body: {
    freeFirst?: boolean;
    threshold?: number;
    paidEnabled?: boolean;
    defaultProfile?: string;
    name?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.freeFirst === 'boolean') patch.free_first = body.freeFirst;
  if (typeof body.paidEnabled === 'boolean') patch.paid_enabled = body.paidEnabled;
  if (typeof body.threshold === 'number') {
    // Accept either 0..1 or 40..95 (percent) and normalize to 0..1.
    const t = body.threshold > 1 ? body.threshold / 100 : body.threshold;
    patch.threshold = Math.max(0, Math.min(1, t));
  }
  if (body.defaultProfile && RUN_PROFILES[body.defaultProfile as RunProfileId]) {
    patch.default_profile = body.defaultProfile;
  }
  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim();

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('orgs')
    .update(patch)
    .eq('id', member.org_id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, org: data });
}

export const PATCH = update;
export const POST = update;
