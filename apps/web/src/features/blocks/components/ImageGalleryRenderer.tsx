import type { ImageGalleryBlockConfig } from '@stagelink/types';

interface ImageGalleryRendererProps {
  title: string | null;
  config: ImageGalleryBlockConfig;
}

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
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={title ? `${title} ${index + 1}` : `Gallery image ${index + 1}`}
              className="aspect-[4/5] h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
