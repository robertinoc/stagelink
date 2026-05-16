'use client';
/**
 * Pseudorandom demo profile selection with 24h persistence.
 *
 * Strategy:
 * - Uses localStorage key 'stagelink_demo_profile' with { id, expiresAt }
 * - On first visit (or after 24h): picks a profile based on Math.random()
 * - Returns { profile, isLoaded } — isLoaded is false on server/first render
 *   to prevent hydration mismatch. Use the default (index 0) until loaded.
 *
 * Tracking:
 * - Fires getPostHog()?.capture('landing_demo_profile_shown', {...}) once per selection
 * - No-op if PostHog is not available or not initialized
 */
import { useState, useEffect } from 'react';
import { DEMO_PROFILES, type DemoProfile } from '@/features/marketing/data/demo-profiles';
import { getPostHog } from '@/lib/analytics/posthog';

const STORAGE_KEY = 'stagelink_demo_profile';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface StoredProfile {
  id: string;
  expiresAt: number;
}

export function useDemoProfile(locale: string = 'en'): {
  profile: DemoProfile;
  isLoaded: boolean;
} {
  // Default to first profile (server-side safe, no hydration mismatch)
  const [profile, setProfile] = useState<DemoProfile>(DEMO_PROFILES[0]!);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let selectedId: string | null = null;

      if (stored) {
        const parsed = JSON.parse(stored) as StoredProfile;
        if (parsed.expiresAt > Date.now()) {
          selectedId = parsed.id;
        }
      }

      if (!selectedId) {
        // Pick a new random profile
        const idx = Math.floor(Math.random() * DEMO_PROFILES.length);
        const selected = DEMO_PROFILES[idx]!;
        selectedId = selected.id;
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ id: selectedId, expiresAt: Date.now() + TTL_MS }),
        );

        // Fire tracking event once per selection (not per render)
        const ph = getPostHog();
        if (ph) {
          ph.capture('landing_demo_profile_shown', {
            profileId: selected.id,
            profileName: selected.name,
            artistType: selected.artistType,
            locale,
            sourcePage: 'landing',
            selectionMode: 'random_24h',
          });
        }
      }

      const found = DEMO_PROFILES.find((p) => p.id === selectedId) ?? DEMO_PROFILES[0]!;
      setProfile(found);
    } catch {
      // localStorage unavailable (private mode, etc.) — keep default
    }
    setIsLoaded(true);
  }, [locale]);

  return { profile, isLoaded };
}
