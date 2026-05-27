/**
 * Sentry initialisation for the API.
 *
 * Imported FIRST in main.ts (before any other module) so Sentry can
 * instrument the runtime correctly. Reads process.env directly because the
 * Nest ConfigService isn't available this early in the bootstrap.
 *
 * Fully inert when SENTRY_DSN is unset: Sentry.init() is never called, so
 * every Sentry.captureException() elsewhere becomes a no-op. This keeps the
 * SDK shipped-but-dormant until the DSN is configured in Railway.
 *
 * Errors-only by design (tracesSampleRate: 0) — no performance/transaction
 * overhead for v1; flip the sample rate later if APM is wanted.
 */
import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    // Railway injects the deployed commit SHA — ties errors to a release.
    release: process.env.RAILWAY_GIT_COMMIT_SHA || undefined,
    tracesSampleRate: 0,
    // Don't send default PII (IP, headers) — we already sanitise logs and
    // the privacy posture avoids storing raw IPs.
    sendDefaultPii: false,
  });
}

export const sentryEnabled = Boolean(dsn);
