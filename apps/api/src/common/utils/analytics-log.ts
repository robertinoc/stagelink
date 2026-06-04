import { sanitizeLogValue } from './security-log';

export type AnalyticsLogMetadata = Record<string, string | number | boolean | null | undefined>;

/**
 * Structured log line for analytics ingestion outcomes, e.g.
 *
 *   analytics_ingest=failed {"eventType":"page_view","artistId":"..."}
 *
 * Grep-/alert-friendly and consistent with `formatSecurityEvent`. Intentionally
 * low-cardinality and PII-free (no IPs, no raw user agents) — only the event
 * type, artist id, and a short reason — so it can back a log-based metric/alert
 * without leaking visitor data.
 */
export function formatAnalyticsEvent(outcome: string, metadata: AnalyticsLogMetadata = {}): string {
  const sanitized = Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      sanitizeLogValue(key),
      typeof value === 'number' || typeof value === 'boolean' ? value : sanitizeLogValue(value),
    ]),
  );
  return `analytics_ingest=${sanitizeLogValue(outcome)} ${JSON.stringify(sanitized)}`;
}
