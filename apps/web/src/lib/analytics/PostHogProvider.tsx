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
import { initPostHog } from './posthog';

interface PostHogProviderProps {
  children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    // Initialize once after mount. Safe to call multiple times — idempotent.
    initPostHog();
  }, []);

  return <>{children}</>;
}
