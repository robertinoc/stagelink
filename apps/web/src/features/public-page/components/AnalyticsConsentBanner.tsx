'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { readConsentCookie, setConsentCookie } from '@/lib/analytics/consent';

/**
 * AnalyticsConsentBanner — T4-4 minimal analytics notice for public artist pages.
 *
 * Design principles:
 *  - Opt-out model: banner appears on first visit; no tracking is blocked until
 *    the visitor explicitly declines. This is compliant for basic aggregate analytics
 *    (page view counts, link clicks) under legitimate interest.
 *  - Non-intrusive: slim bar at the bottom of the viewport — does not block content.
 *  - Honest language: "Got it" enables additional analytics (PostHog); basic aggregate
 *    counts continue regardless under legitimate interest. "No thanks" disables PostHog.
 *  - No rehydration flash: the banner is intentionally mounted client-side only
 *    (useState initialised after first render check) to avoid SSR mismatch.
 *  - Localized: uses next-intl from the PublicArtistLayout provider.
 *
 * The `sl_ac` cookie is read by the web tier on every subsequent request and
 * forwarded as `X-SL-AC: 1/0` to the API, which stores it as
 * `analytics_events.has_tracking_consent`.
 */
export function AnalyticsConsentBanner() {
  const t = useTranslations('public_page.consent_banner');

  // null = not yet checked (avoid SSR flash), false = hide, true = show
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    // Show only if the visitor has not yet made a choice.
    setVisible(readConsentCookie() === null);
  }, []);

  // Not yet checked (first render) or already decided — render nothing.
  if (!visible) return null;

  function handleAccept() {
    setConsentCookie(true);
    setVisible(false);
  }

  function handleReject() {
    setConsentCookie(false);
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label="Analytics notice"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/80 px-4 py-3 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <p className="text-center text-xs text-white/70 sm:text-left">{t('notice')}</p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={handleReject}
            className="rounded px-3 py-1.5 text-xs text-white/50 transition-colors hover:text-white/80"
          >
            {t('reject')}
          </button>
          <button
            onClick={handleAccept}
            className="rounded bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
