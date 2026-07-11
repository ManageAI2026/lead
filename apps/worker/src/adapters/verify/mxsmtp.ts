/**
 * MX + SMTP email verifier — REAL, built-in, free, always on.
 *
 * 1. Resolve MX records for the email's domain via node:dns. No MX → not
 *    deliverable (mxFound=false).
 * 2. OPTIONALLY (SMTP_PROBE=true) open a socket to the top MX host and run a
 *    conservative HELO/MAIL FROM/RCPT TO probe with a short timeout, reading the
 *    RCPT reply code. Many hosts greylist or catch-all, so we are deliberately
 *    conservative: a 250 = accepted, a catch-all probe to a random localpart
 *    that also returns 250 flags catchAll. Never sends DATA; never actually
 *    mails anyone.
 *
 * SMTP probing from most cloud IPs is unreliable/blocked, so it is OFF by
 * default — MX-only still yields a useful risky/unknown signal that
 * deriveEmailStatus consumes.
 */

import { promises as dns } from 'node:dns';
import net from 'node:net';
import { cfg } from '../../config.js';
import type { VerifyAdapter, VerifyOutcome } from '../types.js';
import type { Log } from '../../log.js';

async function resolveMx(domain: string): Promise<string[]> {
  try {
    const records = await dns.resolveMx(domain);
    return records
      .sort((a, b) => a.priority - b.priority)
      .map((r) => r.exchange)
      .filter(Boolean);
  } catch {
    return [];
  }
}

interface ProbeResult {
  accepted: boolean;
  catchAll: boolean;
}

/** Minimal, conservative SMTP RCPT probe. Resolves even on any error. */
function smtpProbe(mxHost: string, email: string): Promise<ProbeResult> {
  const domain = email.split('@')[1];
  const random = `probe-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}@${domain}`;
  return new Promise((resolve) => {
    const socket = net.createConnection(25, mxHost);
    socket.setTimeout(7000);
    let stage = 0;
    let realAccepted = false;
    let catchAll = false;
    const done = (r: ProbeResult) => {
      try {
        socket.write('QUIT\r\n');
      } catch {
        /* ignore */
      }
      socket.destroy();
      resolve(r);
    };
    const send = (line: string) => socket.write(line + '\r\n');

    socket.on('data', (buf) => {
      const reply = buf.toString();
      const code = parseInt(reply.slice(0, 3), 10);
      switch (stage) {
        case 0: // banner
          if (code !== 220) return done({ accepted: false, catchAll: false });
          send(`HELO ${cfg.smtpFrom.split('@')[1] ?? 'leadboosterpro.com'}`);
          stage = 1;
          break;
        case 1: // HELO reply
          send(`MAIL FROM:<${cfg.smtpFrom}>`);
          stage = 2;
          break;
        case 2: // MAIL FROM reply
          send(`RCPT TO:<${email}>`);
          stage = 3;
          break;
        case 3: // RCPT reply for the real address
          realAccepted = code >= 200 && code < 300;
          send(`RCPT TO:<${random}>`);
          stage = 4;
          break;
        case 4: // RCPT reply for the random address → catch-all test
          catchAll = code >= 200 && code < 300;
          done({ accepted: realAccepted, catchAll });
          break;
      }
    });
    socket.on('timeout', () => done({ accepted: false, catchAll: false }));
    socket.on('error', () => done({ accepted: false, catchAll: false }));
  });
}

export const verifyMxSmtp: VerifyAdapter = {
  provider: 'MX / SMTP',
  kind: 'builtin',
  available: () => true,

  async verify(email: string, log: Log): Promise<VerifyOutcome | null> {
    const domain = email.split('@')[1];
    if (!domain) return null;
    const mx = await resolveMx(domain);
    if (mx.length === 0) {
      log.path('live', `no MX for ${domain} — undeliverable`);
      return {
        email,
        mxFound: false,
        accepted: false,
        catchAll: false,
        provider: 'mx',
        method: 'dns',
        confidence: 0.2,
      };
    }
    if (!cfg.smtpProbe) {
      log.path('live', `MX present for ${domain} (SMTP probe off)`);
      return {
        email,
        mxFound: true,
        accepted: false,
        catchAll: false,
        provider: 'mx',
        method: 'dns',
        confidence: 0.6,
      };
    }
    const probe = await smtpProbe(mx[0], email);
    log.path('live', `SMTP probe ${email} accepted=${probe.accepted} catchAll=${probe.catchAll}`);
    return {
      email,
      mxFound: true,
      accepted: probe.accepted,
      catchAll: probe.catchAll,
      provider: 'smtp',
      method: 'probe',
      confidence: probe.accepted && !probe.catchAll ? 0.95 : probe.catchAll ? 0.55 : 0.4,
    };
  },
};
