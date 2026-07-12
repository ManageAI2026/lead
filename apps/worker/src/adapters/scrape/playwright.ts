/**
 * Playwright (chromium) scraper — REAL, degrades gracefully. Used as a fallback
 * for JS-rendered pages when plain fetch returns thin/empty text. If
 * playwright-core cannot launch a browser (not installed, no network, sandbox),
 * it logs and returns null — the pipeline continues with whatever fetch found.
 *
 * The browser is launched lazily and reused across targets within the process.
 */

import type { Browser } from 'playwright-core';
import { cfg } from '../../config.js';
import { htmlToText } from './fetch.js';
import type { ScrapeAdapter, ScrapeResult } from '../types.js';
import type { Log } from '../../log.js';

let browserPromise: Promise<Browser | null> | null = null;
let launchFailed = false;

async function getBrowser(log: Log): Promise<Browser | null> {
  if (launchFailed) return null;
  if (!browserPromise) {
    browserPromise = (async () => {
      try {
        const { chromium } = await import('playwright-core');
        const browser = await chromium.launch({
          headless: true,
          executablePath: cfg.chromiumExecutable, // undefined → use bundled/system
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
        log.info('playwright chromium launched');
        return browser;
      } catch (err) {
        launchFailed = true;
        log.warn('playwright unavailable — JS-render fallback disabled', err instanceof Error ? err.message : err);
        return null;
      }
    })();
  }
  return browserPromise;
}

export const scrapePlaywright: ScrapeAdapter = {
  provider: 'Playwright',
  kind: 'builtin',
  available: () => true, // availability is only truly known at launch time

  async scrape(url: string, log: Log): Promise<ScrapeResult | null> {
    const browser = await getBrowser(log);
    if (!browser) {
      log.path('skipped', 'playwright browser not available');
      return null;
    }
    let context;
    try {
      context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (compatible; LeadBoosterProBot/1.0; +https://leadboosterpro.com/bot)',
      });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      // Give client-rendered team lists a moment to hydrate.
      await page.waitForTimeout(1200);
      const html = await page.content();
      const { text, mailtos } = htmlToText(html);
      log.path('live', `playwright ${url} ok (${text.length} chars, ${mailtos.length} emails)`);
      return { url, text, mailtos, via: 'playwright' };
    } catch (err) {
      log.debug(`playwright ${url} failed`, err instanceof Error ? err.message : err);
      return null;
    } finally {
      await context?.close().catch(() => {});
    }
  },
};

/** Close the shared browser on shutdown. */
export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    const b = await browserPromise.catch(() => null);
    await b?.close().catch(() => {});
    browserPromise = null;
  }
}
