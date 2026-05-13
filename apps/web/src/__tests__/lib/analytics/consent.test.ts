import { describe, it, expect, beforeEach } from 'vitest';
import {
  acceptAllConsent,
  clearConsentForTesting,
  CONSENT_COOKIE,
  getConsentHeaderValue,
  getConsentPreferences,
  hasConsentChoice,
  isAnalyticsAllowed,
  isMarketingAllowed,
  readConsentCookie,
  readConsentRecord,
  rejectNonEssentialConsent,
  setConsentCookie,
  setConsentPreferences,
} from '@/lib/analytics/consent';

describe('GDPR consent helpers', () => {
  beforeEach(() => {
    clearConsentForTesting();
  });

  it('defaults to no optional consent when no record is present', () => {
    expect(readConsentRecord()).toBeNull();
    expect(readConsentCookie()).toBeNull();
    expect(hasConsentChoice()).toBe(false);
    expect(isAnalyticsAllowed()).toBe(false);
    expect(isMarketingAllowed()).toBe(false);
    expect(getConsentHeaderValue()).toBe('0');
  });

  it('stores granular preferences with timestamp, expiry, and version', () => {
    const record = setConsentPreferences({ analytics: true, marketing: false });

    expect(record.categories).toEqual({
      necessary: true,
      analytics: true,
      marketing: false,
    });
    expect(record.timestamp).toEqual(expect.any(String));
    expect(record.expiresAt).toEqual(expect.any(String));
    expect(document.cookie).toContain(`${CONSENT_COOKIE}=`);
    expect(readConsentRecord()?.categories.analytics).toBe(true);
    expect(isAnalyticsAllowed()).toBe(true);
    expect(isMarketingAllowed()).toBe(false);
    expect(getConsentHeaderValue()).toBe('1');
  });

  it('accepts all optional categories', () => {
    acceptAllConsent();

    expect(getConsentPreferences()).toEqual({
      necessary: true,
      analytics: true,
      marketing: true,
    });
  });

  it('rejects all non-essential categories', () => {
    rejectNonEssentialConsent();

    expect(getConsentPreferences()).toEqual({
      necessary: true,
      analytics: false,
      marketing: false,
    });
    expect(isAnalyticsAllowed()).toBe(false);
    expect(getConsentHeaderValue()).toBe('0');
  });

  it('keeps the legacy setter as explicit analytics consent only', () => {
    setConsentCookie(true);
    expect(readConsentCookie()).toBe(true);
    expect(isAnalyticsAllowed()).toBe(true);

    setConsentCookie(false);
    expect(readConsentCookie()).toBe(false);
    expect(isAnalyticsAllowed()).toBe(false);
  });
});
