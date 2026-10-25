import 'server-only';
import * as Sentry from '@sentry/nextjs';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITIES: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Sensitive object keys that must always be redacted
const SENSITIVE_KEYS = new Set([
  'password',
  'passwd',
  'pass',
  'token',
  'secret',
  'authorization',
  'auth',
  'cookie',
  'cookies',
  'set-cookie',
  'key',
  'apikey',
  'api_key',
  'otp',
  'pin',
  'cvv',
  'cvc',
  'card',
  'cardnumber',
  'card_number',
  'creditcard',
  'privatekey',
  'private_key',
  'databaseurl',
  'database_url',
  'webhooksecret',
  'signature',
  'razorpay_signature',
  'access_token',
  'refresh_token',
  'sessiontoken',
  'clientsecret',
  'client_secret',
]);

// Value regex patterns that indicate sensitive secrets or PII
const SENSITIVE_PATTERNS = [
  // JWT tokens
  { regex: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]*/g, replacement: '[REDACTED_JWT]' },
  // Bearer tokens
  { regex: /Bearer\s+[a-zA-Z0-9._~+/-]+=*/gi, replacement: 'Bearer [REDACTED]' },
  // Postgres connection strings with passwords
  { regex: /postgres(?:ql)?:\/\/([^:]+):([^@]+)@/gi, replacement: 'postgresql://$1:[REDACTED]@' },
  // Indian 10-digit mobile phone numbers
  { regex: /(?:\+91[\-\s]?)?[6-9]\d{9}/g, replacement: '[REDACTED_PHONE]' },
  // Email addresses
  { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[REDACTED_EMAIL]' },
];

export interface LogContext {
  requestId?: string;
  orderId?: string;
  userId?: string;
  durationMs?: number;
  status?: number | string;
  service?: string;
  error?: any;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  time: string;
  event: string;
  msg?: string;
  requestId?: string;
  orderId?: string;
  userId?: string;
  durationMs?: number;
  status?: number | string;
  service?: string;
  error?: any;
  context?: Record<string, any>;
}

// In-memory throttling cache to prevent runaway log flood without spending Upstash Redis quota
interface ThrottleRecord {
  count: number;
  firstSeen: number;
  lastEmitted: number;
}

const THROTTLE_WINDOW_MS = 60_000; // 60 seconds
const throttleMap = new Map<string, ThrottleRecord>();

// Periodic throttle cleanup to prevent memory growth
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of throttleMap.entries()) {
      if (now - record.lastEmitted > THROTTLE_WINDOW_MS * 2) {
        throttleMap.delete(key);
      }
    }
  }, THROTTLE_WINDOW_MS * 5).unref?.();
}

/**
 * Checks if an error is a Next.js internal control-flow throw
 * (such as redirect(), notFound(), NEXT_REDIRECT, or NEXT_NOT_FOUND).
 * These are normal control flow mechanisms and MUST NEVER be logged as errors.
 */
export function isNextControlFlowError(err: any): boolean {
  if (!err) return false;
  const digest = err?.digest || '';
  const message = err?.message || '';
  return (
    digest.startsWith('NEXT_REDIRECT') ||
    digest.startsWith('NEXT_NOT_FOUND') ||
    message.includes('NEXT_REDIRECT') ||
    message.includes('NEXT_NOT_FOUND')
  );
}

/**
 * Resolves current configured log level from environment
 */
export function getConfiguredLogLevel(): LogLevel {
  const envLevel = (process.env.LOG_LEVEL || '').toLowerCase();
  if (envLevel === 'debug' || envLevel === 'info' || envLevel === 'warn' || envLevel === 'error') {
    return envLevel;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

/**
 * Redacts a string against known secret and PII patterns, and caps length at 200 chars
 */
export function sanitizeString(val: string, maxLen = 200): string {
  if (!val) return val;
  let sanitized = val;

  for (const { regex, replacement } of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(regex, replacement);
  }

  if (sanitized.length > maxLen) {
    return sanitized.slice(0, maxLen - 3) + '...';
  }
  return sanitized;
}

/**
 * Recursively deep-redacts sensitive keys and patterns from objects
 */
export function redact(value: any, depth = 0): any {
  if (depth > 5) return '[MAX_DEPTH_EXCEEDED]';
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: sanitizeString(value.message),
      // Limit stack trace to top 3 frames only
      stack: value.stack
        ? value.stack
            .split('\n')
            .slice(0, 4)
            .map((line) => sanitizeString(line.trim(), 120))
            .join(' -> ')
        : undefined,
    };
  }

  if (Array.isArray(value)) {
    const capped = value.slice(0, 20);
    const result = capped.map((item) => redact(item, depth + 1));
    if (value.length > 20) {
      result.push(`[...${value.length - 20} more items]` as any);
    }
    return result;
  }

  if (typeof value === 'object') {
    const clean: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isSensitiveKey =
        SENSITIVE_KEYS.has(lowerKey) ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('password') ||
        lowerKey.includes('signature') ||
        lowerKey.includes('credential') ||
        lowerKey.includes('cookie') ||
        lowerKey.includes('auth');

      if (isSensitiveKey) {
        clean[key] = '[REDACTED]';
      } else {
        clean[key] = redact(value[key], depth + 1);
      }
    }
    return clean;
  }

  return String(value);
}

class Logger {
  private baseContext: LogContext;

  constructor(baseContext: LogContext = {}) {
    this.baseContext = baseContext;
  }

  /**
   * Spawns a child logger with bound contextual metadata (e.g., requestId, orderId)
   */
  public child(childContext: LogContext): Logger {
    return new Logger({
      ...this.baseContext,
      ...childContext,
    });
  }

  private shouldLog(level: LogLevel): boolean {
    const currentLevel = getConfiguredLogLevel();
    return LOG_LEVEL_PRIORITIES[level] >= LOG_LEVEL_PRIORITIES[currentLevel];
  }

  private checkThrottle(key: string): { allow: boolean; repeatedCount?: number } {
    const now = Date.now();
    const existing = throttleMap.get(key);

    if (!existing) {
      throttleMap.set(key, { count: 1, firstSeen: now, lastEmitted: now });
      return { allow: true };
    }

    if (now - existing.lastEmitted > THROTTLE_WINDOW_MS) {
      const count = existing.count;
      throttleMap.set(key, { count: 1, firstSeen: now, lastEmitted: now });
      return { allow: true, repeatedCount: count > 1 ? count - 1 : undefined };
    }

    existing.count += 1;
    return { allow: false };
  }

  private formatAndEmit(level: LogLevel, event: string, msgOrContext?: string | LogContext, maybeContext?: LogContext) {
    if (!this.shouldLog(level)) return;

    let msg = '';
    let context: LogContext = {};

    if (typeof msgOrContext === 'string') {
      msg = msgOrContext;
      context = maybeContext || {};
    } else if (msgOrContext && typeof msgOrContext === 'object') {
      context = msgOrContext;
    }

    const mergedContext = {
      ...this.baseContext,
      ...context,
    };

    // Ignore Next.js internal control-flow errors
    if (mergedContext.error && isNextControlFlowError(mergedContext.error)) {
      return;
    }

    // Apply rate-limiting / throttling for repeat warnings and errors
    if (level === 'warn' || level === 'error') {
      const throttleKey = `${level}:${event}:${msg || ''}`;
      const { allow, repeatedCount } = this.checkThrottle(throttleKey);
      if (!allow) return;

      if (repeatedCount && repeatedCount > 0) {
        mergedContext.throttledCount = repeatedCount;
      }
    }

    // Extract core correlation identifiers
    const { requestId, orderId, userId, durationMs, status, service, error, ...extra } = mergedContext;

    const entry: LogEntry = {
      level,
      time: new Date().toISOString(),
      event,
    };

    if (msg) entry.msg = sanitizeString(msg);
    if (requestId) entry.requestId = sanitizeString(String(requestId), 64);
    if (orderId) entry.orderId = sanitizeString(String(orderId), 64);
    if (userId) entry.userId = sanitizeString(String(userId), 64);
    if (durationMs !== undefined) entry.durationMs = Number(durationMs);
    if (status !== undefined) entry.status = status;
    if (service) entry.service = sanitizeString(String(service), 64);

    if (error) {
      entry.error = redact(error);
    }

    const cleanedExtra = redact(extra);
    if (cleanedExtra && Object.keys(cleanedExtra).length > 0) {
      entry.context = cleanedExtra;
    }

    const isProd = process.env.NODE_ENV === 'production';

    // Report unexpected server errors to Sentry if configured
    if (level === 'error' && (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)) {
      try {
        if (typeof Sentry.captureException === 'function') {
          const errToCapture = error instanceof Error ? error : new Error(msg || event);
          Sentry.captureException(errToCapture, {
            tags: { event, ...(requestId ? { requestId: String(requestId) } : {}) },
            extra: cleanedExtra,
          });
        }
      } catch {
        // Sentry capture failure should never break logging
      }
    }

    if (isProd) {
      // Production: Emit single-line compact JSON to stdout (Vercel Log Drain format)
      const line = JSON.stringify(entry);
      if (level === 'error') {
        process.stderr.write(line + '\n');
      } else {
        process.stdout.write(line + '\n');
      }
    } else {
      // Development: Readable colorized format
      const color =
        level === 'error'
          ? '\x1b[31m'
          : level === 'warn'
          ? '\x1b[33m'
          : level === 'info'
          ? '\x1b[36m'
          : '\x1b[90m';
      const reset = '\x1b[0m';
      const meta = Object.keys(cleanedExtra).length > 0 ? ` ${JSON.stringify(cleanedExtra)}` : '';
      const errStr = entry.error ? ` [Error: ${entry.error.message || JSON.stringify(entry.error)}]` : '';
      const ids = [
        entry.requestId ? `[req:${entry.requestId}]` : '',
        entry.orderId ? `[order:${entry.orderId}]` : '',
        entry.userId ? `[user:${entry.userId}]` : '',
      ]
        .filter(Boolean)
        .join(' ');
      const out = `${color}[${entry.time}] ${level.toUpperCase()} [${event}]${ids ? ' ' + ids : ''}${reset} ${msg || ''}${meta}${errStr}`;

      if (level === 'error') {
        process.stderr.write(out + '\n');
      } else {
        process.stdout.write(out + '\n');
      }
    }
  }

  public debug(event: string, msgOrContext?: string | LogContext, context?: LogContext) {
    this.formatAndEmit('debug', event, msgOrContext, context);
  }

  public info(event: string, msgOrContext?: string | LogContext, context?: LogContext) {
    this.formatAndEmit('info', event, msgOrContext, context);
  }

  public warn(event: string, msgOrContext?: string | LogContext, context?: LogContext) {
    this.formatAndEmit('warn', event, msgOrContext, context);
  }

  public error(event: string, msgOrContext?: string | LogContext, context?: LogContext) {
    this.formatAndEmit('error', event, msgOrContext, context);
  }
}

// Global root singleton logger instance
export const logger = new Logger();

// Helper to mask phone numbers safely for log visibility without PII breach
export function maskPhone(phone: string): string {
  const clean = (phone || '').replace(/\D/g, '');
  if (clean.length < 4) return '***';
  return `***${clean.slice(-4)}`;
}

// Helper to mask email addresses safely
export function maskEmail(email: string): string {
  const parts = (email || '').split('@');
  if (parts.length !== 2) return '***@***.***';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : '***';
  return `${maskedName}@${domain}`;
}
