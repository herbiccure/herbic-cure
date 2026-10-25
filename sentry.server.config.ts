import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.05,
    environment: process.env.NODE_ENV || 'production',
    // Deduplicate and filter out noisy expected errors
    ignoreErrors: [
      'NEXT_REDIRECT',
      'NEXT_NOT_FOUND',
      'AbortError',
      'ECONNRESET',
      'EPIPE',
      'Connection closed',
    ],
    beforeSend(event, hint) {
      const error = hint?.originalException;

      // Never report Next.js internal control-flow throws
      if (
        error &&
        typeof error === 'object' &&
        'digest' in error &&
        typeof (error as any).digest === 'string' &&
        ((error as any).digest.startsWith('NEXT_REDIRECT') ||
          (error as any).digest.startsWith('NEXT_NOT_FOUND'))
      ) {
        return null;
      }

      // Scrub sensitive headers from request
      if (event.request && event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-razorpay-signature'];
        delete event.request.headers['x-delhivery-token'];
        delete event.request.headers['set-cookie'];
      }

      // Scrub request body to avoid accidental secret leak
      if (event.request && event.request.data) {
        event.request.data = '[Filtered]';
      }

      return event;
    },
  });
}
