import Image from 'next/image';
import type { ImageGalleryBlockConfig } from '@stagelink/types';

interface ImageGalleryRendererProps {
  title: string | null;
  config: ImageGalleryBlockConfig;
}

/**
 * Public-page gallery grid. Renders 2 cols on mobile, 3 on tablet+.
 *
 * Each thumbnail is wrapped in a `relative + aspect-[4/5] + overflow-hidden`
 * cell so `next/image` with `fill` has both a containing block and an
 * implicit height — the same pattern PR #432 introduced on cover / avatar /
 * release covers.
 *
 * Lazy-loading is `next/image`'s default; the cells are below the fold on
 * every artist page so the browser only requests them when the user scrolls
 * close. Combined with Vercel's WebP/AVIF transcoding this drops the
 * per-thumbnail payload from a 1–3 MB R2 original to ~20–40 kB at the
 * rendered size, which was the bulk of the "Mejorar la entrega de imágenes
 * — 12 MB" finding on PageSpeed Insights.
 *
 * `unoptimized={!process.env.NEXT_PUBLIC_IMAGES_HOSTNAME}` mirrors the
 * existing safety net so deploys without the env keep rendering the
 * gallery (passthrough) instead of crashing on a missing remotePatterns
 * entry.
 */
export function ImageGalleryRenderer({ title, config }: ImageGalleryRendererProps) {
  if (!config.imageUrls || config.imageUrls.length < 2) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm">
      {title && <h2 className="mb-4 text-sm font-semibold tracking-wide text-zinc-100">{title}</h2>}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {config.imageUrls.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
          >
            <Image
              src={url}
              alt={title ? `${title} ${index + 1}` : `Gallery image ${index + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 320px"
              unoptimized={!process.env.NEXT_PUBLIC_IMAGES_HOSTNAME}
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
