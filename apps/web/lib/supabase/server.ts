import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server Supabase client bound to the request cookies (RSC / route handlers).
 * Uses the anon key + the signed-in user's session, so RLS applies.
 */
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore, the
            // middleware refreshes the session.
          }
        },
      },
    }
  );
}

/**
 * Service-role client — bypasses RLS. Server-only, never expose to the browser.
 * Used by API routes that enqueue work and by trusted server mutations.
 */
export function createServiceClient() {
  const { createClient: createSb } = require('@supabase/supabase-js');
  return createSb(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
