/**
 * consent.ts — T4-4 analytics consent cookie helpers.
 *
 * Cookie name: `sl_ac`  (StageLink Analytics Consent)
 *   '1' = accepted (default if no cookie — opt-out model)
 *   '0' = rejected by visitor
 *
 * Consent model: opt-out with notice.
 *   - Basic analytics (page view counts, link clicks) run as legitimate interest
 *     for the artist. No cross-site tracking, no advertising, no profiling.
 *   - PostHog client-side tracking respects the cookie (see track.ts).
 *   - The `sl_ac` cookie is readable server-side so the web tier can forward
 *     `X-SL-AC: 1/0` to the API, which persists it as `hasTrackingConsent`.
 *   - IP is always hashed (SHA-256) before storage, never stored raw.
 *
 * Cookie lifetime: 365 days, SameSite=Lax, Secure in production.
 * Domain: no explicit domain — scoped to current host (works for custom domains).
 */

export const CONSENT_COOKIE = 'sl_ac';
export const CONSENT_ACCEPTED = '1';
export const CONSENT_REJECTED = '0';

/** Max age in seconds for the consent cookie (1 year). */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Reads the current consent state from `document.cookie`.
 *
 * Returns:
 *   - true  = cookie present and set to '1' (explicitly accepted)
 *   - false = cookie present and set to '0' (explicitly rejected)
 *   - null  = cookie not present (first visit — consent unknown, opt-out default applies)
 *
 * Only usable in browser contexts.
 */
export function readConsentCookie(): boolean | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`));

  if (!match) return null;
  const value = match.split('=')[1];
  if (value === CONSENT_ACCEPTED) return true;
  if (value === CONSENT_REJECTED) return false;
  return null;
}

/**
 * Returns true if the visitor has not explicitly rejected analytics.
 *
 * In the opt-out model, absent cookie = default accept.
 * Use this to decide whether to fire tracking calls.
 */
export function isAnalyticsAllowed(): boolean {
  const consent = readConsentCookie();
  // null = no cookie yet = default opt-out model: allow
  return consent !== false;
}

/**
 * Persists the visitor's consent choice as a first-party cookie.
 * Call this when the visitor interacts with the consent banner.
 *
 * @param accepted  true = accept, false = reject
 */
export function setConsentCookie(accepted: boolean): void {
  if (typeof document === 'undefined') return;

  const value = accepted ? CONSENT_ACCEPTED : CONSENT_REJECTED;
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

/**
 * Returns the raw cookie value string ('1', '0', or '') for use in
 * X-SL-AC request headers forwarded to the API.
 *
 * '' means the cookie is absent (consent unknown — API will store null).
 */
export function getConsentHeaderValue(): string {
  const consent = readConsentCookie();
  if (consent === true) return CONSENT_ACCEPTED;
  if (consent === false) return CONSENT_REJECTED;
  return ''; // absent — API stores hasTrackingConsent = null
}
