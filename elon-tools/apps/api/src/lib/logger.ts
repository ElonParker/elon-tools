type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  ts: string;
  level: LogLevel;
  msg: string;
  request_id?: string;
  [key: string]: unknown;
}

/** Fields that must NEVER be logged */
const REDACTED_KEYS = new Set([
  'token', 'token_hash', 'password', 'secret', 'api_key',
  'ciphertext', 'iv', 'tag', 'session_token', 'cookie',
]);

function redact(obj: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (REDACTED_KEYS.has(k.toLowerCase())) {
      clean[k] = '[REDACTED]';
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

function emit(level: LogLevel, msg: string, extra: Record<string, unknown> = {}) {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...redact(extra),
  };
  const fn = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;
  fn(JSON.stringify(entry));
}

export const logger = {
  debug: (msg: string, extra?: Record<string, unknown>) => emit('DEBUG', msg, extra),
  info:  (msg: string, extra?: Record<string, unknown>) => emit('INFO', msg, extra),
  warn:  (msg: string, extra?: Record<string, unknown>) => emit('WARN', msg, extra),
  error: (msg: string, extra?: Record<string, unknown>) => emit('ERROR', msg, extra),
};
