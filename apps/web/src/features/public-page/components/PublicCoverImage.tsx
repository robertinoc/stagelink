'use client';

import Image from 'next/image';
import { useState } from 'react';

interface PublicCoverImageProps {
  src: string;
  alt: string;
}

/**
 * Public-page hero cover. This is the LCP element on the artist page on
 * mobile and desktop, so we mark it `priority` (Next preloads it instead
 * of lazy-loading). Parent in `ArtistPageView` is
 * `relative h-52 sm:h-64`, which sizes the fill container.
 *
 * `sizes` reflects the actual rendered width: full-viewport up to the
 * 1024 px breakpoint where the page container caps out.
 */
export function PublicCoverImage({ src, alt }: PublicCoverImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className="h-full w-full bg-zinc-900" aria-hidden="true" />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority
      sizes="(max-width: 1024px) 100vw, 1024px"
      unoptimized={!process.env.NEXT_PUBLIC_IMAGES_HOSTNAME}
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}
