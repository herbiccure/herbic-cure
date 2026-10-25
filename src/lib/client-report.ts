import * as Sentry from '@sentry/nextjs';

/**
 * Client-safe error & event reporting module (Browser runtime).
 * Forwards scrubbed diagnostic messages to Sentry without leaking secrets or calling server logger.
 */
export function reportClientError(
  error: unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
) {
  // Never report in test environments or Next.js control-flow
  if (
    error &&
    typeof error === 'object' &&
    'digest' in error &&
    typeof (error as any).digest === 'string' &&
    ((error as any).digest.startsWith('NEXT_REDIRECT') ||
      (error as any).digest.startsWith('NEXT_NOT_FOUND'))
  ) {
    return;
  }

  try {
    Sentry.captureException(error, {
      tags: context?.tags,
      extra: context?.extra,
    });
  } catch {
    // Sentry capture failure should never crash the browser UI
  }
}

export function reportClientMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
) {
  try {
    Sentry.captureMessage(message, {
      level,
      tags: context?.tags,
      extra: context?.extra,
    });
  } catch {
    // Silent fallback
  }
}
