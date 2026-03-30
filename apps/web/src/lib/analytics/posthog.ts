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

  initialized = true;
}

/**
 * Returns the PostHog instance if initialized, `null` otherwise.
 * Consumers should treat `null` as "analytics not available" and skip tracking.
 */
export function getPostHog(): typeof posthog | null {
  if (!initialized || typeof window === 'undefined') return null;
  return posthog;
}
