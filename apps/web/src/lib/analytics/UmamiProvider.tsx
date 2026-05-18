'use client';

import { useEffect } from 'react';

const DEFAULT_UMAMI_SCRIPT_URL = 'https://cloud.umami.is/script.js';
const DEFAULT_UMAMI_DOMAINS = 'behind.stagelink.art';
const UMAMI_SCRIPT_ID = 'stagelink-umami-script';

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

export function UmamiProvider({ children }: UmamiProviderProps) {
  useEffect(() => {
    const websiteId = process.env.NEXT_PUBLIC_UMAMI_BEHIND_WEBSITE_ID;
    const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? DEFAULT_UMAMI_SCRIPT_URL;
    const hostUrl = process.env.NEXT_PUBLIC_UMAMI_HOST_URL;
    const domains = process.env.NEXT_PUBLIC_UMAMI_DOMAINS || DEFAULT_UMAMI_DOMAINS;
    const allowedDomains = parseAllowedDomains(domains);
    const currentHostname = window.location.hostname.toLowerCase();

    if (!websiteId || !allowedDomains.includes(currentHostname)) {
      removeUmamiScript();
      return undefined;
    }

    const existing = document.getElementById(UMAMI_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing?.dataset.websiteId === websiteId) return undefined;

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

    return () => {
      removeUmamiScript();
    };
  }, []);

  return <>{children}</>;
}
