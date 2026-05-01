import { describe, it, expect, beforeEach } from 'vitest';
import {
  readConsentCookie,
  isAnalyticsAllowed,
  setConsentCookie,
  getConsentHeaderValue,
  CONSENT_COOKIE,
  CONSENT_ACCEPTED,
  CONSENT_REJECTED,
} from '@/lib/analytics/consent';

/**
 * jsdom provides document.cookie — we manually manage it between tests.
 */
function clearConsentCookie() {
  // Expire the cookie immediately
  document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; Path=/`;
}

describe('readConsentCookie()', () => {
  beforeEach(clearConsentCookie);

  it('returns null when no consent cookie is set', () => {
    expect(readConsentCookie()).toBeNull();
  });

  it('returns true when cookie is "1" (accepted)', () => {
    document.cookie = `${CONSENT_COOKIE}=${CONSENT_ACCEPTED}`;
    expect(readConsentCookie()).toBe(true);
  });

  it('returns false when cookie is "0" (rejected)', () => {
    document.cookie = `${CONSENT_COOKIE}=${CONSENT_REJECTED}`;
    expect(readConsentCookie()).toBe(false);
  });

  it('returns null for an unexpected cookie value', () => {
    document.cookie = `${CONSENT_COOKIE}=maybe`;
    expect(readConsentCookie()).toBeNull();
  });
});

describe('isAnalyticsAllowed()', () => {
  beforeEach(clearConsentCookie);

  it('returns true when no cookie is set (opt-out model — default allow)', () => {
    expect(isAnalyticsAllowed()).toBe(true);
  });

  it('returns true when cookie is accepted ("1")', () => {
    document.cookie = `${CONSENT_COOKIE}=${CONSENT_ACCEPTED}`;
    expect(isAnalyticsAllowed()).toBe(true);
  });

  it('returns false when cookie is rejected ("0")', () => {
    document.cookie = `${CONSENT_COOKIE}=${CONSENT_REJECTED}`;
    expect(isAnalyticsAllowed()).toBe(false);
  });
});

describe('setConsentCookie()', () => {
  beforeEach(clearConsentCookie);

  it('writes the accepted value ("1") to document.cookie', () => {
    setConsentCookie(true);
    expect(readConsentCookie()).toBe(true);
  });

  it('writes the rejected value ("0") to document.cookie', () => {
    setConsentCookie(false);
    expect(readConsentCookie()).toBe(false);
  });

  it('overwrites a previous value when called again', () => {
    setConsentCookie(true);
    setConsentCookie(false);
    expect(readConsentCookie()).toBe(false);
  });
});

describe('getConsentHeaderValue()', () => {
  beforeEach(clearConsentCookie);

  it('returns "" when no cookie is present (consent unknown)', () => {
    expect(getConsentHeaderValue()).toBe('');
  });

  it('returns "1" when consent is accepted', () => {
    document.cookie = `${CONSENT_COOKIE}=${CONSENT_ACCEPTED}`;
    expect(getConsentHeaderValue()).toBe('1');
  });

  it('returns "0" when consent is rejected', () => {
    document.cookie = `${CONSENT_COOKIE}=${CONSENT_REJECTED}`;
    expect(getConsentHeaderValue()).toBe('0');
  });
});
