type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogMeta = Record<string, unknown>;

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveLevel(): LogLevel {
  const raw = (Deno.env.get('LOG_LEVEL') || 'info').toLowerCase();
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') {
    return raw;
  }
  return 'info';
}

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel];
}

function write(level: LogLevel, payload: LogMeta): void {
  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
    return;
  }
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  if (level === 'info') {
    console.info(line);
    return;
  }
  console.debug(line);
}

export function createLogger(scope: string, baseMeta: LogMeta = {}) {
  const minLevel = resolveLevel();

  const log = (level: LogLevel, message: string, meta: LogMeta = {}) => {
    if (!shouldLog(level, minLevel)) return;
    write(level, {
      ts: new Date().toISOString(),
      level,
      scope,
      message,
      ...baseMeta,
      ...meta,
    });
  };

  return {
    debug: (message: string, meta?: LogMeta) => log('debug', message, meta),
    info: (message: string, meta?: LogMeta) => log('info', message, meta),
    warn: (message: string, meta?: LogMeta) => log('warn', message, meta),
    error: (message: string, meta?: LogMeta) => log('error', message, meta),
  };
}
