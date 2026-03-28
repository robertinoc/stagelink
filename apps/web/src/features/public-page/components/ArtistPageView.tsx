import Image from 'next/image';
import type { PublicPageResponse } from '@stagelink/types';
import { BlockRenderer } from '@/features/blocks/components/BlockRenderer';

interface ArtistPageViewProps {
  page: PublicPageResponse;
}

/**
 * Public artist page — renders the artist header and all published blocks.
 *
 * Server Component: no client-side state needed at this level.
 * Individual blocks that require client state (e.g. EmailCaptureRenderer)
 * create their own client boundary.
 *
 * Layout:
 *   ┌─ Cover image (full width, if present) ─────────────────┐
 *   │  ┌─ max-w-md centered column ─────────────────────────┐ │
 *   │  │  Avatar + name + bio                               │ │
 *   │  │  Published blocks (in position order)              │ │
 *   │  │  "Powered by StageLink" footer                     │ │
 *   │  └────────────────────────────────────────────────────┘ │
 *   └────────────────────────────────────────────────────────┘
 */
export function ArtistPageView({ page }: ArtistPageViewProps) {
  const { artist, blocks } = page;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950">
      {/* Cover image */}
      {artist.coverUrl && (
        <div className="relative h-40 w-full sm:h-56">
          <Image
            src={artist.coverUrl}
            alt={`${artist.displayName} cover`}
            fill
            className="object-cover"
            priority
          />
          {/* Gradient overlay — blends into the page background */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900" />
        </div>
      )}

      <div className="mx-auto max-w-md px-4 pb-16">
        {/* Artist header */}
        <div className={`mb-8 text-center ${artist.coverUrl ? '-mt-12' : 'pt-12'}`}>
          {/* Avatar */}
          <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full ring-4 ring-zinc-900">
            {artist.avatarUrl ? (
              <Image
                src={artist.avatarUrl}
                alt={artist.displayName}
                width={96}
                height={96}
                className="h-full w-full object-cover"
                priority
              />
            ) : (
              /* Fallback — initials */
              <div className="flex h-full w-full items-center justify-center bg-zinc-700 text-2xl font-bold text-white">
                {artist.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white">{artist.displayName}</h1>
          <p className="mt-0.5 text-sm text-zinc-400">@{artist.username}</p>

          {artist.bio && <p className="mt-3 text-sm leading-relaxed text-zinc-300">{artist.bio}</p>}
        </div>

        {/* Published blocks */}
        {blocks.length > 0 ? (
          <div className="space-y-4">
            {blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-zinc-600">Nothing here yet.</p>
        )}

        {/* Footer */}
        <p className="mt-12 text-center text-xs text-zinc-700">
          Powered by <span className="text-zinc-500">StageLink</span>
        </p>
      </div>
    </div>
  );
}
