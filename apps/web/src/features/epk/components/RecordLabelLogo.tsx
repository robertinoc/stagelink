'use client';

import { useState, useEffect, useRef } from 'react';

interface RecordLabelLogoProps {
  /** Resolved logo URL — explicit logoUrl or null when nothing usable. */
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
 *   2. If the image fails to load (404, CORS…), swap to the vinyl 📀 emoji
 *      so the row keeps a sensible visual instead of a broken image icon.
 *   3. If no logoSrc was provided at all, render the fallback directly.
 *
 * SSR race-condition guard:
 *   The browser may begin fetching (and failing) the image before React
 *   hydrates and attaches the onError handler, leaving a broken-image icon
 *   stuck on screen. After hydration we imperatively check img.complete and
 *   img.naturalWidth — a complete image with naturalWidth === 0 means the
 *   load already failed — and flip the failed state accordingly.
 */
export function RecordLabelLogo({ logoSrc, alt, className }: RecordLabelLogoProps) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // After hydration, check if the image already failed to load before
    // React had a chance to attach the onError handler.
    const img = imgRef.current;
    if (!img) return;
    // img.complete is true when the browser finished the load attempt
    // (success OR failure). naturalWidth === 0 means the image is broken.
    if (img.complete && img.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

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
  return (
    <img
      ref={imgRef}
      src={logoSrc}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
