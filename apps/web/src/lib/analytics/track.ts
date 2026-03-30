/**
 * Typed event-tracking helpers for the StageLink web app.
 *
 * These are the ONLY functions that should call PostHog directly.
 * Components import from here — never from posthog-js.
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
 * Tracks a click on a link or CTA inside a public artist page.
 * Called from PublicPageClient when a block link is clicked.
 *
 * The `destination_domain` is extracted here to avoid sending full URLs.
 */
export function trackPublicLinkClick(
  props: Omit<PublicLinkClickProps, 'destination_domain'> & {
    destination_url?: string;
  },
): void {
  const ph = getPostHog();
  if (!ph) return;

  // Extract domain only — full destination URL is private per our privacy policy.
  let destination_domain: string | undefined;
  if (props.destination_url) {
    try {
      destination_domain = new URL(props.destination_url).hostname;
    } catch {
      // Malformed URL — skip domain extraction, don't crash
    }
  }

  const { destination_url: _url, ...rest } = props;
  void _url; // consumed above

  ph.capture(ANALYTICS_EVENTS.PUBLIC_LINK_CLICK, {
    ...rest,
    ...(destination_domain && { destination_domain }),
  });
}
