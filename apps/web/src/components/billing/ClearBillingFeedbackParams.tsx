'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const TRANSIENT_BILLING_PARAMS = ['checkout', 'portal', 'refresh', 'error'] as const;

export function ClearBillingFeedbackParams() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    let mutated = false;

    for (const key of TRANSIENT_BILLING_PARAMS) {
      if (nextParams.has(key)) {
        nextParams.delete(key);
        mutated = true;
      }
    }

    if (!mutated) return;

    const nextSearch = nextParams.toString();
    const nextUrl = nextSearch ? `${pathname}?${nextSearch}` : pathname;
    window.history.replaceState(window.history.state, '', nextUrl);
  }, [pathname, searchParams]);

  return null;
}
