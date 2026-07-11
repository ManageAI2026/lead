import type { CSSProperties } from 'react';
import type { LedgerRollup } from '@/lib/data';
import { fmt$ } from '@/components/dashboard/shared';

/**
 * Billing screen (presentational). Ported from the approved prototype's
 * `isBilling` block. Given the per-provider ledger rollup it derives the
 * quota bars, cost-per-contact, spend ledger and the (static sample) weekly
 * free-vs-paid chart. No interactivity, so it renders as a server component.
 */

const card: CSSProperties = {
  background: '#fff',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 22,
  boxShadow: '0 1px 3px rgba(0,0,0,.04)',
};

const kicker: CSSProperties = {
  font: '700 10px var(--f)',
  letterSpacing: '.1em',
  color: 'var(--text3)',
};

// Static / derived quotas — no live usage feed yet, so port the prototype's
// sensible defaults.
const QUOTAS: { label: string; value: number; total: number }[] = [
  { label: 'Build jobs', value: 340, total: 1000 },
  { label: 'Targets processed', value: 8200, total: 25000 },
  { label: 'Concurrency', value: 6, total: 10 },
  { label: 'Seats', value: 4, total: 8 },
];

// Static sample weekly history (paidH stacked over freeH), pending real data.
const WEEKS: { week: string; freeH: number; paidH: number }[] = [
  [62, 10],
  [70, 14],
  [58, 22],
  [74, 18],
].map((w, i) => ({ week: 'W' + (i + 1), freeH: w[0], paidH: w[1] }));

export function BillingView({ ledger }: { ledger: LedgerRollup[] }) {
  const totalPaid = ledger.reduce((a, l) => a + (l.kind === 'paid' ? l.spend : 0), 0);
  const freeCalls = ledger.reduce((a, l) => a + (l.kind === 'free' ? l.calls : 0), 0);

  // Cost per qualified contact: totalPaid / max(1, qualified). We don't yet
  // have a qualified count on this screen, so fall back to the prototype's
  // sample figure when there's paid spend, else $0.00.
  const costPerContact = totalPaid > 0 ? '$0.38' : '$0.00';

  return (
    <div style={{ padding: '30px 32px 60px', maxWidth: 1160, margin: '0 auto', animation: 'lbp-up .5s ease' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ font: '700 30px/1.2 var(--f)', letterSpacing: '-.02em', margin: 0, color: 'var(--text)' }}>
          Billing
        </h1>
        <div style={{ marginTop: 4, font: '500 13px var(--f)', color: 'var(--text3)' }}>
          You pay a flat platform fee. Provider spend is on your own keys — free-first keeps it low.
        </div>
      </div>

      {/* Top row: current plan + cost per qualified contact */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ ...card, flex: 2, minWidth: 340 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={kicker}>CURRENT PLAN</div>
              <div style={{ font: '700 22px var(--f)', color: 'var(--text)', marginTop: 6 }}>Operator</div>
              <div style={{ font: '500 12.5px var(--f)', color: 'var(--text3)', marginTop: 2 }}>
                $499 / mo platform fee · billed monthly
              </div>
            </div>
            <button
              style={{
                background: 'var(--accent)',
                border: 'none',
                color: '#fff',
                borderRadius: 9,
                padding: '9px 15px',
                font: '600 12.5px var(--f)',
                cursor: 'pointer',
              }}
            >
              Upgrade plan
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {QUOTAS.map((q) => {
              const pct = Math.round((q.value / q.total) * 100);
              return (
                <div key={q.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ font: '600 12px var(--f)', color: 'var(--text)' }}>{q.label}</span>
                    <span style={{ fontFamily: 'var(--fm)', fontSize: 11.5, color: 'var(--text2)' }}>
                      {q.value.toLocaleString()} / {q.total.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surf)', borderRadius: 3, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        borderRadius: 3,
                        background:
                          pct >= 90 ? 'var(--amber)' : 'linear-gradient(90deg,var(--accent),var(--accentm))',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ ...card, flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column' }}>
          <div style={kicker}>COST PER QUALIFIED CONTACT</div>
          <div style={{ font: '700 44px var(--f)', letterSpacing: '-.02em', color: 'var(--green)', margin: '10px 0 2px' }}>
            {costPerContact}
          </div>
          <div style={{ font: '500 12px var(--f)', color: 'var(--text3)', marginBottom: 16 }}>
            across all providers this month
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--borderl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ font: '500 12px var(--f)', color: 'var(--text2)' }}>Free calls</span>
              <span style={{ fontFamily: 'var(--fm)', fontSize: 12, color: 'var(--green)' }}>
                {freeCalls.toLocaleString()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ font: '500 12px var(--f)', color: 'var(--text2)' }}>Paid spend</span>
              <span style={{ fontFamily: 'var(--fm)', fontSize: 12, color: 'var(--amber)' }}>{fmt$(totalPaid)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: cost ledger + free-vs-paid chart */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ ...card, flex: 2, minWidth: 360 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={kicker}>COST LEDGER — SPEND PER PROVIDER (YOUR KEYS)</span>
            <a href="#" style={{ font: '600 12px var(--f)', color: 'var(--accent)' }}>
              Stripe portal →
            </a>
          </div>
          {ledger.length === 0 ? (
            <div
              style={{
                padding: '11px 0',
                borderTop: '1px solid var(--borderl)',
                font: '500 12.5px var(--f)',
                color: 'var(--text3)',
              }}
            >
              No provider spend yet — runs on your keys will show up here.
            </div>
          ) : (
            ledger.map((l) => {
              const dot = l.kind === 'paid' ? 'var(--amber)' : 'var(--green)';
              const barPct = ((l.spend / Math.max(1, totalPaid)) * 100).toFixed(0) + '%';
              const spendText = l.kind === 'free' ? '$0.00 · free' : fmt$(l.spend);
              return (
                <div
                  key={l.provider}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 0',
                    borderTop: '1px solid var(--borderl)',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', flex: 'none', background: dot }} />
                  <span style={{ width: 120, flex: 'none', font: '600 12.5px var(--f)', color: 'var(--text)' }}>
                    {l.provider}
                  </span>
                  <div style={{ flex: 1, height: 6, background: 'var(--surf)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: barPct, height: '100%', borderRadius: 3, background: dot }} />
                  </div>
                  <span
                    style={{
                      width: 110,
                      textAlign: 'right',
                      flex: 'none',
                      fontFamily: 'var(--fm)',
                      fontSize: 11.5,
                      color: 'var(--text2)',
                    }}
                  >
                    {spendText}
                  </span>
                  <span
                    style={{
                      width: 80,
                      textAlign: 'right',
                      flex: 'none',
                      fontFamily: 'var(--fm)',
                      fontSize: 10.5,
                      color: 'var(--text3)',
                    }}
                  >
                    {l.calls.toLocaleString()} calls
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div style={{ ...card, flex: 1, minWidth: 240 }}>
          <div style={{ ...kicker, marginBottom: 18 }}>FREE VS PAID OVER TIME</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 130, padding: '0 4px' }}>
            {WEEKS.map((w) => (
              <div key={w.week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    height: 100,
                    gap: 2,
                  }}
                >
                  <div style={{ width: '70%', background: 'var(--amber)', borderRadius: '3px 3px 0 0', height: w.paidH }} />
                  <div style={{ width: '70%', background: 'var(--green)', borderRadius: '0 0 3px 3px', height: w.freeH }} />
                </div>
                <span style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--text3)' }}>{w.week}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 14, justifyContent: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, font: '500 11px var(--f)', color: 'var(--text2)' }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--green)' }} />
              free
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, font: '500 11px var(--f)', color: 'var(--text2)' }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--amber)' }} />
              paid
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
