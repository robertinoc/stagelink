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

    /**
     * Suppress known-noisy, non-actionable client errors so they don't pollute
     * the Sentry dashboard and mask real issues.
     *
     * - "Failed to fetch" / "Load failed" / "NetworkError…" — transient offline
     *   conditions or external resource failures (e.g. third-party logos, embeds).
     *   These are expected, handled gracefully in the UI, and not caused by our code.
     * - "ResizeObserver loop" — benign browser warning, not an app error.
     * - ChunkLoadError — stale browser cache after a deploy; user needs to reload,
     *   but it's not a bug in the current code.
     */
    ignoreErrors: [
      // Transient network / offline
      'Failed to fetch',
      'Load failed',
      'NetworkError when attempting to fetch resource.',
      // Benign browser quirks
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications.',
      // Stale deploy cache — not a code bug
      /^Loading chunk \d+ failed/,
      /^ChunkLoadError/,
    ],

    /**
     * Drop events that originate from third-party scripts we don't control
     * (embedded widgets, analytics injected by external services, etc.).
     */
    denyUrls: [
      // SoundCloud / streaming embeds
      /w\.soundcloud\.com/,
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
    ],
  });
}

// Instruments client-side navigations so errors are tied to the right route.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
