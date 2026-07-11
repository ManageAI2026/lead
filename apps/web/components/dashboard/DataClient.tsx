'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  seniorityOf,
  VERTICALS,
  type Company,
  type Contact,
  type IcpProfile,
} from '@lead/core';
import {
  buildEvidence,
  chipStyle,
  esMeta,
  initialsOf,
  scoreBadge,
  tierMeta,
} from '@/components/dashboard/shared';

interface Filters {
  q: string;
  email: string;
  tier: string;
  industry: string;
}

export function DataClient({
  contacts,
  companies,
  countsByDomain,
  icp,
  filters,
  industries,
}: {
  contacts: Contact[];
  companies: Company[];
  countsByDomain: Record<string, number>;
  icp: IcpProfile | null;
  filters: Filters;
  industries: string[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<'people' | 'accounts'>('people');
  const [savedView, setSavedView] = useState('All contacts');
  const [search, setSearch] = useState(filters.q);
  const [fSeniority, setFSeniority] = useState('all');
  const [fScore, setFScore] = useState('all');
  const [fHasPhone, setFHasPhone] = useState(false);
  const [drawer, setDrawer] = useState<Contact | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [personRow, setPersonRow] = useState<string | null>(null);
  const [icpOpen, setIcpOpen] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [provPickFor, setProvPickFor] = useState<string | null>(null);

  // URL-driven primary filters (server re-queries on change).
  function setParam(key: string, value: string) {
    const params = new URLSearchParams();
    const merged: Record<string, string> = { ...filters, [key]: value };
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== 'all') params.set(k === 'email' ? 'email' : k, v);
    });
    const qs = params.toString();
    router.push(qs ? `/app/data?${qs}` : '/app/data');
  }

  const q = search.trim().toLowerCase();

  // Client-side (in-memory) secondary filtering on top of the server-filtered set.
  const filteredContacts = useMemo(() => {
    return contacts.filter((p) => {
      if (q && !(p.name.toLowerCase().includes(q) || p.companyName.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || (p.vertical ?? '').toLowerCase().includes(q))) return false;
      if (fSeniority !== 'all' && seniorityOf(p.title) !== fSeniority) return false;
      if (fHasPhone && (!p.phone || p.phone === '—')) return false;
      if (fScore === 'qualified' && p.fit < 60) return false;
      if (fScore === 'strong' && p.fit < 75) return false;
      if (fScore === 'elite' && p.fit < 90) return false;
      return true;
    });
  }, [contacts, q, fSeniority, fHasPhone, fScore]);

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (q && !(c.name.toLowerCase().includes(q) || c.domain.toLowerCase().includes(q) || (c.industry ?? '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [companies, q]);

  const accountCompany = account ? companies.find((c) => c.domain === account) ?? null : null;
  const accountPeople = account ? contacts.filter((c) => c.domain === account) : [];

  const lchip = (active: boolean): React.CSSProperties => ({
    borderRadius: 8, padding: '6px 11px', font: '600 12px var(--f)', cursor: 'pointer', transition: '.15s',
    background: active ? 'var(--accent)' : '#fff', color: active ? '#fff' : 'var(--text2)', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
  });

  const exportHref = (() => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.email !== 'all') params.set('email', filters.email);
    if (filters.tier !== 'all') params.set('tier', filters.tier);
    if (filters.industry !== 'all') params.set('industry', filters.industry);
    const qs = params.toString();
    return qs ? `/api/export?${qs}` : '/api/export';
  })();

  const btn = (label: string, onClick: () => void, primary = false): React.ReactNode => (
    <button onClick={onClick} style={{ background: primary ? 'var(--accent)' : '#fff', border: primary ? 'none' : '1px solid var(--border)', color: primary ? '#fff' : 'var(--text)', borderRadius: 9, padding: '8px 13px', font: '600 12.5px var(--f)', cursor: 'pointer' }}>{label}</button>
  );

  return (
    <div style={{ padding: '30px 32px 60px', maxWidth: 1360, margin: '0 auto', animation: 'lbp-fade-up .5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ font: '700 30px/1.2 var(--f)', letterSpacing: '-.02em', margin: 0, color: 'var(--text)' }}>Data</h1>
          <div style={{ marginTop: 4, font: '500 13px var(--f)', color: 'var(--text3)' }}>Find the right companies first, then the right people inside them.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {btn('Add data', () => setIntakeOpen(true))}
          {btn('Edit ICP', () => setIcpOpen(true))}
          <a href={exportHref} style={{ background: 'var(--accent)', color: '#fff', borderRadius: 9, padding: '8px 13px', font: '600 12.5px var(--f)', textDecoration: 'none' }}>Export CSV</a>
        </div>
      </div>

      {/* assistant strip (sample) */}
      <div style={{ display: 'flex', gap: 12, background: 'var(--accentl)', border: '1px solid #CBE0F5', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
        <span style={{ width: 30, height: 30, flex: 'none', borderRadius: 8, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M2 14h2M20 14h2M15 13v2M9 13v2" /></svg>
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><span style={{ font: '700 11px var(--f)', color: 'var(--accentd)' }}>Where to get this data</span><span style={{ font: '700 8.5px var(--f)', letterSpacing: '.05em', color: 'var(--text3)', background: '#fff', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 6px' }}>SAMPLE · /v1/assist</span></div>
          <div style={{ font: '400 13px/1.55 var(--f)', color: 'var(--text2)' }}>These look like behavioral-health orgs in Arizona. Best free source: SAMHSA locator + NPI registry — that covers most of them at $0. If you need direct emails, Hunter is the cheapest paid step here (~$0.04/lookup).</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
            {['SAMHSA locator', 'NPI registry'].map((fs) => (
              <span key={fs} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '600 11px var(--f)', color: 'var(--green)', background: 'var(--greenl)', border: '1px solid #BFE6CE', padding: '4px 10px', borderRadius: 999 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />free · {fs}</span>
            ))}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '600 11px var(--f)', color: 'var(--amber)', background: 'var(--amberl)', border: '1px solid #EEC981', padding: '4px 10px', borderRadius: 999 }}>Hunter · $0.04/lookup</span>
          </div>
        </div>
      </div>

      {/* mode tabs + saved views */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 11, padding: 3 }}>
          {([['people', 'People'], ['accounts', 'Companies']] as const).map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)} style={{ font: '700 12.5px var(--f)', padding: '8px 16px', borderRadius: 9, cursor: 'pointer', border: 'none', background: mode === m ? 'var(--navy)' : 'transparent', color: mode === m ? '#fff' : 'var(--text2)' }}>{label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', flex: 1 }}>
          <span style={{ font: '700 10px var(--f)', letterSpacing: '.08em', color: 'var(--text3)', alignSelf: 'center', whiteSpace: 'nowrap' }}>SAVED VIEWS</span>
          {['All contacts', 'AZ construction owners', 'Healthcare · deliverable', 'Elite fit (90+)'].map((v) => (
            <button key={v} onClick={() => setSavedView(v)} style={{ font: '600 12px var(--f)', padding: '6px 12px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap', background: savedView === v ? 'var(--accentl)' : '#fff', color: savedView === v ? 'var(--accentd)' : 'var(--text2)', border: `1px solid ${savedView === v ? 'var(--accent)' : 'var(--border)'}` }}>{v}</button>
          ))}
        </div>
      </div>

      {/* search + industry filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '0 12px', flex: 1, minWidth: 220, maxWidth: 320 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, company, role…" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text)', font: '500 13px var(--f)', padding: '10px 0' }} />
        </div>
        <span style={{ font: '700 10px var(--f)', letterSpacing: '.08em', color: 'var(--green)' }}>ACCOUNT</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setParam('industry', 'all')} style={lchip(filters.industry === 'all')}>All industries</button>
          {(industries.length ? industries : VERTICALS.slice()).map((d) => (
            <button key={d} onClick={() => setParam('industry', d)} style={lchip(filters.industry === d)}>{d}</button>
          ))}
        </div>
      </div>

      {mode === 'people' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ font: '700 10px var(--f)', letterSpacing: '.08em', color: 'var(--accent)' }}>LEAD</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['all', 'All'], ['Owner', 'Owner'], ['CXO', 'CXO'], ['VP', 'VP'], ['Director', 'Director'], ['Manager', 'Manager']].map(([v, l]) => (
              <button key={v} onClick={() => setFSeniority(v)} style={lchip(fSeniority === v)}>{l}</button>
            ))}
          </div>
          <div style={{ width: 1, height: 22, background: 'var(--border)' }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['all', 'Any fit'], ['qualified', 'Qualified 60+'], ['strong', 'Strong 75+'], ['elite', 'Elite 90+']].map(([v, l]) => (
              <button key={v} onClick={() => setFScore(v)} style={lchip(fScore === v)}>{l}</button>
            ))}
          </div>
          <button onClick={() => setFHasPhone((v) => !v)} style={lchip(fHasPhone)}>Has phone</button>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['all', 'All'], ['deliverable', 'Deliverable'], ['risky', 'Risky'], ['guess', 'Guess']].map(([v, l]) => (
              <button key={v} onClick={() => setParam('email', v)} style={lchip(filters.email === v)}>{l}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['all', 'All tiers'], ['A', 'A'], ['B', 'B'], ['C', 'C']].map(([v, l]) => (
              <button key={v} onClick={() => setParam('tier', v)} style={lchip(filters.tier === v)}>{l}</button>
            ))}
          </div>
        </div>
      )}

      {/* PEOPLE table */}
      {mode === 'people' && (
        <>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.7fr 2.2fr 1.1fr 1fr', gap: 12, padding: '12px 20px', background: 'var(--surf)', borderBottom: '1px solid var(--border)', font: '700 10px var(--f)', letterSpacing: '.08em', color: 'var(--text3)' }}>
              <span>PERSON</span><span>COMPANY</span><span>EMAIL · PROVENANCE</span><span>FIT · INTENT</span><span>PHONE</span>
            </div>
            {filteredContacts.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', font: '500 13px var(--f)', color: 'var(--text3)' }}>No contacts yet. Start a run or add data to populate your workspace.</div>
            ) : (
              filteredContacts.map((p) => {
                const em = esMeta(p.emailStatus);
                const s0 = p.sources[0];
                return (
                  <div key={p.id} onClick={() => setDrawer(p)} style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.7fr 2.2fr 1.1fr 1fr', gap: 12, padding: '12px 20px', borderTop: '1px solid var(--borderl)', cursor: 'pointer', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span style={{ width: 30, height: 30, flex: 'none', borderRadius: 8, background: 'var(--accentl)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 11px var(--f)' }}>{initialsOf(p.name)}</span>
                      <div style={{ minWidth: 0 }}><div style={{ font: '600 13px var(--f)', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div><div style={{ font: '500 11.5px var(--f)', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div></div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <button onClick={(e) => { e.stopPropagation(); setAccount(p.domain); }} style={{ font: '600 12.5px var(--f)', color: 'var(--accentd)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{p.companyName}</button>
                      <div style={{ font: '500 11px var(--f)', color: 'var(--text3)' }}>{p.vertical}</div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}><span style={{ fontFamily: 'var(--fm)', fontSize: 11.5, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</span><span style={{ font: '700 10px var(--f)', padding: '2px 8px', borderRadius: 6, color: em.color, background: em.bg }}>{em.label}</span></div>
                      {s0 && <span style={chipStyle(s0.confidence)}>{`${s0.provider} · ${s0.method} · ${s0.confidence.toFixed(2)}`}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}><span style={scoreBadge(p.fit)}>fit {p.fit}</span><span style={scoreBadge(p.intent)}>int {p.intent}</span></div>
                    <div style={{ fontFamily: 'var(--fm)', fontSize: 10.5, color: 'var(--text3)' }}>{p.phone ?? '—'}</div>
                  </div>
                );
              })
            )}
          </div>
          <div style={{ marginTop: 12, font: '500 12px var(--f)', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--red)' }} />Guesses are labeled and gated out of delivery until verified. Fit is structural; intent is timing — kept separate on purpose.</div>
        </>
      )}

      {/* COMPANIES table */}
      {mode === 'accounts' && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1.4fr 1fr 1fr 1.2fr', gap: 12, padding: '12px 20px', background: 'var(--surf)', borderBottom: '1px solid var(--border)', font: '700 10px var(--f)', letterSpacing: '.08em', color: 'var(--text3)' }}>
            <span>COMPANY</span><span>INDUSTRY</span><span>SIZE</span><span>PEOPLE</span><span>FIT · INTENT</span>
          </div>
          {filteredCompanies.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', font: '500 13px var(--f)', color: 'var(--text3)' }}>No companies yet.</div>
          ) : (
            filteredCompanies.map((a) => (
              <div key={a.id} onClick={() => setAccount(a.domain)} style={{ display: 'grid', gridTemplateColumns: '2.4fr 1.4fr 1fr 1fr 1.2fr', gap: 12, padding: '13px 20px', borderTop: '1px solid var(--borderl)', cursor: 'pointer', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{ width: 32, height: 32, flex: 'none', borderRadius: 8, background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 11px var(--f)' }}>{initialsOf(a.name)}</span>
                  <div style={{ minWidth: 0 }}><div style={{ font: '600 13px var(--f)', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div><div style={{ fontFamily: 'var(--fm)', fontSize: 10.5, color: 'var(--text3)' }}>{a.domain}</div></div>
                </div>
                <div style={{ font: '500 12.5px var(--f)', color: 'var(--text2)' }}>{a.industry ?? '—'}</div>
                <div style={{ font: '500 12px var(--f)', color: 'var(--text2)' }}>{a.employees ?? '—'} emp</div>
                <div style={{ font: '600 13px var(--f)', color: 'var(--text)' }}>{countsByDomain[a.domain] ?? 0}</div>
                <div style={{ display: 'flex', gap: 6 }}><span style={scoreBadge(a.fit)}>fit {a.fit}</span><span style={scoreBadge(a.intent)}>int {a.intent}</span></div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Account detail drawer */}
      {accountCompany && (
        <>
          <div onClick={() => { setAccount(null); setPersonRow(null); }} style={{ position: 'absolute', inset: 0, background: 'rgba(30,51,72,.3)', zIndex: 42, animation: 'lbp-fade-up .2s ease' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 560, maxWidth: '94vw', background: 'var(--surf)', borderLeft: '1px solid var(--border)', zIndex: 43, overflowY: 'auto', boxShadow: '-24px 0 60px rgba(30,51,72,.18)' }}>
            <div style={{ background: '#fff', padding: 22, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                  <span style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 17px var(--f)' }}>{initialsOf(accountCompany.name)}</span>
                  <div><div style={{ font: '700 19px var(--f)', color: 'var(--text)' }}>{accountCompany.name}</div><div style={{ fontFamily: 'var(--fm)', fontSize: 12, color: 'var(--text3)' }}>{accountCompany.domain}</div></div>
                </div>
                <button onClick={() => setAccount(null)} style={{ background: 'var(--surf)', border: 'none', color: 'var(--text3)', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 15 }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1, background: 'var(--greenl)', border: '1px solid #BFE6CE', borderRadius: 10, padding: '10px 12px' }}><div style={{ font: '800 22px var(--f)', color: 'var(--green)' }}>{accountCompany.fit}</div><div style={{ font: '600 9.5px var(--f)', color: 'var(--text3)', letterSpacing: '.04em' }}>FIT SCORE · STRUCTURAL</div></div>
                <div style={{ flex: 1, background: 'var(--accentl)', border: '1px solid #CBE0F5', borderRadius: 10, padding: '10px 12px' }}><div style={{ font: '800 22px var(--f)', color: 'var(--accentd)' }}>{accountCompany.intent}</div><div style={{ font: '600 9.5px var(--f)', color: 'var(--text3)', letterSpacing: '.04em' }}>INTENT SCORE · TIMING</div></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['INDUSTRY', accountCompany.industry], ['EMPLOYEES', accountCompany.employees], ['REVENUE BAND', accountCompany.revenue], ['HQ', accountCompany.hq], ['TYPE', accountCompany.companyType]].map(([l, v]) => (
                  <div key={l as string}><div style={{ font: '600 9.5px var(--f)', letterSpacing: '.05em', color: 'var(--text3)' }}>{l}</div><div style={{ font: '500 13px var(--f)', color: 'var(--text)', marginTop: 2 }}>{v || '—'}</div></div>
                ))}
                <div><div style={{ font: '600 9.5px var(--f)', letterSpacing: '.05em', color: 'var(--text3)' }}>TECH STACK</div><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>{accountCompany.tech.map((tk) => <span key={tk} style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--text2)', background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 7px' }}>{tk}</span>)}</div></div>
              </div>
            </div>
            <div style={{ padding: '18px 22px' }}>
              <div style={{ font: '700 10px var(--f)', letterSpacing: '.1em', color: 'var(--text3)', marginBottom: 12 }}>PEOPLE AT THIS COMPANY · {accountPeople.length}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {accountPeople.map((p) => {
                  const em = esMeta(p.emailStatus);
                  const s0 = p.sources[0];
                  const expanded = personRow === p.id;
                  return (
                    <div key={p.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                      <button onClick={() => setPersonRow(expanded ? null : p.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                        <span style={{ width: 30, height: 30, flex: 'none', borderRadius: 8, background: 'var(--accentl)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 11px var(--f)' }}>{initialsOf(p.name)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: '600 13px var(--f)', color: 'var(--text)' }}>{p.name}</div><div style={{ font: '500 11px var(--f)', color: 'var(--text3)' }}>{p.title} · {seniorityOf(p.title)}</div></div>
                        <div style={{ display: 'flex', gap: 5, flex: 'none' }}><span style={scoreBadge(p.fit)}>fit {p.fit}</span><span style={scoreBadge(p.intent)}>int {p.intent}</span></div>
                      </button>
                      <div style={{ padding: '0 14px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', paddingBottom: 8 }}><span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--text)' }}>{p.email}</span><span style={{ font: '700 10px var(--f)', padding: '2px 8px', borderRadius: 6, color: em.color, background: em.bg }}>{em.label}</span>{s0 && <span style={chipStyle(s0.confidence)}>{`${s0.provider} · ${s0.method} · ${s0.confidence.toFixed(2)}`}</span>}<span style={{ fontFamily: 'var(--fm)', fontSize: 10.5, color: 'var(--text3)' }}>{p.phone ?? '—'}</span></div>
                        {expanded && (
                          <div style={{ borderTop: '1px solid var(--borderl)', paddingTop: 12, position: 'relative', paddingLeft: 20, marginLeft: 2 }}>
                            <div style={{ position: 'absolute', left: 5, top: 16, bottom: 6, width: 2, background: 'var(--border)' }} />
                            {buildEvidence(p).map((e, i) => (
                              <div key={i} style={{ position: 'relative', marginBottom: 12 }}>
                                <span style={{ position: 'absolute', left: -19, top: 3, width: 9, height: 9, borderRadius: '50%', background: e.color, border: '2px solid #fff' }} />
                                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}><span style={{ font: '700 9px var(--f)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text3)' }}>{e.field}</span><span style={{ fontFamily: 'var(--fm)', fontSize: 9.5, color: 'var(--text3)' }}>{e.time}</span></div>
                                <div style={{ font: '500 12.5px var(--f)', color: 'var(--text)', margin: '2px 0 5px' }}>{e.value}</div>
                                <span style={{ display: 'inline-flex', fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--text2)', background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 7px' }}>{e.meta}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Contact drawer */}
      {drawer && (() => {
        const em = esMeta(drawer.emailStatus), tm = tierMeta(drawer.tier);
        return (
          <>
            <div onClick={() => setDrawer(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(30,51,72,.28)', zIndex: 40, animation: 'lbp-fade-up .2s ease' }} />
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 460, background: '#fff', borderLeft: '1px solid var(--border)', zIndex: 41, overflowY: 'auto', boxShadow: '-24px 0 60px rgba(30,51,72,.15)' }}>
              <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid var(--borderl)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--accentl)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 15px var(--f)' }}>{initialsOf(drawer.name)}</span>
                    <div><div style={{ font: '700 17px var(--f)', color: 'var(--text)' }}>{drawer.name}</div><div style={{ font: '500 12.5px var(--f)', color: 'var(--text3)' }}>{drawer.title} · {drawer.companyName}</div></div>
                  </div>
                  <button onClick={() => setDrawer(null)} style={{ background: 'var(--surf)', border: 'none', color: 'var(--text3)', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 15 }}>✕</button>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <div style={{ flex: 1, background: 'var(--surf)', border: '1px solid var(--borderl)', borderRadius: 10, padding: '9px 11px' }}><div style={{ font: '600 9.5px var(--f)', letterSpacing: '.05em', color: 'var(--text3)' }}>EMAIL</div><div style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--text)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{drawer.email}</div><span style={{ font: '700 11px var(--f)', padding: '3px 10px', borderRadius: 7, color: em.color, background: em.bg, marginTop: 6, display: 'inline-block' }}>{em.label}</span></div>
                  <div style={{ background: 'var(--surf)', border: '1px solid var(--borderl)', borderRadius: 10, padding: '9px 11px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><span style={{ font: '700 13px var(--f)', width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, color: tm.color, background: tm.bg }}>{drawer.tier}</span><div style={{ font: '700 15px var(--f)', marginTop: 4, color: 'var(--text)' }}>{drawer.fit}</div></div>
                </div>
              </div>
              <div style={{ padding: '18px 22px' }}>
                <div style={{ font: '700 10px var(--f)', letterSpacing: '.1em', color: 'var(--text3)', marginBottom: 14 }}>CONTACT EVIDENCE — EVERY VALUE, WHERE IT CAME FROM</div>
                <div style={{ position: 'relative', paddingLeft: 20 }}>
                  <div style={{ position: 'absolute', left: 5, top: 6, bottom: 6, width: 2, background: 'var(--border)' }} />
                  {buildEvidence(drawer).map((e, i) => (
                    <div key={i} style={{ position: 'relative', marginBottom: 16 }}>
                      <span style={{ position: 'absolute', left: -19, top: 3, width: 10, height: 10, borderRadius: '50%', background: e.color, border: '2px solid #fff' }} />
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}><span style={{ font: '700 9.5px var(--f)', letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text3)' }}>{e.field}</span><span style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--text3)' }}>{e.time}</span></div>
                      <div style={{ font: '500 13px var(--f)', color: 'var(--text)', marginTop: 3 }}>{e.value}</div>
                      <div style={{ display: 'inline-flex', marginTop: 6, fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--text2)', background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px' }}>{e.meta}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: '14px 22px 0' }}><button onClick={() => setProvPickFor(drawer.name)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--greenl)', border: '1px solid #BFE6CE', color: 'var(--green)', borderRadius: 10, padding: 10, font: '600 12.5px var(--f)', cursor: 'pointer' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>Find a better email with…</button></div>
              <div style={{ padding: '16px 22px', borderTop: '1px solid var(--borderl)', display: 'flex', gap: 8, position: 'sticky', bottom: 0, background: '#fff', marginTop: 14 }}>
                <button style={{ flex: 1, background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: 9, padding: 10, font: '600 12.5px var(--f)', cursor: 'pointer' }}>Draft outreach</button>
                <button style={{ flex: 1, background: '#fff', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 9, padding: 10, font: '600 12.5px var(--f)', cursor: 'pointer' }}>Push to CRM</button>
                <button style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 9, padding: '10px 12px', font: '600 12.5px var(--f)', cursor: 'pointer' }}>Re-verify</button>
              </div>
            </div>
          </>
        );
      })()}

      {/* ICP editor modal */}
      {icpOpen && <IcpModal icp={icp} onClose={() => setIcpOpen(false)} />}

      {/* Intake modal */}
      {intakeOpen && <IntakeModal onClose={() => setIntakeOpen(false)} />}

      {/* Provider picker */}
      {provPickFor && (
        <div onClick={() => setProvPickFor(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(30,51,72,.35)', zIndex: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'lbp-fade-up .2s ease' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 400, maxWidth: '100%', background: '#fff', borderRadius: 16, boxShadow: '0 30px 70px rgba(30,51,72,.3)', padding: 22 }}>
            <div style={{ font: '700 15px var(--f)', color: 'var(--text)', marginBottom: 4 }}>Find this email with</div>
            <div style={{ font: '400 12.5px var(--f)', color: 'var(--text3)', marginBottom: 16 }}>Free options first. Only your connected, key-valid providers are shown.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[{ name: 'free: pattern + verify', cost: '$0', free: true }, { name: 'Hunter', cost: '$0.04', free: false }, { name: 'Apollo', cost: '$0.03', free: false }].map((o) => (
                <button key={o.name} onClick={() => setProvPickFor(null)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 7, font: '600 12px var(--f)', padding: '7px 12px', borderRadius: 9, cursor: 'pointer', width: '100%', border: `1px solid ${o.free ? '#BFE6CE' : '#EEC981'}`, background: o.free ? 'var(--greenl)' : 'var(--amberl)', color: o.free ? 'var(--green)' : 'var(--amber)' }}>{o.name}<span style={{ fontFamily: 'var(--fm)', fontSize: 11 }}>{o.cost}</span></button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ICP editor modal
// ---------------------------------------------------------------------------

function IcpModal({ icp, onClose }: { icp: IcpProfile | null; onClose: () => void }) {
  const tag = (label: string, color: 'green' | 'accent' | 'red'): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, font: '600 12px var(--f)', padding: '6px 11px', borderRadius: 8,
    background: color === 'green' ? 'var(--greenl)' : color === 'red' ? 'var(--redl)' : 'var(--accentl)',
    color: color === 'green' ? 'var(--green)' : color === 'red' ? 'var(--red)' : 'var(--accentd)',
    border: `1px solid ${color === 'green' ? '#BFE6CE' : color === 'red' ? '#F0C2C2' : '#CBE0F5'}`,
  });
  const industries = icp?.industries ?? ['Construction', 'Healthcare'];
  const signals = icp?.signals ?? ['hiring', 'recent funding'];
  const seniority = icp?.seniority ?? ['Owner', 'CXO', 'Director'];
  const functions = icp?.functions ?? ['Operations', 'Sales'];
  const disqualifiers = (icp?.disqualifiers ?? 'staffing agency; franchise HQ; under 5 employees').split(';').map((s) => s.trim()).filter(Boolean);
  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', marginTop: 5, border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', font: '500 13px var(--f)', outline: 'none' };

  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(30,51,72,.35)', zIndex: 44, animation: 'lbp-fade-up .2s ease' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 600, maxWidth: '96vw', background: 'var(--surf)', borderLeft: '1px solid var(--border)', zIndex: 45, overflowY: 'auto', boxShadow: '-24px 0 60px rgba(30,51,72,.2)' }}>
        <div style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid var(--border)', padding: '20px 24px', zIndex: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div><div style={{ font: '700 19px var(--f)', color: 'var(--text)' }}>Ideal customer profile</div><div style={{ font: '500 12.5px var(--f)', color: 'var(--text3)', marginTop: 3 }}>Account-level fit + persona. Fit and intent stay separate scores.</div></div>
          <button onClick={onClose} style={{ background: 'var(--surf)', border: 'none', color: 'var(--text3)', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 15 }}>✕</button>
        </div>
        <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <div style={{ font: '700 11px var(--f)', letterSpacing: '.08em', color: 'var(--green)', marginBottom: 12 }}>FIRMOGRAPHIC FIT</div>
            <div style={{ font: '600 11px var(--f)', color: 'var(--text3)', marginBottom: 6 }}>Industry / vertical</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>{industries.map((t) => <span key={t} style={tag(t, 'accent')}>{t}<span style={{ opacity: 0.6 }}>✕</span></span>)}<button style={{ font: '600 12px var(--f)', color: 'var(--accent)', background: '#fff', border: '1px dashed var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>+ Add</button></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ font: '600 11px var(--f)', color: 'var(--text3)' }}>Employees min<input defaultValue={icp?.empMin ?? 10} style={inp} /></label>
              <label style={{ font: '600 11px var(--f)', color: 'var(--text3)' }}>Employees max<input defaultValue={icp?.empMax ?? 500} style={inp} /></label>
              <label style={{ font: '600 11px var(--f)', color: 'var(--text3)' }}>Revenue band<input defaultValue={icp?.revBand ?? '$1M–$50M'} style={inp} /></label>
              <label style={{ font: '600 11px var(--f)', color: 'var(--text3)' }}>Geography<input defaultValue={icp?.geo ?? 'Arizona'} style={inp} /></label>
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <div style={{ font: '700 11px var(--f)', letterSpacing: '.08em', color: 'var(--accent)', marginBottom: 12 }}>TECHNOGRAPHIC</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ font: '600 11px var(--f)', color: 'var(--text3)' }}>Tech stack contains<input defaultValue={icp?.techHas ?? ''} placeholder="e.g. Salesforce" style={inp} /></label>
              <label style={{ font: '600 11px var(--f)', color: 'var(--text3)' }}>Doesn&apos;t contain<input defaultValue={icp?.techNot ?? 'WordPress'} style={inp} /></label>
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <div style={{ font: '700 11px var(--f)', letterSpacing: '.08em', color: 'var(--accent)', marginBottom: 12 }}>BEHAVIORAL SIGNALS · DRIVES INTENT</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{signals.map((t) => <span key={t} style={tag(t, 'accent')}>{t}<span style={{ opacity: 0.6 }}>✕</span></span>)}<button style={{ font: '600 12px var(--f)', color: 'var(--accent)', background: '#fff', border: '1px dashed var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>+ Add</button></div>
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <div style={{ font: '700 11px var(--f)', letterSpacing: '.08em', color: 'var(--accent)', marginBottom: 12 }}>PERSONA FIT</div>
            <div style={{ font: '600 11px var(--f)', color: 'var(--text3)', marginBottom: 6 }}>Seniority</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>{seniority.map((t) => <span key={t} style={tag(t, 'accent')}>{t}</span>)}</div>
            <div style={{ font: '600 11px var(--f)', color: 'var(--text3)', marginBottom: 6 }}>Functions</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>{functions.map((t) => <span key={t} style={tag(t, 'accent')}>{t}</span>)}</div>
            <label style={{ font: '600 11px var(--f)', color: 'var(--text3)' }}>Title keywords (Boolean OK)<input defaultValue={icp?.titleKeywords ?? '(owner OR "operations director") NOT assistant'} style={{ ...inp, fontFamily: 'var(--fm)', fontSize: 12 }} /></label>
          </div>
          <div style={{ background: '#fff', border: '1px solid #F0C2C2', borderRadius: 14, padding: 18 }}>
            <div style={{ font: '700 11px var(--f)', letterSpacing: '.08em', color: 'var(--red)', marginBottom: 6 }}>NEGATIVE / DISQUALIFIERS</div>
            <div style={{ font: '400 12px/1.5 var(--f)', color: 'var(--text2)', marginBottom: 12 }}>Red flags that exclude an account even if it matches everything else. The most valuable and most-often-missing part.</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{disqualifiers.map((d) => <span key={d} style={tag(d, 'red')}>{d}<span style={{ opacity: 0.6 }}>✕</span></span>)}<button style={{ font: '600 12px var(--f)', color: 'var(--red)', background: '#fff', border: '1px dashed #F0C2C2', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>+ Add</button></div>
          </div>
          <div style={{ display: 'flex', gap: 10, position: 'sticky', bottom: 0, background: 'var(--surf)', paddingTop: 8 }}>
            <button onClick={onClose} style={{ flex: 1, font: '600 13px var(--f)', color: '#fff', background: 'var(--accent)', border: 'none', borderRadius: 10, padding: 12, cursor: 'pointer' }}>Save ICP</button>
            <button onClick={onClose} style={{ font: '600 13px var(--f)', color: 'var(--text2)', background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 18px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Intake modal
// ---------------------------------------------------------------------------

function IntakeModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [tab, setTab] = useState<'company' | 'person' | 'csv' | 'doc'>('company');
  const [csvStep, setCsvStep] = useState<'upload' | 'preview'>('upload');
  const [domain, setDomain] = useState('');
  const [personName, setPersonName] = useState('');
  const [busy, setBusy] = useState(false);

  async function addAndRun() {
    if (busy) return;
    setBusy(true);
    try {
      const input =
        tab === 'company'
          ? { kind: 'company' as const, domain: domain.trim() || 'acme.com' }
          : { kind: 'person' as const, name: personName.trim() || 'Jane Doe', domain: domain.trim() || 'acme.com' };
      await fetch('/api/runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile: 'free-max', input }) });
      onClose();
      router.push('/app');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const tabBtn = (id: typeof tab, label: string, soon = false) => (
    <button key={id} onClick={() => setTab(id)} style={{ font: '600 12.5px var(--f)', padding: '9px 14px', borderRadius: 9, cursor: 'pointer', border: `1px solid ${tab === id ? 'var(--accent)' : 'var(--border)'}`, background: tab === id ? 'var(--accentl)' : '#fff', color: tab === id ? 'var(--accentd)' : 'var(--text2)' }}>{label}{soon && <span style={{ font: '700 8px var(--f)', color: 'var(--amber)', background: 'var(--amberl)', borderRadius: 4, padding: '1px 5px', marginLeft: 6 }}>SOON</span>}</button>
  );
  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', marginTop: 6, border: '1px solid var(--border)', borderRadius: 10, padding: '11px 13px', font: '500 13.5px var(--f)', outline: 'none' };
  const csvMap = [['Company', 'company_name'], ['Website', 'domain'], ['First name', 'first_name'], ['Contact', 'full_name'], ['Email', 'email'], ['City', 'geo_city']];

  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(30,51,72,.35)', zIndex: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'lbp-fade-up .2s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', background: '#fff', borderRadius: 18, boxShadow: '0 30px 70px rgba(30,51,72,.3)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div style={{ font: '700 17px var(--f)', color: 'var(--text)' }}>Add data</div><button onClick={onClose} style={{ background: 'var(--surf)', border: 'none', color: 'var(--text3)', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 15 }}>✕</button></div>
        <div style={{ padding: '18px 24px' }}>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 18 }}>{tabBtn('company', 'Single company')}{tabBtn('person', 'Single person')}{tabBtn('csv', 'CSV upload')}{tabBtn('doc', 'Doc / paste', true)}</div>
          {tab === 'company' && (
            <>
              <label style={{ font: '600 12px var(--f)', color: 'var(--text2)' }}>Company domain or name<input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="acme.com  ·  or  ·  Acme Corp" style={inp} /></label>
              <div style={{ font: '400 12px/1.5 var(--f)', color: 'var(--text3)', marginTop: 10 }}>We resolve the website, read its public pages, and pull the people — free sources first.</div>
            </>
          )}
          {tab === 'person' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ font: '600 12px var(--f)', color: 'var(--text2)' }}>Full name<input value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="Jane Doe" style={inp} /></label>
              <label style={{ font: '600 12px var(--f)', color: 'var(--text2)' }}>Company<input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="acme.com" style={inp} /></label>
            </div>
          )}
          {tab === 'csv' && csvStep === 'upload' && (
            <div style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: 32, textAlign: 'center', background: 'var(--surf)' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.6" style={{ marginBottom: 10 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
              <div style={{ font: '600 13.5px var(--f)', color: 'var(--text)' }}>Drop a CSV, or browse</div>
              <div style={{ font: '400 12px var(--f)', color: 'var(--text3)', marginTop: 4 }}>We&apos;ll map your columns, preview, and dedupe before importing.</div>
              <button onClick={() => setCsvStep('preview')} style={{ marginTop: 14, font: '600 12.5px var(--f)', color: '#fff', background: 'var(--accent)', border: 'none', borderRadius: 9, padding: '9px 16px', cursor: 'pointer' }}>Use sample.csv →</button>
            </div>
          )}
          {tab === 'csv' && csvStep === 'preview' && (
            <>
              <div style={{ font: '600 11px var(--f)', letterSpacing: '.05em', color: 'var(--text3)', marginBottom: 10 }}>MAP YOUR COLUMNS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {csvMap.map(([their, ours]) => (
                  <div key={their} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ flex: 1, font: '600 12.5px var(--f)', color: 'var(--text)', background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 11px' }}>{their}</span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg><span style={{ flex: 1, fontFamily: 'var(--fm)', fontSize: 11.5, color: 'var(--accentd)', background: 'var(--accentl)', border: '1px solid #CBE0F5', borderRadius: 8, padding: '8px 11px' }}>{ours}</span></div>
                ))}
              </div>
              <div style={{ font: '400 12px var(--f)', color: 'var(--green)', marginTop: 12 }}>Preview: 240 rows · 8 duplicates will be merged.</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><button onClick={() => setCsvStep('upload')} style={{ font: '600 12.5px var(--f)', color: 'var(--text2)', background: '#fff', border: '1px solid var(--border)', borderRadius: 9, padding: '9px 16px', cursor: 'pointer' }}>Back</button><button onClick={onClose} style={{ font: '600 12.5px var(--f)', color: '#fff', background: 'var(--accent)', border: 'none', borderRadius: 9, padding: '9px 16px', cursor: 'pointer' }}>Import 240 rows</button></div>
            </>
          )}
          {tab === 'doc' && (
            <div style={{ border: '2px dashed #EEC981', borderRadius: 12, padding: 28, textAlign: 'center', background: 'var(--amberl)' }}>
              <span style={{ display: 'inline-block', font: '700 9px var(--f)', letterSpacing: '.06em', color: 'var(--amber)', background: '#fff', border: '1px solid #EEC981', borderRadius: 5, padding: '3px 8px', marginBottom: 10 }}>COMING SOON · /v1/intake/parse</span>
              <div style={{ font: '600 13.5px var(--f)', color: 'var(--text)' }}>Drop a Word doc, PDF, or paste a blob</div>
              <div style={{ font: '400 12px/1.5 var(--f)', color: 'var(--text2)', marginTop: 6 }}>Claude will read it and extract the companies and people. We&apos;ll show you what it found before importing — no fabricated results.</div>
              <button disabled style={{ marginTop: 14, font: '600 12.5px var(--f)', color: 'var(--text3)', background: '#fff', border: '1px solid var(--border)', borderRadius: 9, padding: '9px 16px', cursor: 'not-allowed' }}>Not wired yet</button>
            </div>
          )}
          {(tab === 'company' || tab === 'person') && (
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}><button onClick={addAndRun} disabled={busy} style={{ flex: 1, font: '600 13px var(--f)', color: '#fff', background: 'var(--accent)', border: 'none', borderRadius: 10, padding: 11, cursor: 'pointer' }}>Add &amp; run</button><button onClick={onClose} style={{ font: '600 13px var(--f)', color: 'var(--text2)', background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 18px', cursor: 'pointer' }}>Cancel</button></div>
          )}
        </div>
      </div>
    </div>
  );
}
