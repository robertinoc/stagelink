import { describe, expect, it, vi } from 'vitest';
import { checkRateLimit, __rateLimitInternals } from '../rate-limit';

describe('checkRateLimit (in-memory fallback)', () => {
  // No Upstash env vars in tests → checkRateLimit resolves via the in-memory path.
  it('allows requests up to the namespace and identity quota', async () => {
    const identity = `visitor-${Date.now()}-allow`;

    expect(await checkRateLimit('security-test', identity, { windowMs: 60_000, max: 2 })).toBe(
      true,
    );
    expect(await checkRateLimit('security-test', identity, { windowMs: 60_000, max: 2 })).toBe(
      true,
    );
    expect(await checkRateLimit('security-test', identity, { windowMs: 60_000, max: 2 })).toBe(
      false,
    );
  });

  it('isolates counters by namespace', async () => {
    const identity = `visitor-${Date.now()}-namespace`;

    expect(await checkRateLimit('contact', identity, { windowMs: 60_000, max: 1 })).toBe(true);
    expect(await checkRateLimit('contact', identity, { windowMs: 60_000, max: 1 })).toBe(false);
    expect(await checkRateLimit('go', identity, { windowMs: 60_000, max: 1 })).toBe(true);
  });
});

describe('Redis-backed path', () => {
  it('uses an atomic INCR + PEXPIRE and blocks once the count exceeds max', async () => {
    let counter = 0;
    const pexpire = vi.fn().mockResolvedValue(1);
    const redis = {
      incr: vi.fn().mockImplementation(async () => ++counter),
      pexpire,
    } as unknown as Parameters<typeof __rateLimitInternals.checkWithRedis>[0];

    const key = 'ratelimit:go:1.2.3.4';
    expect(await __rateLimitInternals.checkWithRedis(redis, key, 60_000, 2)).toBe(true);
    expect(await __rateLimitInternals.checkWithRedis(redis, key, 60_000, 2)).toBe(true);
    expect(await __rateLimitInternals.checkWithRedis(redis, key, 60_000, 2)).toBe(false);

    // PEXPIRE is stamped exactly once — on the first request of the window.
    expect(pexpire).toHaveBeenCalledTimes(1);
    expect(pexpire).toHaveBeenCalledWith(key, 60_000);
  });

  it('isolates counters by distinct keys (multi-instance-safe key generation)', async () => {
    const counters = new Map<string, number>();
    const redis = {
      incr: vi.fn().mockImplementation(async (key: string) => {
        const next = (counters.get(key) ?? 0) + 1;
        counters.set(key, next);
        return next;
      }),
      pexpire: vi.fn().mockResolvedValue(1),
    } as unknown as Parameters<typeof __rateLimitInternals.checkWithRedis>[0];

    expect(await __rateLimitInternals.checkWithRedis(redis, 'ratelimit:go:a', 60_000, 1)).toBe(
      true,
    );
    expect(await __rateLimitInternals.checkWithRedis(redis, 'ratelimit:go:a', 60_000, 1)).toBe(
      false,
    );
    // Different identity → independent counter.
    expect(await __rateLimitInternals.checkWithRedis(redis, 'ratelimit:go:b', 60_000, 1)).toBe(
      true,
    );
  });
});
