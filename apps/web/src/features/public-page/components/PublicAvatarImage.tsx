'use client';

import Image from 'next/image';
import { useState } from 'react';

interface PublicAvatarImageProps {
  src: string | null;
  alt: string;
}

/**
 * Public-page artist avatar.
 *
 * Rendered inside a fixed-size, positioned wrapper in `ArtistPageView`
 * (`absolute h-28 w-28 sm:h-32 sm:w-32`), which qualifies as `next/image`'s
 * `fill` containing block. We pass `unoptimized` whenever
 * `NEXT_PUBLIC_IMAGES_HOSTNAME` isn't set so deploys without the env var
 * still render via passthrough instead of crashing on a missing
 * `remotePatterns` entry.
 */
export function PublicAvatarImage({ src, alt }: PublicAvatarImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-700 text-2xl font-bold text-white">
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 112px, 128px"
      unoptimized={!process.env.NEXT_PUBLIC_IMAGES_HOSTNAME}
      // Conservative default until assets support focal-point metadata.
      className="block object-cover object-center"
      onError={() => setFailed(true)}
    />
  );
}
