import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearPendingSignup,
  isPendingSignupForAccount,
  markSignupPending,
  readPendingSignup,
} from '@/lib/analytics/signup-conversion';

describe('signup conversion marker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-04T12:00:00.000Z'));
    window.sessionStorage.clear();
  });

  afterEach(() => {
    window.sessionStorage.clear();
    vi.useRealTimers();
  });

  it('stores only a timestamp for the current browser tab', () => {
    markSignupPending();

    expect(readPendingSignup()).toEqual({
      startedAt: Date.parse('2026-06-04T12:00:00.000Z'),
    });
    expect(window.sessionStorage.length).toBe(1);
  });

  it('clears an expired marker', () => {
    markSignupPending();
    vi.setSystemTime(new Date('2026-06-04T13:00:01.000Z'));

    expect(readPendingSignup()).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  it('clears malformed marker data', () => {
    window.sessionStorage.setItem('stagelink:pending-signup', '{not-json');

    expect(readPendingSignup()).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  it('matches a newly created account but rejects an existing account', () => {
    const pendingSignup = { startedAt: Date.parse('2026-06-04T12:00:00.000Z') };

    expect(isPendingSignupForAccount(pendingSignup, '2026-06-04T12:00:03.000Z')).toBe(true);
    expect(isPendingSignupForAccount(pendingSignup, '2026-05-01T12:00:00.000Z')).toBe(false);
  });

  it('can explicitly clear the marker', () => {
    markSignupPending();

    clearPendingSignup();

    expect(readPendingSignup()).toBeNull();
  });
});
