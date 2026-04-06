'use client';

import { useState } from 'react';

interface PublicAvatarImageProps {
  src: string | null;
  alt: string;
}

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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      // Conservative default until assets support focal-point metadata.
      className="block h-full w-full object-cover object-center"
      onError={() => setFailed(true)}
    />
  );
}
