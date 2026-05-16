'use client';
/**
 * Client wrapper that injects a pseudorandom demo profile into the landing hero mockup.
 *
 * - Uses DEMO_PROFILES[0] as the SSR default (hydration-safe, no mismatch).
 * - After hydration, swaps to the 24h-persisted random selection from localStorage.
 * - Passes the resolved profile as props to the pure visual component LandingDemoMockup.
 */
import { useDemoProfile } from '@/hooks/useDemoProfile';
import { LandingDemoMockup } from './LandingDemoMockup';

interface LandingDemoProfileWrapperProps {
  locale: string;
}

export function LandingDemoProfileWrapper({ locale }: LandingDemoProfileWrapperProps) {
  const { profile } = useDemoProfile(locale);
  return <LandingDemoMockup profile={profile} locale={locale} />;
}
