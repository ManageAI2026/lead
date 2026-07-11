import { createClient } from '@/lib/supabase/server';
import { mapContact } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/export — stream the org's contacts as a CSV download.
 * Honors the same filter query params as the Data screen (q, email, tier,
 * industry) so "Export CSV" exports exactly what the user is looking at.
 */
export async function GET(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('unauthorized', { status: 401 });

  const { data: member } = await supabase
    .from('members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
  if (!member) return new Response('no org', { status: 403 });

  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? '';
  const email = url.searchParams.get('email') ?? 'all';
  const tier = url.searchParams.get('tier') ?? 'all';
  const industry = url.searchParams.get('industry') ?? 'all';

  let query = supabase.from('contacts').select('*').eq('org_id', member.org_id);
  if (email !== 'all') query = query.eq('email_status', email);
  if (tier !== 'all') query = query.eq('tier', tier);
  if (industry !== 'all') query = query.eq('vertical', industry);
  if (q) {
    const like = `%${q}%`;
    query = query.or(`name.ilike.${like},company_name.ilike.${like},title.ilike.${like}`);
  }
  const { data } = await query.order('fit', { ascending: false }).limit(5000);
  const contacts = (data ?? []).map(mapContact);

  const headers = [
    'name',
    'title',
    'company',
    'domain',
    'vertical',
    'email',
    'email_status',
    'phone',
    'fit',
    'intent',
    'tier',
    'sources',
  ];
  const lines = [headers.join(',')];
  for (const c of contacts) {
    const sources = c.sources.map((s) => `${s.provider}:${s.method}:${s.confidence}`).join('; ');
    lines.push(
      [
        c.name,
        c.title,
        c.companyName,
        c.domain,
        c.vertical ?? '',
        c.email ?? '',
        c.emailStatus,
        c.phone ?? '',
        String(c.fit),
        String(c.intent),
        c.tier,
        sources,
      ]
        .map(csvCell)
        .join(',')
    );
  }
  const csv = lines.join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="contacts-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function csvCell(v: string): string {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
