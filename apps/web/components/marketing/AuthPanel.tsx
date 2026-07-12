'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Spinner } from '@/components/ui';

type Mode = 'login' | 'signup';

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  marginTop: 6,
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '11px 13px',
  font: '500 14px var(--f)',
  outline: 'none',
};
const labelStyle: CSSProperties = { font: '600 12px var(--f)', color: 'var(--text2)', display: 'block' };

export function AuthPanel({ mode }: { mode: Mode }) {
  const isSignup = mode === 'signup';
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || (isSignup ? '/onboarding' : '/app');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgot, setForgot] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = forgot ? (sent ? 'Check your email' : 'Reset your password') : isSignup ? 'Start free' : 'Log in';
  const subtitle = forgot
    ? sent
      ? `We sent a reset link to ${email || 'your inbox'}. It expires in 30 minutes.`
      : 'Enter your email and we’ll send a reset link.'
    : isSignup
      ? 'No card. Your keys. Cancel anytime.'
      : 'Welcome back.';
  const cta = forgot ? (sent ? 'Back to log in' : 'Send reset link') : isSignup ? 'Create account' : 'Log in';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (forgot) {
      if (sent) {
        setForgot(false);
        setSent(false);
        return;
      }
      setBusy(true);
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/app`,
      });
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
      setSent(true);
      return;
    }

    setBusy(true);
    const supabase = createClient();
    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
      // If email confirmation is required, no session is returned.
      if (!data.session) {
        setError('Check your email to confirm your account, then log in.');
        return;
      }
      router.push(next);
      router.refresh();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push(next);
      router.refresh();
    }
  }

  async function onGoogle() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) setError(error.message);
  }

  const showOauth = !forgot;

  return (
    <div style={{ minHeight: 'calc(100vh - 66px)', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="lbpm-fade" style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <Link href="/" style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-.02em' }}>
            <span style={{ color: '#fff' }}>MANAGE </span>
            <span style={{ color: 'var(--accent)' }}>AI</span>
          </Link>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{ font: '600 13px var(--f)', color: '#B7C4D4' }}>Lead Booster Pro</span>
            <span style={{ fontFamily: 'var(--fm)', fontSize: 10, color: '#7C8DA3', border: '1px solid rgba(255,255,255,.18)', borderRadius: 5, padding: '2px 6px' }}>v2 · byok</span>
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ background: '#fff', borderRadius: 18, padding: 30, boxShadow: '0 20px 50px rgba(0,0,0,.3)' }}>
          <div style={{ font: '700 20px var(--f)', color: 'var(--navy)', marginBottom: 4 }}>{title}</div>
          <div style={{ font: '400 13.5px var(--f)', color: 'var(--text3)', marginBottom: 20 }}>{subtitle}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sent ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '8px 0 4px' }}>
                <span style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--green-light)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </span>
              </div>
            ) : (
              <>
                <label style={labelStyle}>
                  {isSignup ? 'Work email' : 'Email'}
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" style={inputStyle} />
                </label>
                {!forgot && (
                  <label style={labelStyle}>
                    {isSignup ? (
                      'Password'
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        Password
                        <button type="button" onClick={() => setForgot(true)} style={{ font: '600 11.5px var(--f)', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          Forgot?
                        </button>
                      </span>
                    )}
                    <input
                      type="password"
                      required
                      minLength={isSignup ? 8 : undefined}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isSignup ? 'At least 8 characters' : '••••••••'}
                      style={inputStyle}
                    />
                  </label>
                )}
              </>
            )}

            {error && (
              <div style={{ font: '500 12.5px/1.5 var(--f)', color: 'var(--red)', background: 'var(--redl)', border: '1px solid #F3C7C7', borderRadius: 9, padding: '9px 12px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              style={{ textAlign: 'center', font: '700 14.5px var(--f)', color: '#fff', background: 'var(--accent)', padding: 12, borderRadius: 10, marginTop: 4, border: 'none', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.75 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {busy && <Spinner color="#fff" />}
              {cta}
            </button>

            {isSignup && <div style={{ font: '500 12px/1.5 var(--f)', color: 'var(--text3)', textAlign: 'center' }}>No credit card. Bring your own keys. Cancel anytime.</div>}

            {showOauth && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
                  <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ font: '500 11px var(--f)', color: 'var(--text3)' }}>or</span>
                  <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                <button
                  type="button"
                  onClick={onGoogle}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, font: '600 14px var(--f)', color: 'var(--text)', background: '#fff', border: '1px solid var(--border)', padding: 11, borderRadius: 10, cursor: 'pointer' }}
                >
                  <svg width={17} height={17} viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-2 3.2-4.9 3.2-7.9z" />
                    <path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.7l-3.6-2.7c-1 .7-2.3 1-3.6 1-2.8 0-5.1-1.9-6-4.4H2.3v2.8A11 11 0 0 0 12 23z" />
                    <path fill="#FBBC05" d="M6 14.5a6.6 6.6 0 0 1 0-4.2V7.5H2.3a11 11 0 0 0 0 9.9z" />
                    <path fill="#EA4335" d="M12 5.9c1.6 0 3 .5 4.1 1.6l3.1-3.1A11 11 0 0 0 2.3 7.5L6 10.3c.9-2.6 3.2-4.4 6-4.4z" />
                  </svg>
                  Continue with Google
                </button>
              </>
            )}
          </div>

          {isSignup && (
            <div style={{ font: '400 11px/1.5 var(--f)', color: 'var(--text3)', textAlign: 'center', marginTop: 16 }}>
              By continuing you agree to the <Link href="/" style={{ color: 'var(--accent)' }}>Terms</Link> and <Link href="/" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>.
            </div>
          )}
        </form>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          {forgot ? (
            <button onClick={() => { setForgot(false); setSent(false); }} style={{ font: '600 13.5px var(--f)', color: '#B7C4D4', background: 'none', border: 'none', cursor: 'pointer' }}>
              Remembered it? <span style={{ color: '#fff' }}>Log in →</span>
            </button>
          ) : isSignup ? (
            <Link href="/login" style={{ font: '600 13.5px var(--f)', color: '#B7C4D4' }}>
              Already have an account? <span style={{ color: '#fff' }}>Log in →</span>
            </Link>
          ) : (
            <Link href="/signup" style={{ font: '600 13.5px var(--f)', color: '#B7C4D4' }}>
              New here? <span style={{ color: '#fff' }}>Start free →</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
