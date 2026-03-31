'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * QaModeInitializer — T4-4 QA mode cookie setter.
 *
 * Reads the `?sl_qa` URL param on the public artist page and manages the
 * `sl_qa` session cookie. On subsequent requests within the same session,
 * the web tier (public-api.ts) reads this cookie and forwards `X-SL-QA: 1`
 * to the API, which tags all analytics events with `isQa = true` so they are
 * excluded from the artist's dashboard metrics.
 *
 * Usage:
 *   ?sl_qa=1   Enter QA mode. Cookie persists for the browser session.
 *   ?sl_qa=0   Exit QA mode explicitly. Clears the cookie immediately.
 *              (Also clears on tab/session close — no Max-Age is set.)
 *
 * Security note: this mechanism is unauthenticated — any visitor who knows
 * the param can tag their own traffic as QA. The risk is intentionally
 * accepted for MVP: the only consequence is self-exclusion from metrics.
 * Do NOT share URLs containing ?sl_qa=1 publicly.
 *
 * This component renders nothing — it is a side-effect-only initializer.
 */
export function QaModeInitializer() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const qaParam = searchParams.get('sl_qa');
    if (qaParam === '1') {
      // Enter QA mode: session cookie — no Max-Age, expires when tab closes.
      document.cookie = 'sl_qa=1; Path=/; SameSite=Lax';
    } else if (qaParam === '0') {
      // Explicit exit: delete the cookie by setting Max-Age=0.
      document.cookie = 'sl_qa=; Max-Age=0; Path=/; SameSite=Lax';
    }
  }, [searchParams]);

  return null;
}
