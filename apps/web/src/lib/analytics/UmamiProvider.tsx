'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { CONSENT_CHANGED_EVENT, isAnalyticsAllowed } from './consent';

const DEFAULT_UMAMI_SCRIPT_URL = 'https://cloud.umami.is/script.js';
const DEFAULT_UMAMI_DOMAINS = 'stagelink.art,www.stagelink.art';
const UMAMI_SCRIPT_ID = 'stagelink-umami-script';
const PLATFORM_ROUTE_SEGMENTS = new Set([
  'blog',
  'dashboard',
  'docs',
  'install',
  'login',
  'onboarding',
  'pricing',
  'settings',
  'signup',
  'suspended',
]);

interface UmamiProviderProps {
  children: React.ReactNode;
}

function removeUmamiScript(): void {
  document.getElementById(UMAMI_SCRIPT_ID)?.remove();
}

function parseAllowedDomains(domains: string): string[] {
  return domains
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
}

function isPlatformPath(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return true;

  const section = segments[1];
  return section === undefined || PLATFORM_ROUTE_SEGMENTS.has(section);
}

export function UmamiProvider({ children }: UmamiProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    const websiteId =
      process.env.NEXT_PUBLIC_UMAMI_PLATFORM_WEBSITE_ID ?? process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
    const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? DEFAULT_UMAMI_SCRIPT_URL;
    const hostUrl = process.env.NEXT_PUBLIC_UMAMI_HOST_URL;
    const domains = process.env.NEXT_PUBLIC_UMAMI_DOMAINS || DEFAULT_UMAMI_DOMAINS;
    const allowedDomains = parseAllowedDomains(domains);

    function syncPlatformUmami() {
      const currentHostname = window.location.hostname.toLowerCase();

      if (
        !websiteId ||
        !allowedDomains.includes(currentHostname) ||
        !isPlatformPath(pathname) ||
        !isAnalyticsAllowed()
      ) {
        removeUmamiScript();
        return;
      }

      const existing = document.getElementById(UMAMI_SCRIPT_ID) as HTMLScriptElement | null;
      if (existing?.dataset.websiteId === websiteId) return;

      removeUmamiScript();

      const script = document.createElement('script');
      script.id = UMAMI_SCRIPT_ID;
      script.defer = true;
      script.src = scriptUrl;
      script.dataset.websiteId = websiteId;
      script.dataset.doNotTrack = 'true';

      if (hostUrl) script.dataset.hostUrl = hostUrl;
      if (domains) script.dataset.domains = domains;

      document.head.appendChild(script);
    }

    syncPlatformUmami();
    window.addEventListener(CONSENT_CHANGED_EVENT, syncPlatformUmami);

    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, syncPlatformUmami);
      removeUmamiScript();
    };
  }, [pathname]);

  return <>{children}</>;
}
