'use client';

import { useState } from 'react';

interface ReleaseCoverImageProps {
  /** Cover URL provided by the artist, or `null` when none. */
  coverUrl: string | null;
  /** Release title — used for alt text and the fallback's accessibility label. */
  alt: string;
  /** Tailwind classes for sizing/border/etc. Forwarded to both the `<img>` and the fallback. */
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

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={coverUrl} alt={alt} className={className} onError={() => setFailed(true)} />;
}
