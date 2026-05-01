import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * The rate limiter uses an internal Map and Date.now().
 * We use vi.useFakeTimers() to control time without waiting for real delays.
 */
describe('checkRateLimit()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Basic allow / block ──────────────────────────────────────────────────

  it('allows the first request', () => {
    expect(checkRateLimit('test-basic', 'ip-1', { windowMs: 60_000, max: 3 })).toBe(true);
  });

  it('allows requests up to the limit', () => {
    const ns = 'test-upto';
    const id = 'ip-upto';
    expect(checkRateLimit(ns, id, { windowMs: 60_000, max: 3 })).toBe(true);
    expect(checkRateLimit(ns, id, { windowMs: 60_000, max: 3 })).toBe(true);
    expect(checkRateLimit(ns, id, { windowMs: 60_000, max: 3 })).toBe(true);
  });

  it('blocks the request that exceeds the limit', () => {
    const ns = 'test-block';
    const id = 'ip-block';
    checkRateLimit(ns, id, { windowMs: 60_000, max: 2 });
    checkRateLimit(ns, id, { windowMs: 60_000, max: 2 });
    expect(checkRateLimit(ns, id, { windowMs: 60_000, max: 2 })).toBe(false);
  });

  // ── Window reset ─────────────────────────────────────────────────────────

  it('resets the counter after the window expires', () => {
    const ns = 'test-reset';
    const id = 'ip-reset';
    checkRateLimit(ns, id, { windowMs: 60_000, max: 1 });
    checkRateLimit(ns, id, { windowMs: 60_000, max: 1 }); // blocked

    // Advance past the window
    vi.advanceTimersByTime(61_000);

    // Should be allowed again
    expect(checkRateLimit(ns, id, { windowMs: 60_000, max: 1 })).toBe(true);
  });

  // ── Namespace isolation ──────────────────────────────────────────────────

  it('keeps namespaces isolated — exhausting one does not affect another', () => {
    const id = 'ip-iso';
    checkRateLimit('ns-a', id, { windowMs: 60_000, max: 1 });
    checkRateLimit('ns-a', id, { windowMs: 60_000, max: 1 }); // ns-a blocked

    // ns-b is completely independent
    expect(checkRateLimit('ns-b', id, { windowMs: 60_000, max: 1 })).toBe(true);
  });

  // ── Identity isolation ───────────────────────────────────────────────────

  it('keeps different identities isolated within the same namespace', () => {
    const ns = 'test-identity';
    checkRateLimit(ns, 'ip-a', { windowMs: 60_000, max: 1 });
    checkRateLimit(ns, 'ip-a', { windowMs: 60_000, max: 1 }); // ip-a blocked

    // ip-b is independent
    expect(checkRateLimit(ns, 'ip-b', { windowMs: 60_000, max: 1 })).toBe(true);
  });

  // ── Default options ──────────────────────────────────────────────────────

  it('uses default max of 30 when options are omitted', () => {
    const ns = 'test-defaults';
    const id = 'ip-defaults';
    // Send 30 requests — all should pass
    for (let i = 0; i < 30; i++) {
      expect(checkRateLimit(ns, id)).toBe(true);
    }
    // 31st should be blocked
    expect(checkRateLimit(ns, id)).toBe(false);
  });

  // ── Short window ─────────────────────────────────────────────────────────

  it('works correctly with a very short window (100ms)', () => {
    const ns = 'test-short';
    const id = 'ip-short';
    checkRateLimit(ns, id, { windowMs: 100, max: 1 });
    expect(checkRateLimit(ns, id, { windowMs: 100, max: 1 })).toBe(false);

    vi.advanceTimersByTime(101);
    expect(checkRateLimit(ns, id, { windowMs: 100, max: 1 })).toBe(true);
  });
});
