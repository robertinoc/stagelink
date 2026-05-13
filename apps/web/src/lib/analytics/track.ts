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
import type { PublicLinkClickProps } from '@stagelink/types';
import { getPostHog } from './posthog';
import { isAnalyticsAllowed, getConsentHeaderValue } from './consent';

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
  if (!isAnalyticsAllowed()) return;

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
  void fetch(`${apiUrl}/api/public/events/link-click`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildQualityHeaders(),
    },
    body: JSON.stringify({
      artistId: props.artist_id,
      blockId: props.blockId,
      linkItemId: props.link_item_id,
      label: props.label,
      isSmartLink: props.is_smart_link,
      smartLinkId: props.smart_link_id ?? null,
    }),
    // keepalive ensures the request completes even if the page navigates away.
    keepalive: true,
  }).catch(() => {
    // Recording failure must never surface to the visitor.
  });
}
