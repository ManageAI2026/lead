/**
 * Tiny structured logger. Adapters call `log.path()` to record which code path
 * they took (live API vs stub vs skipped-no-key) so operators can see, per run,
 * exactly where every value came from and why paid calls did or did not fire.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

function emit(level: Level, scope: string, msg: string, extra?: unknown) {
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${scope} — ${msg}`;
  const args = extra === undefined ? [line] : [line, extra];
  if (level === 'error') console.error(...args);
  else if (level === 'warn') console.warn(...args);
  else console.log(...args);
}

export function logger(scope: string) {
  return {
    debug: (msg: string, extra?: unknown) => emit('debug', scope, msg, extra),
    info: (msg: string, extra?: unknown) => emit('info', scope, msg, extra),
    warn: (msg: string, extra?: unknown) => emit('warn', scope, msg, extra),
    error: (msg: string, extra?: unknown) => emit('error', scope, msg, extra),
    /** Record which path an adapter took: 'live' | 'stub' | 'skipped'. */
    path: (path: 'live' | 'stub' | 'skipped', why: string) =>
      emit('info', scope, `path=${path} ${why}`),
  };
}

export type Log = ReturnType<typeof logger>;
