/**
 * PostHog browser client singleton.
 *
 * Initialized once on the client side by PostHogProvider.
 * Returns `null` when:
 *   - Running server-side (no `window`)
 *   - NEXT_PUBLIC_POSTHOG_KEY is not set (local dev, CI)
 *
 * Never import `posthog-js` directly in the app — use the `track()` helper
 * from `@/lib/analytics/track` instead. Direct PostHog calls scatter the
 * event catalog across files and make refactors painful.
 */

import posthog from 'posthog-js';

/** PostHog key — undefined when not configured. */
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com';

let initialized = false;

/**
 * Initializes the PostHog client. Must be called once, inside a Client
 * Component, after the DOM is available (i.e. inside useEffect or in a
 * 'use client' Provider).
 *
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function initPostHog(): void {
  if (initialized || !POSTHOG_KEY || typeof window === 'undefined') return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Never send raw IPs to PostHog — privacy-first.
    ip: false,
    // Capture pageviews manually via the Next.js router to avoid double-fires
    // caused by SSR + hydration. PostHogProvider wires this up.
    capture_pageview: false,
    // Respect user's Do Not Track preference.
    respect_dnt: true,
    // Bootstrap: disable autocapture — we control every event explicitly.
    autocapture: false,
  });

  posthog.opt_in_capturing();
  initialized = true;
}

/**
 * Best-effort withdrawal cleanup. PostHog does not expose a true browser
 * "uninitialize" API, so we opt out/reset and remove known local identifiers.
 * All capture callers are also gated by consent before sending events.
 */
export function disablePostHog(): void {
  if (typeof window === 'undefined') return;

  if (initialized) {
    posthog.opt_out_capturing();
    posthog.reset();
  }

  try {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      Object.keys(storage)
        .filter((key) => key.startsWith('ph_') || key.includes('posthog'))
        .forEach((key) => storage.removeItem(key));
    }
  } catch {
    // Storage may be unavailable in private browsing or strict browser modes.
  }

  document.cookie
    .split(';')
    .map((cookie) => cookie.trim().split('=')[0] ?? '')
    .filter(Boolean)
    .filter((name) => name.startsWith('ph_') || name.includes('posthog'))
    .forEach((name) => {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    });
}

/**
 * Returns the PostHog instance if initialized, `null` otherwise.
 * Consumers should treat `null` as "analytics not available" and skip tracking.
 */
export function getPostHog(): typeof posthog | null {
  if (!initialized || typeof window === 'undefined') return null;
  return posthog;
}
