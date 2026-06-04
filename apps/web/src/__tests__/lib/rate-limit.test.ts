import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * With no Upstash env vars set, checkRateLimit resolves via the synchronous
 * in-memory path, so fake timers still control the window. The function is async
 * now (Redis-capable), hence every call is awaited.
 */
describe('checkRateLimit()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Basic allow / block ──────────────────────────────────────────────────

  it('allows the first request', async () => {
    expect(await checkRateLimit('test-basic', 'ip-1', { windowMs: 60_000, max: 3 })).toBe(true);
  });

  it('allows requests up to the limit', async () => {
    const ns = 'test-upto';
    const id = 'ip-upto';
    expect(await checkRateLimit(ns, id, { windowMs: 60_000, max: 3 })).toBe(true);
    expect(await checkRateLimit(ns, id, { windowMs: 60_000, max: 3 })).toBe(true);
    expect(await checkRateLimit(ns, id, { windowMs: 60_000, max: 3 })).toBe(true);
  });

  it('blocks the request that exceeds the limit', async () => {
    const ns = 'test-block';
    const id = 'ip-block';
    await checkRateLimit(ns, id, { windowMs: 60_000, max: 2 });
    await checkRateLimit(ns, id, { windowMs: 60_000, max: 2 });
    expect(await checkRateLimit(ns, id, { windowMs: 60_000, max: 2 })).toBe(false);
  });

  // ── Window reset ─────────────────────────────────────────────────────────

  it('resets the counter after the window expires', async () => {
    const ns = 'test-reset';
    const id = 'ip-reset';
    await checkRateLimit(ns, id, { windowMs: 60_000, max: 1 });
    await checkRateLimit(ns, id, { windowMs: 60_000, max: 1 }); // blocked

    // Advance past the window
    vi.advanceTimersByTime(61_000);

    // Should be allowed again
    expect(await checkRateLimit(ns, id, { windowMs: 60_000, max: 1 })).toBe(true);
  });

  // ── Namespace isolation ──────────────────────────────────────────────────

  it('keeps namespaces isolated — exhausting one does not affect another', async () => {
    const id = 'ip-iso';
    await checkRateLimit('ns-a', id, { windowMs: 60_000, max: 1 });
    await checkRateLimit('ns-a', id, { windowMs: 60_000, max: 1 }); // ns-a blocked

    // ns-b is completely independent
    expect(await checkRateLimit('ns-b', id, { windowMs: 60_000, max: 1 })).toBe(true);
  });

  // ── Identity isolation ───────────────────────────────────────────────────

  it('keeps different identities isolated within the same namespace', async () => {
    const ns = 'test-identity';
    await checkRateLimit(ns, 'ip-a', { windowMs: 60_000, max: 1 });
    await checkRateLimit(ns, 'ip-a', { windowMs: 60_000, max: 1 }); // ip-a blocked

    // ip-b is independent
    expect(await checkRateLimit(ns, 'ip-b', { windowMs: 60_000, max: 1 })).toBe(true);
  });

  // ── Default options ──────────────────────────────────────────────────────

  it('uses default max of 30 when options are omitted', async () => {
    const ns = 'test-defaults';
    const id = 'ip-defaults';
    // Send 30 requests — all should pass
    for (let i = 0; i < 30; i++) {
      expect(await checkRateLimit(ns, id)).toBe(true);
    }
    // 31st should be blocked
    expect(await checkRateLimit(ns, id)).toBe(false);
  });

  // ── Short window ─────────────────────────────────────────────────────────

  it('works correctly with a very short window (100ms)', async () => {
    const ns = 'test-short';
    const id = 'ip-short';
    await checkRateLimit(ns, id, { windowMs: 100, max: 1 });
    expect(await checkRateLimit(ns, id, { windowMs: 100, max: 1 })).toBe(false);

    vi.advanceTimersByTime(101);
    expect(await checkRateLimit(ns, id, { windowMs: 100, max: 1 })).toBe(true);
  });
});
