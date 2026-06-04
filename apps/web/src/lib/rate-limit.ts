/**
 * Fixed-window rate limiter with a shared (Upstash Redis) store and an
 * in-memory fallback.
 *
 * When `UPSTASH_REDIS_KV_REST_API_URL` / `UPSTASH_REDIS_KV_REST_API_TOKEN` are
 * set, counters live in Redis via an atomic `INCR` + `PEXPIRE` pattern, so the
 * limit is shared across every serverless instance — multi-instance-safe for
 * sustained public traffic. Without those vars (local dev, CI), or if a Redis
 * call fails, it degrades to a per-instance in-memory Map. The fallback turns a
 * Redis outage into reduced (per-instance) protection rather than a hard lockout.
 *
 * Fixed (not sliding) window: a burst at the end of window N and the start of
 * N+1 can exceed `max` in a short span. Acceptable for v1.
 *
 * Usage:
 *   import { checkRateLimit } from '@/lib/rate-limit';
 *   if (!(await checkRateLimit('go', ip, { windowMs: 60_000, max: 30 }))) {
 *     return new NextResponse('Too many requests', { status: 429 });
 *   }
 */
import { Redis } from '@upstash/redis';

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
 * Builds an Upstash Redis client from the shared env vars, or null when
 * unconfigured. Matches the construction pattern in `behind-redis.ts`.
 */
function getRateLimitRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** In-memory fixed-window check. Used directly when Redis is unavailable. */
function checkInMemory(key: string, windowMs: number, max: number): boolean {
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

/** Redis-backed atomic fixed-window check (shared across instances). */
async function checkWithRedis(
  redis: Redis,
  key: string,
  windowMs: number,
  max: number,
): Promise<boolean> {
  const count = await redis.incr(key);
  if (count === 1) {
    // First request in this window — stamp the expiry so the counter resets.
    await redis.pexpire(key, windowMs);
  }
  return count <= max;
}

/**
 * Returns `true` if the request is within the rate limit, `false` if it exceeds
 * it. Resolves against the shared Redis store when configured, otherwise the
 * in-memory fallback.
 *
 * @param namespace  Logical scope (e.g. 'go', 'landing-contact').
 * @param identity   Per-client key (e.g. IP address, user ID).
 * @param opts       Optional overrides for windowMs and max.
 */
export async function checkRateLimit(
  namespace: string,
  identity: string,
  opts?: RateLimitOptions,
): Promise<boolean> {
  const windowMs = opts?.windowMs ?? 60_000;
  const max = opts?.max ?? 30;
  const key = `${namespace}:${identity}`;

  const redis = getRateLimitRedis();
  if (!redis) return checkInMemory(key, windowMs, max);

  try {
    return await checkWithRedis(redis, `ratelimit:${key}`, windowMs, max);
  } catch {
    // Redis outage → degrade to per-instance protection rather than failing
    // closed and rejecting legitimate traffic.
    return checkInMemory(key, windowMs, max);
  }
}

/**
 * Internal hooks exposed for unit tests only. Not part of the public API —
 * lets tests exercise the in-memory and Redis paths without env wiring.
 */
export const __rateLimitInternals = { checkInMemory, checkWithRedis };
