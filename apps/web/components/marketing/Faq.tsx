'use client';

import { useState } from 'react';

const FAQS: [string, string][] = [
  ['What do I pay for vs. what do my keys pay for?', 'You pay a flat platform fee for the software that finds, verifies, scores, and organizes leads. Your own API keys pay for AI tokens and any paid data providers, billed directly by those providers.'],
  ['Do you resell my data?', 'No. We never resell your data or train on your lists. It’s your data, on your keys.'],
  ['What happens when I hit a cap?', 'Runs pause at the cap and tell you. You can raise the cap, upgrade, or wait for the next cycle, nothing bills silently.'],
  ['Can I run only free sources?', 'Yes, that’s the whole point. Paid providers stay off until you turn them on.'],
  ['Is a credit card required to start?', 'No. Start free and bring your own keys.'],
  ['Which CRMs do you support?', 'Pipedrive, HubSpot, ActiveCampaign, Salesforce, and any endpoint via webhook.'],
  ['Where does the data come from, is it compliant?', 'Public and licensed sources only: company websites, government registries, licensing boards, and search. It does not scrape logged-in social networks.'],
];

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {FAQS.map(([q, a], i) => {
        const isOpen = open === i;
        return (
          <button
            key={q}
            onClick={() => setOpen(isOpen ? -1 : i)}
            style={{ textAlign: 'left', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', cursor: 'pointer', width: '100%' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ font: '600 15px var(--f)', color: 'var(--navy)' }}>{q}</span>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={2} style={{ transition: 'transform .2s', transform: `rotate(${isOpen ? 180 : 0}deg)`, flex: 'none' }}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
            {isOpen && <div style={{ font: '400 14px/1.6 var(--f)', color: 'var(--text2)', marginTop: 12 }}>{a}</div>}
          </button>
        );
      })}
    </div>
  );
}
