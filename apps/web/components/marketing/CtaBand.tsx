import Link from 'next/link';

export function CtaBand() {
  return (
    <section style={{ background: 'var(--surf)', borderTop: '1px solid var(--border)' }}>
      <div data-pad="" style={{ maxWidth: 1240, margin: '0 auto', padding: '66px 40px', textAlign: 'center' }}>
        <h2 style={{ font: '700 34px/1.15 var(--f)', letterSpacing: '-.02em', margin: 0, color: 'var(--navy)' }}>
          Find contacts you can actually trust.
        </h2>
        <p style={{ font: '400 17px/1.6 var(--f)', color: 'var(--text2)', margin: '16px auto 28px', maxWidth: 560 }}>
          Start free with your own keys. See what free sources alone can do before you spend a thing.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" style={{ font: '700 15px var(--f)', color: '#fff', background: 'var(--accent)', padding: '14px 24px', borderRadius: 11 }}>
            Start free, no credit card
          </Link>
          <Link href="/how-it-works" style={{ font: '600 15px var(--f)', color: 'var(--accent)', background: '#fff', border: '1px solid var(--border)', padding: '14px 24px', borderRadius: 11 }}>
            Talk to us
          </Link>
        </div>
      </div>
    </section>
  );
}
