'use client';

import { useState } from 'react';

interface PublicCoverImageProps {
  src: string;
  alt: string;
}

export function PublicCoverImage({ src, alt }: PublicCoverImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className="h-full w-full bg-zinc-900" aria-hidden="true" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}
