'use client';

import { useEffect } from 'react';
import { ANALYTICS_EVENTS } from '@stagelink/types';
import { CONSENT_CHANGED_EVENT, isAnalyticsAllowed } from './consent';
import {
  clearPendingSignup,
  isPendingSignupForAccount,
  readPendingSignup,
} from './signup-conversion';
import { trackPlatformFunnelEvent } from './track';
import { isUmamiReady, UMAMI_READY_EVENT } from './umami';

interface SignupConversionTrackerProps {
  accountCreatedAt?: string;
  locale: string;
}

/**
 * Confirms a real signup only after hosted auth returns to an authenticated
 * StageLink surface and the internal account was created after signup started.
 */
export function SignupConversionTracker({
  accountCreatedAt,
  locale,
}: SignupConversionTrackerProps) {
  useEffect(() => {
    if (!accountCreatedAt) return;
    const createdAt = accountCreatedAt;

    function completePendingSignup() {
      const pendingSignup = readPendingSignup();
      if (!pendingSignup) return;

      if (!isPendingSignupForAccount(pendingSignup, createdAt)) {
        clearPendingSignup();
        return;
      }

      if (!isAnalyticsAllowed()) {
        clearPendingSignup();
        return;
      }

      if (!isUmamiReady()) return;

      trackPlatformFunnelEvent(ANALYTICS_EVENTS.AUTH_SIGNUP_COMPLETED, {
        locale,
        surface: 'signup',
      });
      clearPendingSignup();
    }

    completePendingSignup();
    window.addEventListener(CONSENT_CHANGED_EVENT, completePendingSignup);
    window.addEventListener(UMAMI_READY_EVENT, completePendingSignup);

    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, completePendingSignup);
      window.removeEventListener(UMAMI_READY_EVENT, completePendingSignup);
    };
  }, [accountCreatedAt, locale]);

  return null;
}
