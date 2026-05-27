import * as Sentry from '@sentry/nextjs';

/**
 * Client-side Sentry init. Inert when NEXT_PUBLIC_SENTRY_DSN is unset.
 * Errors-only — Session Replay + performance tracing are disabled for v1 to
 * keep the client bundle light and avoid sampling overhead.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
  });
}

// Instruments client-side navigations so errors are tied to the right route.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
