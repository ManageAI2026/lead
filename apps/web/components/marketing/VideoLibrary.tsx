'use client';

import { useState } from 'react';
import Link from 'next/link';

interface VideoItem {
  t: string;
  d: string;
  len: string;
}

const VIDEOS: { cat: string; items: VideoItem[] }[] = [
  {
    cat: 'Getting started',
    items: [
      { t: 'Your first run in 5 minutes', d: 'From empty account to a list of verified contacts.', len: '4:12' },
      { t: 'Bring your own keys', d: 'Add an AI key and connect data providers.', len: '3:05' },
      { t: 'Choosing a run profile', d: 'Scraper Only, Free Max, Hunter + Apollo, Full Stack.', len: '2:48' },
    ],
  },
  {
    cat: 'Finding contacts',
    items: [
      { t: 'Point it at one company', d: 'A domain or a name, and what happens next.', len: '2:20' },
      { t: 'Run a territory sweep', d: 'Pick a vertical and a radius, watch the map fill in.', len: '5:36' },
      { t: 'How free-first works', d: 'Free sources before any paid provider.', len: '3:54' },
    ],
  },
  {
    cat: 'Working the data',
    items: [
      { t: 'The contact record & evidence', d: 'Accounts, people, and the evidence timeline.', len: '4:40' },
      { t: 'ICP scoring: fit vs intent', d: 'Two scores, and how to tier off fit.', len: '3:31' },
      { t: 'Two-level filtering', d: 'Right companies first, then the right people.', len: '2:58' },
    ],
  },
  {
    cat: 'Deliver & automate',
    items: [
      { t: 'Export & push to your CRM', d: 'CSV, Pipedrive, HubSpot, ActiveCampaign, webhook.', len: '3:10' },
      { t: 'Suppression & staying clean', d: 'Keep your outreach compliant.', len: '2:41' },
      { t: 'The resident engineer', d: 'Ask it to add a source or fix something.', len: '4:05' },
    ],
  },
];

function PlayIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" stroke="none">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function VideoLibrary() {
  const [open, setOpen] = useState<VideoItem | null>(null);

  return (
    <>
      {VIDEOS.map((g) => (
        <div key={g.cat} style={{ marginBottom: 34 }}>
          <div style={{ font: '700 13px var(--f)', color: 'var(--navy)', marginBottom: 14 }}>{g.cat}</div>
          <div data-cols="" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {g.items.map((v) => (
              <button
                key={v.t}
                onClick={() => setOpen(v)}
                style={{ textAlign: 'left', background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', padding: 0 }}
              >
                <div style={{ position: 'relative', aspectRatio: '16 / 9', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,.14)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PlayIcon />
                  </span>
                  <span style={{ position: 'absolute', bottom: 8, right: 9, fontFamily: 'var(--fm)', fontSize: 10.5, color: '#fff', background: 'rgba(0,0,0,.5)', borderRadius: 5, padding: '2px 6px' }}>{v.len}</span>
                </div>
                <div style={{ padding: '14px 15px' }}>
                  <div style={{ font: '700 13.5px var(--f)', color: 'var(--navy)' }}>{v.t}</div>
                  <div style={{ font: '400 12.5px/1.5 var(--f)', color: 'var(--text2)', marginTop: 4 }}>{v.d}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {open && (
        <div
          onClick={() => setOpen(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,25,40,.7)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 840, background: '#0B1220', border: '2px solid var(--accent)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 0 0 6px rgba(74,143,214,.18),0 30px 70px rgba(0,0,0,.5)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ font: '700 14px var(--f)', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{open.t}</div>
                <div style={{ font: '400 12px var(--f)', color: '#8FA1B5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{open.d}</div>
              </div>
              <button
                onClick={() => setOpen(null)}
                aria-label="Close"
                style={{ flex: 'none', width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>
            <div style={{ position: 'relative', aspectRatio: '16 / 9', background: 'radial-gradient(circle at 50% 45%, #1B2740, #0B1220)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <span style={{ width: 74, height: 74, borderRadius: '50%', background: 'rgba(74,143,214,.2)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PlayIcon size={28} />
                </span>
                <span style={{ font: '600 12.5px var(--f)', color: '#8FA1B5' }}>Video placeholder, {open.len}</span>
              </div>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, background: 'rgba(255,255,255,.12)' }}>
                <div style={{ width: '22%', height: '100%', background: 'var(--accent)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', background: '#0B1220' }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlayIcon size={15} />
              </span>
              <span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: '#8FA1B5' }}>0:00 / {open.len}</span>
              <div style={{ flex: 1 }} />
              <Link href="/signup" style={{ font: '700 12.5px var(--f)', color: '#fff', background: 'var(--accent)', padding: '8px 14px', borderRadius: 9 }}>
                Try it yourself
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
