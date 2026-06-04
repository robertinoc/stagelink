import { Redis } from '@upstash/redis';
import { DistributedRateLimiter } from './redis-rate-limit';

/**
 * Builds a minimal Redis double that emulates INCR / PEXPIRE / PTTL semantics
 * for a single fixed window. Good enough to assert the limiter's decision logic
 * without a real Upstash connection.
 */
function fakeRedis(overrides: Partial<Record<'incr' | 'pexpire' | 'pttl', jest.Mock>> = {}): Redis {
  const counts = new Map<string, number>();
  return {
    incr:
      overrides.incr ??
      jest.fn(async (key: string) => {
        const next = (counts.get(key) ?? 0) + 1;
        counts.set(key, next);
        return next;
      }),
    pexpire: overrides.pexpire ?? jest.fn(async () => 1),
    pttl: overrides.pttl ?? jest.fn(async () => 60_000),
  } as unknown as Redis;
}

describe('DistributedRateLimiter', () => {
  const options = { namespace: 'public', windowMs: 60_000, maxRequests: 3 };

  it('allows up to maxRequests then blocks, using a shared Redis counter', async () => {
    const redis = fakeRedis();
    const limiter = new DistributedRateLimiter(options, redis);

    expect((await limiter.check('1.1.1.1')).allowed).toBe(true);
    expect((await limiter.check('1.1.1.1')).allowed).toBe(true);
    expect((await limiter.check('1.1.1.1')).allowed).toBe(true);

    const blocked = await limiter.check('1.1.1.1');
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.limit).toBe(3);
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it('stamps the window expiry exactly once (on the first request)', async () => {
    const pexpire = jest.fn(async () => 1);
    const redis = fakeRedis({ pexpire });
    const limiter = new DistributedRateLimiter(options, redis);

    await limiter.check('2.2.2.2');
    await limiter.check('2.2.2.2');
    await limiter.check('2.2.2.2');

    expect(pexpire).toHaveBeenCalledTimes(1);
    expect(pexpire).toHaveBeenCalledWith('ratelimit:public:2.2.2.2', 60_000);
  });

  it('isolates counters per namespace + subject (multi-instance-safe keys)', async () => {
    const redis = fakeRedis();
    const a = new DistributedRateLimiter({ ...options, maxRequests: 1 }, redis);

    expect((await a.check('x')).allowed).toBe(true);
    expect((await a.check('x')).allowed).toBe(false);
    // Different subject → independent counter.
    expect((await a.check('y')).allowed).toBe(true);
  });

  it('re-stamps a key that lost its TTL', async () => {
    let count = 0;
    const pexpire = jest.fn(async () => 1);
    const redis = fakeRedis({
      incr: jest.fn(async () => ++count),
      pttl: jest.fn(async () => -1), // key exists but has no expiry
      pexpire,
    });
    const limiter = new DistributedRateLimiter(options, redis);

    await limiter.check('3.3.3.3'); // count=1 → pexpire
    await limiter.check('3.3.3.3'); // count=2 → pttl=-1 → re-stamp pexpire

    expect(pexpire).toHaveBeenCalledTimes(2);
  });

  it('falls back to the in-memory limiter when Redis throws', async () => {
    const redis = fakeRedis({
      incr: jest.fn(async () => {
        throw new Error('redis down');
      }),
    });
    const limiter = new DistributedRateLimiter({ ...options, maxRequests: 2 }, redis);

    // Despite Redis failing, the in-memory fallback still enforces the quota.
    expect((await limiter.check('4.4.4.4')).allowed).toBe(true);
    expect((await limiter.check('4.4.4.4')).allowed).toBe(true);
    expect((await limiter.check('4.4.4.4')).allowed).toBe(false);
  });

  it('uses the in-memory limiter when Redis is not configured (null client)', async () => {
    const limiter = new DistributedRateLimiter({ ...options, maxRequests: 1 }, null);

    expect((await limiter.check('5.5.5.5')).allowed).toBe(true);
    expect((await limiter.check('5.5.5.5')).allowed).toBe(false);
  });
});
