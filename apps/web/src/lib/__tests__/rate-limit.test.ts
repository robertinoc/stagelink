import { describe, expect, it } from 'vitest';
import { checkRateLimit } from '../rate-limit';

describe('checkRateLimit', () => {
  it('allows requests up to the namespace and identity quota', () => {
    const identity = `visitor-${Date.now()}-allow`;

    expect(checkRateLimit('security-test', identity, { windowMs: 60_000, max: 2 })).toBe(true);
    expect(checkRateLimit('security-test', identity, { windowMs: 60_000, max: 2 })).toBe(true);
    expect(checkRateLimit('security-test', identity, { windowMs: 60_000, max: 2 })).toBe(false);
  });

  it('isolates counters by namespace', () => {
    const identity = `visitor-${Date.now()}-namespace`;

    expect(checkRateLimit('contact', identity, { windowMs: 60_000, max: 1 })).toBe(true);
    expect(checkRateLimit('contact', identity, { windowMs: 60_000, max: 1 })).toBe(false);
    expect(checkRateLimit('go', identity, { windowMs: 60_000, max: 1 })).toBe(true);
  });
});
