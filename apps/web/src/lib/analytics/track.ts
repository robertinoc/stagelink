/**
 * Typed event-tracking helpers for the StageLink web app.
 *
 * These are the ONLY functions that should call PostHog or the analytics API directly.
 * Components import from here — never from posthog-js or fetch directly.
 *
 * All helpers are:
 *   - Safe to call server-side (they check for `window` internally via getPostHog)
 *   - Silent when PostHog is not configured (local dev, CI)
 *   - Typed — wrong property shapes cause compile errors
 *
 * Privacy additions:
 *   - PostHog is opt-in: only fires when `isAnalyticsAllowed()` returns true.
 *   - X-SL-* quality headers are included in all backend API calls so the API
 *     can persist consent state and flag internal/QA traffic.
 *
 * Privacy rules enforced here:
 *   - No full URLs — referrer domain and destination domain only
 *   - No email addresses
 *   - No raw IPs (PostHog is initialized with ip:false)
 */

import { ANALYTICS_EVENTS } from '@stagelink/types';
import type { AnalyticsEventName, AuthFunnelProps, PublicLinkClickProps } from '@stagelink/types';
import { getPostHog } from './posthog';
import { isAnalyticsAllowed, getConsentHeaderValue } from './consent';
import { trackUmamiEvent } from './umami';

type AuthFunnelEventName =
  | typeof ANALYTICS_EVENTS.AUTH_LOGIN_STARTED
  | typeof ANALYTICS_EVENTS.AUTH_SIGNUP_STARTED
  | typeof ANALYTICS_EVENTS.AUTH_SIGNUP_COMPLETED
  | typeof ANALYTICS_EVENTS.AUTH_LOGIN_SIGNUP_CLICKED
  | typeof ANALYTICS_EVENTS.AUTH_SIGNUP_LOGIN_CLICKED;

type PlatformFunnelProps = Omit<AuthFunnelProps, 'environment'>;

function getWebEnvironment(): string {
  return process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV ?? 'development';
}

// ─── QA mode ─────────────────────────────────────────────────────────────────

/**
 * Reads the QA mode cookie (`sl_qa`) set by `?sl_qa=1` URL param.
 * When present, X-SL-QA: 1 is forwarded to the API so events are flagged.
 */
function getQaHeaderValue(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('sl_qa='));
  return match?.split('=')[1] === '1' ? '1' : '';
}

/**
 * Builds the T4-4 quality headers to include on every API analytics call.
 * These are forwarded from visitor cookies so the API can persist quality flags.
 */
function buildQualityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const ac = getConsentHeaderValue();
  if (ac) headers['X-SL-AC'] = ac;
  const qa = getQaHeaderValue();
  if (qa) headers['X-SL-QA'] = qa;
  return headers;
}

// ─── Diagnostic mode ────────────────────────────────────────────────────────
//
// Opt-in click-tracking debugger. Enable by visiting any public page with
// ?sl_debug=1 in the URL — sets a session cookie so subsequent clicks log.
// Outputs to the browser console:
//   - Whether analytics consent is granted (gate that drops events silently)
//   - The exact fetch payload sent to the backend
//   - The HTTP response status (so you can see if the backend rejected it)
//
// Use case: diagnose why a click "doesn't move the counter". Open devtools,
// click a tracked element, paste the [sl_debug] logs into the bug report.
//
// Disable: clear the `sl_debug` cookie or visit any page with ?sl_debug=0.
function isClickDebugEnabled(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get('sl_debug');
    if (flag === '1') {
      document.cookie = 'sl_debug=1; path=/; max-age=3600; samesite=lax';
      return true;
    }
    if (flag === '0') {
      document.cookie = 'sl_debug=; path=/; max-age=0; samesite=lax';
      return false;
    }
  } catch {
    // window/URLSearchParams unavailable — fall through to cookie check.
  }
  return document.cookie
    .split(';')
    .map((c) => c.trim())
    .some((c) => c === 'sl_debug=1');
}

function debugLog(label: string, payload: unknown): void {
  if (!isClickDebugEnabled()) return;
  console.log(`%c[sl_debug] ${label}`, 'color:#E040FB;font-weight:bold', payload);
}

// ─── Platform funnel events (client-side) ─────────────────────────────────────

/**
 * Tracks consented product funnel events without PII.
 *
 * These events intentionally carry only route locale, source surface and
 * deployment environment. Hosted auth owns credentials, so never add email,
 * names, handles or WorkOS identifiers here.
 */
export function trackPlatformFunnelEvent(
  event: AuthFunnelEventName,
  props: PlatformFunnelProps,
): void {
  if (!isAnalyticsAllowed()) return;

  const payload: AuthFunnelProps = {
    ...props,
    environment: getWebEnvironment(),
  };

  const ph = getPostHog();
  ph?.capture(event satisfies AnalyticsEventName, payload);
  trackUmamiEvent(event, { ...payload });
}

// ─── Public page events (client-side) ─────────────────────────────────────────

/**
 * Reports a link click both to PostHog (external analytics) and to the
 * StageLink backend (local DB — source of truth for the basic dashboard).
 *
 * Called from PublicPageClient when a block link is clicked.
 * Both calls are fire-and-forget — never awaited, never throw.
 *
 * GDPR-first: no analytics request is sent unless analytics consent is granted.
 *              X-SL-* quality headers are included when the API call is allowed.
 *
 * @param props  Click event payload (destination_url is used for domain extraction only).
 */
export function trackPublicLinkClick(
  props: Omit<PublicLinkClickProps, 'destination_domain'> & {
    destination_url?: string;
    blockId?: string;
    label?: string;
  },
): void {
  const allowed = isAnalyticsAllowed();
  debugLog('trackPublicLinkClick invoked', {
    consentAllowed: allowed,
    block_type: props.block_type,
    link_item_id: props.link_item_id,
    label: props.label,
    artist_id: props.artist_id,
  });
  if (!allowed) {
    debugLog('SKIPPED — analytics consent not granted', {
      hint: 'Accept analytics cookies on the public page to track clicks.',
    });
    return;
  }

  // 1. PostHog — only after explicit analytics consent.
  const ph = getPostHog();
  if (ph) {
    let destination_domain: string | undefined;
    if (props.destination_url) {
      try {
        destination_domain = new URL(props.destination_url).hostname;
      } catch {
        // Malformed URL — skip domain extraction
      }
    }

    const { destination_url: _url, blockId: _bid, label: _lbl, ...rest } = props;
    void _url;
    void _bid;
    void _lbl;

    ph.capture(ANALYTICS_EVENTS.PUBLIC_LINK_CLICKED, {
      ...rest,
      ...(destination_domain && { destination_domain }),
    });
  }

  // 2. Backend DB — only after explicit analytics consent.
  // X-SL-AC / X-SL-QA headers let the API persist consent state per event.
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4001';
  const url = `${apiUrl}/api/public/events/link-click`;
  const body = {
    artistId: props.artist_id,
    blockId: props.blockId,
    linkItemId: props.link_item_id,
    label: props.label,
    isSmartLink: props.is_smart_link,
    smartLinkId: props.smart_link_id ?? null,
  };
  const headers = {
    'Content-Type': 'application/json',
    ...buildQualityHeaders(),
  };
  debugLog('POST → backend', { url, headers, body });

  const fetchPromise = fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    // keepalive ensures the request completes even if the page navigates away.
    keepalive: true,
  });

  if (isClickDebugEnabled()) {
    fetchPromise
      .then((res) => debugLog(`backend response ${res.status}`, { ok: res.ok, status: res.status }))
      .catch((err) => debugLog('backend fetch threw', { error: String(err) }));
  } else {
    fetchPromise.catch(() => {
      // Recording failure must never surface to the visitor.
    });
  }
}
