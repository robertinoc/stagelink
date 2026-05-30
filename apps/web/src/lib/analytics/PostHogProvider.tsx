'use client';

/**
 * PostHogProvider — initializes PostHog once on the client side.
 *
 * Must wrap the entire app (or at minimum the authenticated layout)
 * so that PostHog is ready before any `track*()` call.
 *
 * Placed in the layout tree just inside the React root — it renders
 * `children` directly, adding no visible DOM nodes.
 *
 * Note: we do NOT use posthog-js/react's <PostHogProvider> because it
 * requires the key at render time and couples the initialization path.
 * Our singleton pattern in posthog.ts gives us more control.
 */

import { useEffect } from 'react';
import { CONSENT_CHANGED_EVENT, isAnalyticsAllowed } from './consent';
import { disablePostHog, initPostHog } from './posthog';

interface PostHogProviderProps {
  children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    function syncAnalyticsConsent() {
      if (isAnalyticsAllowed()) {
        // initPostHog is async because it dynamically imports the SDK chunk.
        // Fire-and-forget: tracking calls before init resolves return null
        // from getPostHog() and are silently dropped, which is the correct
        // semantic for consent-pending traffic.
        void initPostHog();
      } else {
        disablePostHog();
      }
    }

    syncAnalyticsConsent();
    window.addEventListener(CONSENT_CHANGED_EVENT, syncAnalyticsConsent);

    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, syncAnalyticsConsent);
    };
  }, []);

  return <>{children}</>;
}
