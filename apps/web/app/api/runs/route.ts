import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { enqueue } from '@/lib/queue';
import { RUN_PROFILES, type RunInput, type RunProfileId } from '@lead/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/runs — start a run.
 * Body: { profile, input, icpProfileId?, label? }
 * 1. validates the user's session + org membership
 * 2. inserts a `runs` row (status 'queued') via the service client
 * 3. enqueues a RunJob for the worker
 * Returns { runId }.
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
  const input: RunInput = body.input ?? { kind: 'prompt', text: '' };
  const label = body.label?.trim() || deriveLabel(input);

  const svc = createServiceClient();
  const { data: run, error } = await svc
    .from('runs')
    .insert({
      org_id: orgId,
      created_by: user.id,
      label,
      profile,
      status: 'queued',
      input,
      icp_profile_id: body.icpProfileId ?? null,
    })
    .select('id')
    .single();

  if (error || !run) {
    return NextResponse.json({ error: error?.message ?? 'insert failed' }, { status: 500 });
  }

  try {
    await enqueue({
      type: 'run',
      runId: run.id,
      orgId,
      profile,
      input,
      icpProfileId: body.icpProfileId ?? null,
    });
  } catch (e) {
    // Row is created; surface enqueue failure but keep the run for retry.
    return NextResponse.json(
      { runId: run.id, warning: 'queued row created but dispatch failed', detail: String(e) },
      { status: 202 }
    );
  }

  return NextResponse.json({ runId: run.id });
}

function deriveLabel(input: RunInput): string {
  switch (input.kind) {
    case 'company':
      return `Company · ${input.domain}`;
    case 'person':
      return `Person · ${input.name}`;
    case 'csv':
      return 'CSV import';
    case 'sweep':
      return `Sweep · ${input.sweep.vertical}`;
    case 'prompt':
    default:
      return input.kind === 'prompt' && input.text ? input.text.slice(0, 60) : 'New run';
  }
}
