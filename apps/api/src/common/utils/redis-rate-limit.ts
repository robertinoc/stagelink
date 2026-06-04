import { Redis } from '@upstash/redis';
import {
  FixedWindowRateLimiter,
  type RateLimitDecision,
  type FixedWindowRateLimiterOptions,
} from './fixed-window-rate-limit';

/**
 * Async rate limiter contract. Both the Redis-backed and the in-memory fallback
 * paths resolve to the same {@link RateLimitDecision} shape, so call sites stay
 * storage-agnostic and only need to `await` the decision.
 */
export interface AsyncRateLimiter {
  check(subject: string): Promise<RateLimitDecision>;
}

/**
 * Builds an Upstash Redis client from the shared Behind/role env vars, or
 * returns null when unconfigured (local dev, CI). Mirrors `AdminRoleService`
 * so there is a single, consistent client-construction pattern across the API.
 */
export function getRateLimitRedis(): Redis | null {
  const url = process.env['UPSTASH_REDIS_KV_REST_API_URL'];
  const token = process.env['UPSTASH_REDIS_KV_REST_API_TOKEN'];
  return url && token ? new Redis({ url, token }) : null;
}

/**
 * Distributed fixed-window rate limiter.
 *
 * When Upstash is configured it uses an atomic `INCR` + `PEXPIRE` pattern so the
 * counter is shared across every API instance — the multi-instance-safe posture
 * required before broad public traffic / paid acquisition.
 *
 * When Upstash is NOT configured, or a Redis call fails, it degrades to a
 * per-instance in-memory {@link FixedWindowRateLimiter}. This keeps local dev /
 * CI working without Redis, and turns a Redis outage into reduced (per-instance)
 * protection rather than a hard lockout of every caller — fail-open to local.
 */
export class DistributedRateLimiter implements AsyncRateLimiter {
  private readonly fallback: FixedWindowRateLimiter;

  constructor(
    private readonly options: FixedWindowRateLimiterOptions,
    private readonly redis: Redis | null = getRateLimitRedis(),
  ) {
    this.fallback = new FixedWindowRateLimiter(options);
  }

  async check(subject: string): Promise<RateLimitDecision> {
    if (!this.redis) return this.fallback.check(subject);
    try {
      return await this.checkRedis(this.redis, subject);
    } catch {
      // Redis outage → degrade to the per-instance limiter instead of failing
      // closed and locking out legitimate traffic.
      return this.fallback.check(subject);
    }
  }

  private async checkRedis(redis: Redis, subject: string): Promise<RateLimitDecision> {
    const { namespace, windowMs, maxRequests } = this.options;
    const key = `ratelimit:${namespace}:${subject}`;

    const count = await redis.incr(key);
    let ttlMs: number;
    if (count === 1) {
      // First request in this window — stamp the expiry.
      await redis.pexpire(key, windowMs);
      ttlMs = windowMs;
    } else {
      ttlMs = await redis.pttl(key);
      // Recover a key that lost its TTL (e.g. a crash between INCR and PEXPIRE):
      // negative pttl means "no expiry" / "missing", so re-stamp the window.
      if (ttlMs < 0) {
        await redis.pexpire(key, windowMs);
        ttlMs = windowMs;
      }
    }

    return {
      allowed: count <= maxRequests,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - count),
      retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
      resetAt: new Date(Date.now() + ttlMs),
    };
  }
}
