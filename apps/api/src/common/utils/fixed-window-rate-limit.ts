export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: Date;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export interface FixedWindowRateLimiterOptions {
  namespace: string;
  windowMs: number;
  maxRequests: number;
  cleanupIntervalMs?: number;
}

/**
 * Small in-memory fixed-window limiter.
 *
 * This is intentionally local-process only. It gives deterministic launch
 * protection for single-instance/private QA, while keeping the call site easy
 * to swap for Redis/Upstash when StageLink moves to sustained public traffic.
 */
export class FixedWindowRateLimiter {
  private readonly store = new Map<string, RateLimitEntry>();
  private readonly cleanupTimer: NodeJS.Timeout;

  constructor(private readonly options: FixedWindowRateLimiterOptions) {
    const cleanupIntervalMs = options.cleanupIntervalMs ?? options.windowMs * 5;
    this.cleanupTimer = setInterval(() => this.cleanup(), cleanupIntervalMs);
    this.cleanupTimer.unref?.();
  }

  check(subject: string, now = Date.now()): RateLimitDecision {
    const key = `${this.options.namespace}:${subject}`;
    const entry = this.store.get(key);

    if (!entry || now - entry.windowStart > this.options.windowMs) {
      this.store.set(key, { count: 1, windowStart: now });
      return this.toDecision(true, 1, now);
    }

    if (entry.count >= this.options.maxRequests) {
      return this.toDecision(false, entry.count, entry.windowStart);
    }

    entry.count += 1;
    return this.toDecision(true, entry.count, entry.windowStart);
  }

  reset(): void {
    this.store.clear();
  }

  private toDecision(allowed: boolean, count: number, windowStart: number): RateLimitDecision {
    const resetAtMs = windowStart + this.options.windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAtMs - Date.now()) / 1000));
    return {
      allowed,
      limit: this.options.maxRequests,
      remaining: Math.max(0, this.options.maxRequests - count),
      retryAfterSeconds,
      resetAt: new Date(resetAtMs),
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.windowStart > this.options.windowMs * 5) {
        this.store.delete(key);
      }
    }
  }
}
