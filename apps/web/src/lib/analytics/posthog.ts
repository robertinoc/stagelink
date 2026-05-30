/**
 * PostHog browser client singleton — consent-aware and code-split.
 *
 * The `posthog-js` SDK ships ~70 kB pre-gzip. To keep it out of the
 * initial bundle, we never import it at module level. Instead,
 * `initPostHog()` resolves it via dynamic `import()` only after the
 * consent gate flips analytics on. Visitors who never accept analytics
 * cookies (and every page they hit before the gate runs) pay zero bytes.
 *
 * Returns `null` for consumers when:
 *   - Running server-side (no `window`)
 *   - NEXT_PUBLIC_POSTHOG_KEY is not set (local dev, CI)
 *   - Analytics consent has not been granted yet, so the chunk has not
 *     been loaded
 *
 * Never import `posthog-js` directly in the app — use the `track()` helper
 * from `@/lib/analytics/track` instead. Direct PostHog calls scatter the
 * event catalog across files and make refactors painful.
 */

import type PostHog from 'posthog-js';

/** PostHog key — undefined when not configured. */
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com';

let posthogInstance: typeof PostHog | null = null;
let initialized = false;
/** In-flight init promise — dedupes concurrent callers (consent toggled rapidly). */
let initPromise: Promise<void> | null = null;

/**
 * Initializes the PostHog client. Must be called once, inside a Client
 * Component, after the DOM is available (i.e. inside useEffect or in a
 * 'use client' Provider).
 *
 * Async because the SDK is now code-split: the first call dynamically
 * imports `posthog-js`, subsequent calls are no-ops. Callers can fire-
 * and-forget with `void initPostHog()` — there is no observable race
 * because every `track()` helper goes through `getPostHog()`, which
 * gracefully returns `null` until init resolves.
 */
export async function initPostHog(): Promise<void> {
  if (initialized || !POSTHOG_KEY || typeof window === 'undefined') return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const mod = await import('posthog-js');
    const posthog = mod.default;

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
    posthogInstance = posthog;
    initialized = true;
  })().finally(() => {
    initPromise = null;
  });

  return initPromise;
}

/**
 * Best-effort withdrawal cleanup. PostHog does not expose a true browser
 * "uninitialize" API, so we opt out/reset (only if the SDK has been loaded)
 * and remove known local identifiers. All capture callers are also gated
 * by consent before sending events.
 *
 * Crucially this does NOT trigger the dynamic import: if the user rejects
 * cookies before PostHog ever loaded, we stay at zero bytes.
 */
export function disablePostHog(): void {
  if (typeof window === 'undefined') return;

  if (initialized && posthogInstance) {
    posthogInstance.opt_out_capturing();
    posthogInstance.reset();
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
 *
 * Synchronous and side-effect-free — never triggers the dynamic import.
 * Tracking calls that fire before init resolves are silently dropped,
 * which is the correct behaviour for consent-pending traffic.
 */
export function getPostHog(): typeof PostHog | null {
  if (!initialized || typeof window === 'undefined') return null;
  return posthogInstance;
}
