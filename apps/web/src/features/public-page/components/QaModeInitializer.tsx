'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * QaModeInitializer — T4-4 QA mode cookie setter.
 *
 * Reads the `?sl_qa=1` URL param on the public artist page and persists it as
 * the `sl_qa` session cookie. On subsequent requests within the same session,
 * the web tier (public-api.ts) reads this cookie and forwards `X-SL-QA: 1` to
 * the API, which tags all analytics events with `isQa = true`.
 *
 * Usage: append `?sl_qa=1` to any artist page URL to enter QA mode.
 * QA mode ends when the browser tab/session closes (no Max-Age set).
 *
 * This component renders nothing — it is a side-effect-only initializer.
 */
export function QaModeInitializer() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('sl_qa') === '1') {
      // Session cookie — no Max-Age, expires when tab/session closes.
      document.cookie = 'sl_qa=1; Path=/; SameSite=Lax';
    }
  }, [searchParams]);

  return null;
}
