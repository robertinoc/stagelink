import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import type { PublicPageResponse } from '@stagelink/types';
import { PublicPageClient } from './PublicPageClient';

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
 *   │  │  Free-plan branding slot (when applicable)         │ │
 *   │  └────────────────────────────────────────────────────┘ │
 *   └────────────────────────────────────────────────────────┘
 */
export async function ArtistPageView({ page }: ArtistPageViewProps) {
  const t = await getTranslations('public_page');
  const locale = await getLocale();
  const { artist, blocks } = page;
  const socialLinks = [
    artist.instagramUrl && { href: artist.instagramUrl, label: t('social.instagram') },
    artist.tiktokUrl && { href: artist.tiktokUrl, label: t('social.tiktok') },
    artist.youtubeUrl && { href: artist.youtubeUrl, label: t('social.youtube') },
    artist.spotifyUrl && { href: artist.spotifyUrl, label: t('social.spotify') },
    artist.soundcloudUrl && { href: artist.soundcloudUrl, label: t('social.soundcloud') },
    artist.websiteUrl && { href: artist.websiteUrl, label: t('social.website') },
  ].filter((item): item is { href: string; label: string } => Boolean(item));

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950">
      {/* Cover image */}
      {artist.coverUrl && (
        <div className="relative h-40 w-full sm:h-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artist.coverUrl}
            alt={t('cover_image_alt', { name: artist.displayName })}
            className="h-full w-full object-cover"
          />
          {/* Gradient overlay — blends into the page background */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900" />
        </div>
      )}

      <div className="mx-auto max-w-md px-4 pb-16">
        {/* Artist header */}
        <div className={`mb-8 text-center ${artist.coverUrl ? '-mt-12' : 'pt-12'}`}>
          {/* Avatar */}
          <div className="mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full bg-zinc-800 ring-4 ring-zinc-900">
            {artist.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={artist.avatarUrl}
                alt={artist.displayName}
                className="block h-full w-full object-cover object-top"
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

          {socialLinks.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  {social.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Published blocks — delegated to a client component for click tracking */}
        {blocks.length > 0 ? (
          <PublicPageClient page={page} />
        ) : (
          <p className="text-center text-sm text-zinc-600">{t('no_blocks')}</p>
        )}

        {page.showStageLinkBranding && (
          <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-5 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm">
            <p className="text-sm font-medium text-zinc-100">{t('branding_slot.title')}</p>
            <Link
              href={`/${locale}/pricing`}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400"
            >
              {t('branding_slot.cta')}
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-zinc-400">
              {t.rich('branding_slot.secondary', {
                brand: (chunks) => (
                  <Link href={`/${locale}`} className="font-medium text-zinc-200 hover:text-white">
                    {chunks}
                  </Link>
                ),
                signup: (chunks) => (
                  <Link
                    href={`/${locale}/signup`}
                    className="font-medium text-zinc-200 underline decoration-zinc-500 underline-offset-4 transition hover:text-white hover:decoration-zinc-300"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
