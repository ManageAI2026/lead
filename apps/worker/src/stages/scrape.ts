/**
 * Stage 2 — scrape. Fetches the target's /team, /about, /contact and / pages.
 * Plain fetch first; if the combined text is thin (JS-rendered site), retry the
 * emptiest page through Playwright. Degrades gracefully: if nothing can be
 * fetched (network/Playwright unavailable) it returns an empty bundle and the
 * caller marks the target repairing→running once.
 */

import { scrapeFetch } from '../adapters/scrape/fetch.js';
import { scrapePlaywright } from '../adapters/scrape/playwright.js';
import type { Log } from '../log.js';

const PATHS = ['/team', '/about', '/contact', '/', '/about-us', '/our-team', '/staff', '/leadership'];
const THIN_TEXT = 400; // chars below which we suspect a JS-rendered page

export interface ScrapeBundle {
  text: string;
  mailtos: string[];
  pages: number;
  via: string[];
}

export async function runScrape(domain: string, log: Log): Promise<ScrapeBundle> {
  const texts: string[] = [];
  const mailtos = new Set<string>();
  const via = new Set<string>();
  let pages = 0;
  let thinnest: { url: string; len: number } | null = null;

  for (const path of PATHS) {
    const url = `https://${domain}${path}`;
    const r = await scrapeFetch.scrape(url, log);
    if (!r) {
      // Only bother remembering / and /team for a Playwright retry.
      if (path === '/' || path === '/team') {
        if (!thinnest) thinnest = { url, len: 0 };
      }
      continue;
    }
    pages++;
    via.add(r.via);
    if (r.text) texts.push(r.text);
    for (const m of r.mailtos) mailtos.add(m);
    if (!thinnest || r.text.length < thinnest.len) thinnest = { url, len: r.text.length };
  }

  const total = texts.join('\n').length;
  // If everything was thin/blocked, try one Playwright render of the best candidate.
  if (total < THIN_TEXT && thinnest) {
    const r = await scrapePlaywright.scrape(thinnest.url, log);
    if (r) {
      pages++;
      via.add(r.via);
      if (r.text) texts.push(r.text);
      for (const m of r.mailtos) mailtos.add(m);
    }
  }

  const bundle: ScrapeBundle = {
    text: texts.join('\n\n'),
    mailtos: [...mailtos],
    pages,
    via: [...via],
  };
  if (bundle.pages === 0) log.warn(`scrape found no reachable pages for ${domain}`);
  else log.info(`scrape ${domain}: ${bundle.pages} pages, ${bundle.text.length} chars, ${bundle.mailtos.length} emails via ${bundle.via.join('+')}`);
  return bundle;
}
