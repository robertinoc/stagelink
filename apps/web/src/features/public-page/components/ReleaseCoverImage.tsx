'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ReleaseCoverImageProps {
  /** Cover URL provided by the artist, or `null` when none. */
  coverUrl: string | null;
  /** Release title — used for alt text and the fallback's accessibility label. */
  alt: string;
  /** Tailwind classes for sizing/border/etc. Forwarded to the wrapper, so the
   *  caller still controls aspect ratio and width. */
  className?: string;
}

/**
 * Release cover that gracefully falls back to a 💿 emoji when the URL is
 * missing or fails to load.
 *
 * Sibling to `RecordLabelLogo` (introduced in PR #336 — see that file for the
 * server-component-vs-onError reasoning). `ReleasesSection` is server-rendered,
 * so we can't put `<img onError>` directly there; this tiny client component
 * owns the failure state.
 *
 * Uses `next/image` with `fill` inside a positioned wrapper. The wrapper
 * inherits the caller's `className` (which already sets `aspect-square w-full`
 * etc.) plus `relative overflow-hidden` so the absolutely positioned image is
 * clipped to the rounded corners.
 */
export function ReleaseCoverImage({ coverUrl, alt, className }: ReleaseCoverImageProps) {
  const [failed, setFailed] = useState(false);

  if (!coverUrl || failed) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={`${className ?? ''} inline-flex items-center justify-center bg-white/5 text-3xl leading-none`}
      >
        💿
      </span>
    );
  }

  return (
    <div className={`${className ?? ''} relative overflow-hidden`}>
      <Image
        src={coverUrl}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
        unoptimized={!process.env.NEXT_PUBLIC_IMAGES_HOSTNAME}
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
