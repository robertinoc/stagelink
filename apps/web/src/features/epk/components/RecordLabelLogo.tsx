'use client';

import { useState } from 'react';

interface RecordLabelLogoProps {
  /** Resolved logo URL — explicit logoUrl, Clearbit fallback, or null when nothing usable. */
  logoSrc: string | null;
  /** Label name (used for alt text). */
  alt: string;
  /** Tailwind class string for sizing/border/etc. Forwarded to both the <img> and the fallback. */
  className?: string;
}

/**
 * RecordLabelLogo
 *
 * Renders a record-label logo with a graceful fallback. Lives as a client
 * component so we can use the <img> `onError` handler — required because
 * PublicEpkView is a Server Component (React 19 / Next.js 16 reject event
 * handlers on JSX rendered server-side).
 *
 * Fallback chain:
 *   1. Render the provided <img src={logoSrc}> when available
 *   2. If the image fails to load (404, CORS, Clearbit miss…), swap to the
 *      vinyl 📀 emoji so the row keeps a sensible visual instead of a broken
 *      image icon.
 *   3. If no logoSrc was provided at all, render the fallback directly.
 */
export function RecordLabelLogo({ logoSrc, alt, className }: RecordLabelLogoProps) {
  const [failed, setFailed] = useState(false);

  if (!logoSrc || failed) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={`${className ?? ''} inline-flex items-center justify-center text-base leading-none`}
      >
        📀
      </span>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={logoSrc} alt={alt} className={className} onError={() => setFailed(true)} />;
}
