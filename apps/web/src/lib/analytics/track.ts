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
 * Privacy rules enforced here:
 *   - No full URLs — referrer domain and destination domain only
 *   - No email addresses
 *   - No raw IPs (PostHog is initialized with ip:false)
 */

import { ANALYTICS_EVENTS } from '@stagelink/types';
import type { PublicLinkClickProps } from '@stagelink/types';
import { getPostHog } from './posthog';

// ─── Public page events (client-side) ─────────────────────────────────────────

/**
 * Reports a link click both to PostHog (external analytics) and to the
 * StageLink backend (local DB — source of truth for the basic dashboard).
 *
 * Called from PublicPageClient when a block link is clicked.
 * Both calls are fire-and-forget — never awaited, never throw.
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
  // 1. PostHog — external analytics (advanced dashboards T4-4, T6-4)
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

  // 2. Backend DB — source of truth for basic analytics dashboard
  // Fire-and-forget: if the request fails, the visitor experience is unaffected.
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4001';
  void fetch(`${apiUrl}/api/public/events/link-click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
