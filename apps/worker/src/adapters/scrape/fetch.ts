/**
 * Plain-fetch scraper — REAL. Fast static fetch for server-rendered pages.
 * Strips scripts/styles, collapses whitespace to visible text, and harvests
 * mailto: links. Returns null on network error / non-HTML so the caller can
 * fall back to Playwright.
 */

import type { ScrapeAdapter, ScrapeResult } from '../types.js';
import type { Log } from '../../log.js';

const UA =
  'Mozilla/5.0 (compatible; LeadBoosterProBot/1.0; +https://leadboosterpro.com/bot)';

/** Extract visible text + mailto links from raw HTML (no DOM needed). */
export function htmlToText(html: string): { text: string; mailtos: string[] } {
  const mailtos = new Set<string>();
  for (const m of html.matchAll(/mailto:([^"'>?\s]+)/gi)) {
    const addr = decodeURIComponent(m[1]).trim().toLowerCase();
    if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(addr)) mailtos.add(addr);
  }
  // Also catch bare emails in text (common on contact pages).
  for (const m of html.matchAll(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
  )) {
    mailtos.add(m[0].toLowerCase());
  }
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { text, mailtos: [...mailtos] };
}

export const scrapeFetch: ScrapeAdapter = {
  provider: 'Plain fetch',
  kind: 'builtin',
  available: () => true,

  async scrape(url: string, log: Log): Promise<ScrapeResult | null> {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
        redirect: 'follow',
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) {
        log.debug(`fetch ${url} → ${res.status}`);
        return null;
      }
      const ctype = res.headers.get('content-type') ?? '';
      if (!ctype.includes('html') && !ctype.includes('text')) {
        log.debug(`fetch ${url} non-html (${ctype})`);
        return null;
      }
      const html = await res.text();
      const { text, mailtos } = htmlToText(html);
      log.path('live', `fetch ${url} ok (${text.length} chars, ${mailtos.length} emails)`);
      return { url, text, mailtos, via: 'fetch' };
    } catch (err) {
      log.debug(`fetch ${url} failed`, err instanceof Error ? err.message : err);
      return null;
    }
  },
};
