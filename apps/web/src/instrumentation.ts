import * as Sentry from '@sentry/nextjs';

/**
 * Server + edge runtime Sentry init for the Next.js app.
 *
 * Fully inert when no DSN is configured — Sentry.init() is skipped, so the
 * SDK ships dormant until NEXT_PUBLIC_SENTRY_DSN (or SENTRY_DSN) is set in
 * the Vercel project env. Errors-only (tracesSampleRate 0) for v1.
 */
export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0,
      sendDefaultPii: false,
    });
  }
}

// Captures errors thrown in nested React Server Components (Next 15+/16).
export const onRequestError = Sentry.captureRequestError;
