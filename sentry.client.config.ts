import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.05,
    environment: process.env.NODE_ENV || 'production',
    // Ignore harmless browser client exceptions
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      'AbortError',
      'NEXT_REDIRECT',
      'NEXT_NOT_FOUND',
    ],
    // Explicitly NO session replay per project rules unless requested
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    beforeSend(event) {
      // Scrub sensitive query parameters and URL tokens
      if (event.request && event.request.url) {
        try {
          const url = new URL(event.request.url);
          url.searchParams.delete('token');
          url.searchParams.delete('signature');
          url.searchParams.delete('otp');
          url.searchParams.delete('key');
          event.request.url = url.toString();
        } catch {
          // ignore parsing error
        }
      }
      return event;
    },
  });
}
