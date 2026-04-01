/**
 * Simple in-memory fixed-window rate limiter.
 *
 * Each identity gets a counter that resets every `windowMs`. This is a fixed
 * (not sliding) window — a burst at the end of window N and the start of
 * window N+1 can exceed `max` in a short span. Acceptable for v1; replace with
 * a sliding-log or token-bucket algorithm if precision matters.
 *
 * ⚠️  In-memory only — resets on cold starts and does NOT coordinate across
 * multiple serverless function instances (Vercel, AWS Lambda, etc.).
 * For production multi-instance deployments, replace the Map with an external
 * atomic store: Upstash Redis, Vercel KV, or equivalent.
 *
 * Usage:
 *   import { checkRateLimit } from '@/lib/rate-limit';
 *   if (!checkRateLimit('go', ip, { windowMs: 60_000, max: 30 })) {
 *     return new NextResponse('Too many requests', { status: 429 });
 *   }
 */

interface RateEntry {
  count: number;
  windowStart: number;
}

// Keyed by `${namespace}:${identity}` — keeps different limiters isolated.
const store = new Map<string, RateEntry>();

// Periodic cleanup to prevent unbounded Map growth in long-lived processes.
// Runs every 5 minutes; harmless if the process is short-lived (serverless).
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now - entry.windowStart > 300_000) store.delete(key);
    }
  }, 5 * 60_000);
}

export interface RateLimitOptions {
  /** Window duration in milliseconds. Default: 60 000 (1 min). */
  windowMs?: number;
  /** Maximum requests allowed per window. Default: 30. */
  max?: number;
}

/**
 * Returns `true` if the request is within the rate limit, `false` if it exceeds it.
 *
 * @param namespace  Logical scope (e.g. 'go', 'api').
 * @param identity   Per-client key (e.g. IP address, user ID).
 * @param opts       Optional overrides for windowMs and max.
 */
export function checkRateLimit(
  namespace: string,
  identity: string,
  opts?: RateLimitOptions,
): boolean {
  const windowMs = opts?.windowMs ?? 60_000;
  const max = opts?.max ?? 30;
  const key = `${namespace}:${identity}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= max) return false;

  entry.count++;
  return true;
}
