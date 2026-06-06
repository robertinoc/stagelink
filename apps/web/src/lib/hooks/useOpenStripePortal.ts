'use client';

import { useState } from 'react';

interface UseOpenStripePortalOptions {
  /** Deep-link the portal to a "switch to {plan}" confirmation screen. */
  targetPlan?: 'pro' | 'pro_plus';
}

/**
 * Opens the Stripe Customer Portal in a NEW TAB reliably across every browser,
 * including mobile Safari.
 *
 * Browsers only allow `window.open` during a user gesture. An awaited `fetch`
 * loses that gesture, so opening the tab AFTER fetching the portal URL gets
 * blocked (or silently opens in-place) on iOS Safari and with popup blockers.
 *
 * Fix: open a blank tab SYNCHRONOUSLY inside the click handler (still within the
 * gesture), then point that already-open tab at the portal URL once the fetch
 * resolves. If the tab was still blocked, fall back to same-tab navigation so
 * the user always reaches the portal. We don't pass `noopener` to `window.open`
 * (that returns `null`, leaving no handle to navigate); instead we null the
 * child tab's `opener` to keep tab-nabbing protection.
 */
export function useOpenStripePortal(artistId: string, options?: UseOpenStripePortalOptions) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const open = async () => {
    setPending(true);
    setError(false);

    // Open the tab now, synchronously, while we still hold the user gesture.
    const portalTab = window.open('', '_blank');
    if (portalTab) portalTab.opener = null;

    try {
      const res = await fetch(`/api/billing/${artistId}/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: window.location.href,
          targetPlan: options?.targetPlan,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { url } = (await res.json()) as { url?: string };
      if (!url) throw new Error('no url');

      if (portalTab && !portalTab.closed) {
        portalTab.location.href = url;
      } else {
        // The synchronous open was still blocked — guarantee the user reaches
        // the portal by navigating the current tab instead.
        window.location.href = url;
      }
    } catch {
      portalTab?.close();
      setError(true);
    } finally {
      setPending(false);
    }
  };

  return { open, pending, error };
}
