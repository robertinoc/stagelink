/**
 * GDPR-first consent helpers.
 *
 * `sl_consent` is the canonical, versioned consent record.
 * `sl_ac` is kept as a compact compatibility cookie for API quality headers:
 *   - '1' = analytics consent granted
 *   - '0' = analytics consent rejected or absent
 *
 * No non-essential analytics is allowed unless the current consent record
 * explicitly grants the analytics category.
 */

export const CONSENT_COOKIE = 'sl_consent';
export const LEGACY_ANALYTICS_CONSENT_COOKIE = 'sl_ac';
export const CONSENT_ACCEPTED = '1';
export const CONSENT_REJECTED = '0';
export const CONSENT_VERSION = '2026-05-privacy-v1';
export const CONSENT_CHANGED_EVENT = 'stagelink:consent-changed';

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing';

export interface ConsentPreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentRecord {
  version: string;
  timestamp: string;
  expiresAt: string;
  categories: ConsentPreferences;
}

export const DEFAULT_CONSENT_PREFERENCES: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`));

  if (!match) return null;
  return match.slice(name.length + 1);
}

function writeCookie(name: string, value: string, maxAge = COOKIE_MAX_AGE): void {
  if (typeof document === 'undefined') return;

  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;

  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
}

function hasCurrentVersion(record: ConsentRecord): boolean {
  return record.version === CONSENT_VERSION;
}

function isExpired(record: ConsentRecord): boolean {
  return Number.isNaN(Date.parse(record.expiresAt)) || Date.parse(record.expiresAt) <= Date.now();
}

function normalizePreferences(preferences: Partial<ConsentPreferences>): ConsentPreferences {
  return {
    necessary: true,
    analytics: preferences.analytics === true,
    marketing: preferences.marketing === true,
  };
}

function createConsentRecord(preferences: Partial<ConsentPreferences>): ConsentRecord {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + COOKIE_MAX_AGE * 1000);

  return {
    version: CONSENT_VERSION,
    timestamp: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    categories: normalizePreferences(preferences),
  };
}

export function readConsentRecord(): ConsentRecord | null {
  const value = getCookieValue(CONSENT_COOKIE);
  if (!value) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as ConsentRecord;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.categories || parsed.categories.necessary !== true) return null;
    if (!hasCurrentVersion(parsed) || isExpired(parsed)) return null;

    return {
      version: parsed.version,
      timestamp: parsed.timestamp,
      expiresAt: parsed.expiresAt,
      categories: normalizePreferences(parsed.categories),
    };
  } catch {
    return null;
  }
}

/**
 * Backwards-compatible boolean reader used by older tests and API header code.
 * It only returns true when analytics consent is explicit and current.
 */
export function readConsentCookie(): boolean | null {
  const record = readConsentRecord();
  if (!record) return null;
  return record.categories.analytics;
}

export function hasConsentChoice(): boolean {
  return readConsentRecord() !== null;
}

export function getConsentPreferences(): ConsentPreferences {
  return readConsentRecord()?.categories ?? DEFAULT_CONSENT_PREFERENCES;
}

export function isAnalyticsAllowed(): boolean {
  return readConsentRecord()?.categories.analytics === true;
}

export function isMarketingAllowed(): boolean {
  return readConsentRecord()?.categories.marketing === true;
}

export function setConsentPreferences(preferences: Partial<ConsentPreferences>): ConsentRecord {
  const record = createConsentRecord(preferences);
  writeCookie(CONSENT_COOKIE, encodeURIComponent(JSON.stringify(record)));
  writeCookie(
    LEGACY_ANALYTICS_CONSENT_COOKIE,
    record.categories.analytics ? CONSENT_ACCEPTED : CONSENT_REJECTED,
  );
  dispatchConsentChanged(record);
  return record;
}

export function acceptAllConsent(): ConsentRecord {
  return setConsentPreferences({ analytics: true, marketing: true });
}

export function rejectNonEssentialConsent(): ConsentRecord {
  return setConsentPreferences({ analytics: false, marketing: false });
}

/**
 * Legacy setter retained for existing tests/callers.
 */
export function setConsentCookie(accepted: boolean): void {
  setConsentPreferences({ analytics: accepted, marketing: false });
}

export function clearConsentForTesting(): void {
  deleteCookie(CONSENT_COOKIE);
  deleteCookie(LEGACY_ANALYTICS_CONSENT_COOKIE);
}

export function getConsentHeaderValue(): string {
  return isAnalyticsAllowed() ? CONSENT_ACCEPTED : CONSENT_REJECTED;
}

function dispatchConsentChanged(record: ConsentRecord): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ConsentRecord>(CONSENT_CHANGED_EVENT, { detail: record }));
}
