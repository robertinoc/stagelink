'use client';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Download, FileText, Globe, Instagram, Mail, Sparkles, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type {
  MusicEmbedBlockConfig,
  PublicPageResponse,
  VideoEmbedBlockConfig,
} from '@stagelink/types';
import { SUPPORTED_LOCALES } from '@stagelink/types';
import { useLocaleTranslation } from '@/lib/hooks/useLocaleTranslation';
import { extractTranslatablePageContent, applyTranslationsToPage } from '@/lib/page-translation';
import { PublicPageClient } from './PublicPageClient';
import { PublicAvatarImage } from './PublicAvatarImage';
import { PublicCoverImage } from './PublicCoverImage';
import { SocialIconLink } from './SocialIconLink';
import {
  SpotifyIcon,
  YouTubeIcon,
  TikTokIcon,
  SoundCloudIcon,
  AppleMusicIcon,
  AmazonMusicIcon,
  DeezerIcon,
  TidalIcon,
  BeatportIcon,
  TraxsourceIcon,
} from './SocialPlatformIcons';

interface ArtistPageViewProps {
  page: PublicPageResponse;
}

type IconComponent = (props: { className?: string }) => React.ReactElement;

export function ArtistPageView({ page }: ArtistPageViewProps) {
  const t = useTranslations('public_page');

  // ── Client-side auto-translate ──────────────────────────────────────────────
  const { currentContent, activeLocale, translating, translateError, switchLocale, dismissError } =
    useLocaleTranslation(page, extractTranslatablePageContent, applyTranslationsToPage, {
      // The text actually served is in `contentLocale` (field-level resolution,
      // PR #531) — not necessarily the URL `locale`. Translating from the wrong
      // source language can produce a visual no-op, so prefer contentLocale.
      baseLocale: page.contentLocale ?? page.locale,
      pageId: page.pageId,
    });

  const { artist, blocks } = currentContent;

  const socialLinks = [
    artist.instagramUrl && {
      href: artist.instagramUrl,
      label: t('social.instagram'),
      key: 'instagram',
      color: '#E1306C',
      Icon: Instagram as IconComponent,
    },
    artist.tiktokUrl && {
      href: artist.tiktokUrl,
      label: t('social.tiktok'),
      key: 'tiktok',
      color: '#FF0050',
      Icon: TikTokIcon as IconComponent,
    },
    artist.youtubeUrl && {
      href: artist.youtubeUrl,
      label: t('social.youtube'),
      key: 'youtube',
      color: '#FF0000',
      Icon: YouTubeIcon as IconComponent,
    },
    artist.spotifyUrl && {
      href: artist.spotifyUrl,
      label: t('social.spotify'),
      key: 'spotify',
      color: '#1DB954',
      Icon: SpotifyIcon as IconComponent,
    },
    artist.soundcloudUrl && {
      href: artist.soundcloudUrl,
      label: t('social.soundcloud'),
      key: 'soundcloud',
      color: '#FF5500',
      Icon: SoundCloudIcon as IconComponent,
    },
    artist.appleMusicUrl && {
      href: artist.appleMusicUrl,
      label: t('social.apple_music'),
      key: 'apple_music',
      color: '#FC3C44',
      Icon: AppleMusicIcon as IconComponent,
    },
    artist.amazonMusicUrl && {
      href: artist.amazonMusicUrl,
      label: t('social.amazon_music'),
      key: 'amazon_music',
      color: '#00A8E1',
      Icon: AmazonMusicIcon as IconComponent,
    },
    artist.deezerUrl && {
      href: artist.deezerUrl,
      label: t('social.deezer'),
      key: 'deezer',
      color: '#A238FF',
      Icon: DeezerIcon as IconComponent,
    },
    artist.tidalUrl && {
      href: artist.tidalUrl,
      label: t('social.tidal'),
      key: 'tidal',
      color: '#25F4EE',
      Icon: TidalIcon as IconComponent,
    },
    artist.beatportUrl && {
      href: artist.beatportUrl,
      label: t('social.beatport'),
      key: 'beatport',
      color: '#01FF95',
      Icon: BeatportIcon as IconComponent,
    },
    artist.traxsourceUrl && {
      href: artist.traxsourceUrl,
      label: t('social.traxsource'),
      key: 'traxsource',
      color: '#FF6600',
      Icon: TraxsourceIcon as IconComponent,
    },
    artist.websiteUrl && {
      href: artist.websiteUrl,
      label: t('social.website'),
      key: 'website',
      color: '#8B5CF6',
      Icon: Globe as IconComponent,
    },
  ].filter(
    (
      item,
    ): item is {
      href: string;
      label: string;
      key: string;
      color: string;
      Icon: IconComponent; // still used as JSX in the render (<social.Icon />)
    } => Boolean(item),
  );

  const categoryLabels = [artist.category, ...artist.secondaryCategories].map((category) =>
    t(`categories.${category}`),
  );
  const descriptorLine = categoryLabels.join(t('tagline_separator'));

  // Blocks render in the exact position order the artist defined in the dashboard
  // (the API already returns them ordered by `position ASC`). No type grouping and
  // no section headers — each block surfaces its own optional title. This is what
  // makes the page 100% user-orderable.

  // If the artist has ANY published text blocks they are managing their own content —
  // suppress both the short-bio teaser and the auto-generated About section so the
  // profile bio never doubles up with custom block content. The auto sections only
  // exist as a fallback for artists who have not created any text blocks yet.
  const hasCustomAboutBlock = blocks.some((block) => block.type === 'text');

  // The bio teaser (above blocks) shows the short bio when artist hasn't added text blocks.
  // The About section (below blocks) shows the full bio — only when fullBio exists to avoid
  // duplicating the short bio that already appears in the teaser above.
  const hasAboutSection = Boolean(artist.fullBio) && !hasCustomAboutBlock;
  const hasAnyPublicContent =
    blocks.length > 0 ||
    hasAboutSection ||
    currentContent.publicEpkAvailable ||
    Boolean(artist.contactEmail);

  function getMusicProvider(block: PublicPageResponse['blocks'][number]): string | null {
    if (block.type !== 'music_embed') return null;
    return (block.config as MusicEmbedBlockConfig).provider;
  }

  function getVideoProvider(block: PublicPageResponse['blocks'][number]): string | null {
    if (block.type !== 'video_embed') return null;
    return (block.config as VideoEmbedBlockConfig).provider;
  }

  /**
   * Per-block max-width so links/email-capture stay narrow & centered (as before),
   * while media/merch/text use the full column. Replaces the old per-section wrappers.
   */
  function blockWidthClass(_block: PublicPageResponse['blocks'][number]): string {
    return 'mx-auto w-full max-w-2xl';
  }

  /**
   * Platform CTA shown under a media (music/video) block — preserves the
   * Spotify / Apple Music / SoundCloud / YouTube "listen on" buttons that used
   * to live in the grouped featured-media section.
   */
  function renderMediaCta(block: PublicPageResponse['blocks'][number]): React.ReactNode {
    const musicProvider = getMusicProvider(block);
    const videoProvider = getVideoProvider(block);
    if (musicProvider === 'apple_music' && artist.appleMusicUrl) {
      return (
        <div className="flex justify-center">
          <a
            href={artist.appleMusicUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('cta.apple_music')}
            className="platform-cta-link inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-100"
            style={{ '--cta-color': '#FC3C44' } as React.CSSProperties}
          >
            <AppleMusicIcon />
            {t('cta.apple_music')}
          </a>
        </div>
      );
    }
    if (musicProvider === 'soundcloud' && artist.soundcloudUrl) {
      return (
        <div className="flex justify-center">
          <a
            href={artist.soundcloudUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('cta.soundcloud')}
            className="platform-cta-link inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-100"
            style={{ '--cta-color': '#FF5500' } as React.CSSProperties}
          >
            <SoundCloudIcon />
            {t('cta.soundcloud')}
          </a>
        </div>
      );
    }
    if (videoProvider === 'youtube' && artist.youtubeUrl) {
      return (
        <div className="flex justify-center">
          <a
            href={artist.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('cta.youtube')}
            className="platform-cta-link inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-100"
            style={{ '--cta-color': '#FF0000' } as React.CSSProperties}
          >
            <YouTubeIcon />
            {t('cta.youtube')}
          </a>
        </div>
      );
    }
    if (musicProvider === 'spotify' && artist.spotifyUrl) {
      return (
        <div className="flex justify-center">
          <a
            href={artist.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('cta.spotify')}
            className="platform-cta-link inline-flex items-center justify-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/15 px-5 py-2.5 text-sm font-medium text-white"
            style={{ '--cta-color': '#1DB954' } as React.CSSProperties}
          >
            <SpotifyIcon />
            {t('cta.spotify')}
          </a>
        </div>
      );
    }
    return null;
  }

  // ── Theme mapping ────────────────────────────────────────────────────────────
  // Minimal per-theme overrides for background and glow colours.
  // All other colours remain unchanged to avoid a full CSS-var refactor.
  const themeName = currentContent.theme?.name ?? 'noche';
  const themeStyles: Record<string, { bg: string; glow1: string; glow2: string; glow3: string }> = {
    noche: {
      bg: '#090411',
      glow1: 'rgba(139,92,246,0.20)',
      glow2: 'rgba(217,70,239,0.10)',
      glow3: 'rgba(6,182,212,0.10)',
    },
    aurora: {
      bg: '#050d1a',
      glow1: 'rgba(0,212,255,0.18)',
      glow2: 'rgba(0,180,220,0.10)',
      glow3: 'rgba(139,92,246,0.10)',
    },
    forge: {
      bg: '#100800',
      glow1: 'rgba(255,100,34,0.22)',
      glow2: 'rgba(255,80,20,0.10)',
      glow3: 'rgba(255,200,50,0.08)',
    },
    papel: {
      bg: '#f5f0e8',
      glow1: 'rgba(45,74,140,0.10)',
      glow2: 'rgba(45,74,140,0.06)',
      glow3: 'rgba(45,74,140,0.06)',
    },
  };
  const theme = themeStyles[themeName] ?? themeStyles['noche']!;
  const isPapel = themeName === 'papel';

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: theme.bg, color: isPapel ? '#1a1a1a' : '#ffffff' }}
      data-theme={themeName}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: theme.glow1 }}
        />
        <div
          className="absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full blur-3xl"
          style={{ background: theme.glow2 }}
        />
        <div
          className="absolute left-0 top-1/3 h-[260px] w-[260px] rounded-full blur-3xl"
          style={{ background: theme.glow3 }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Language toggle */}
        <div className="mb-4 flex justify-end gap-2">
          {/* Translate error banner */}
          {translateError && (
            <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300">
              <span>{t('language_toggle.translate_error')}</span>
              <button
                type="button"
                onClick={dismissError}
                className="text-red-400 hover:text-red-200"
                aria-label={t('language_toggle.translate_error_dismiss')}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <nav
            aria-label={t('language_toggle.label')}
            className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1"
          >
            {translating && (
              <span className="inline-flex items-center gap-1.5 px-2 text-xs text-white/40">
                <svg
                  className="h-3 w-3 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {t('language_toggle.translating')}
              </span>
            )}
            {SUPPORTED_LOCALES.map((lng) =>
              lng === activeLocale ? (
                <span
                  key={lng}
                  aria-current="true"
                  className="inline-flex h-7 min-w-[2.75rem] items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white"
                >
                  {lng.toUpperCase()}
                </span>
              ) : (
                <button
                  key={lng}
                  type="button"
                  disabled={translating}
                  onClick={() => void switchLocale(lng)}
                  className="inline-flex h-7 min-w-[2.75rem] items-center justify-center rounded-full text-xs font-medium text-white/50 transition hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {lng.toUpperCase()}
                </button>
              ),
            )}
          </nav>
        </div>

        <div className="rounded-[2rem] border border-violet-500/15 bg-black/20 p-3 shadow-[0_32px_140px_rgba(0,0,0,0.45)]">
          <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.24),_rgba(11,6,20,0.98)_55%)] backdrop-blur-xl">
            <div className="relative h-52 overflow-hidden sm:h-64">
              {artist.coverUrl ? (
                <PublicCoverImage
                  src={artist.coverUrl}
                  alt={t('cover_image_alt', { name: artist.displayName })}
                />
              ) : (
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(139,92,246,0.92),rgba(59,7,100,0.9))]" />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,4,16,0.05),rgba(6,4,16,0.82))]" />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0b0614] to-transparent" />
            </div>

            <div className="relative px-5 pb-10 pt-16 sm:px-10 sm:pt-20">
              <div className="absolute left-1/2 top-0 z-20 h-28 w-28 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-4 border-[#0f0918] bg-zinc-900 shadow-[0_18px_60px_rgba(0,0,0,0.45)] sm:h-32 sm:w-32">
                <PublicAvatarImage src={artist.avatarUrl} alt={artist.displayName} />
              </div>

              <div className="mx-auto max-w-3xl text-center">
                {currentContent.promoSlot.kind === 'free_branding' && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-zinc-300">
                    <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                    StageLink
                  </div>
                )}

                <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                  {artist.displayName}
                </h1>
                <p className="mt-2 text-sm text-zinc-400 sm:text-base">@{artist.username}</p>

                {descriptorLine && (
                  <p className="mt-4 text-sm font-medium tracking-wide text-zinc-300 sm:text-base">
                    {descriptorLine}
                  </p>
                )}

                {artist.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    {artist.tags.map((tag, index) => (
                      <span
                        key={tag}
                        className="tag-pulse rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-violet-100"
                        style={{ animationDelay: `${index * 0.5}s` }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {socialLinks.length > 0 && (
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2 pb-8">
                    {socialLinks.map((social) => (
                      <SocialIconLink
                        key={social.key}
                        href={social.href}
                        label={social.label}
                        color={social.color}
                        platformKey={social.key}
                        artistId={currentContent.artistId}
                        username={artist.username}
                        pageId={currentContent.pageId}
                      >
                        <social.Icon className="h-5 w-5" />
                      </SocialIconLink>
                    ))}
                  </div>
                )}
                {/* Public counters are now a user-orderable block (public_counters),
                    no longer auto-rendered in the header. */}
              </div>

              <div className="mx-auto mt-10 max-w-5xl space-y-10">
                {/* Short bio teaser — shown before blocks if the artist has a bio
                    and it hasn't been placed in a custom text block already. */}
                {artist.bio && !hasCustomAboutBlock && (
                  <div className="mx-auto max-w-2xl text-center">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="text-sm leading-7 text-zinc-300 sm:text-base">{children}</p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-white">{children}</strong>
                        ),
                        em: ({ children }) => <em className="italic text-zinc-400">{children}</em>,
                      }}
                    >
                      {artist.bio}
                    </ReactMarkdown>
                  </div>
                )}

                {/* User blocks — rendered in the exact position order the artist
                    defined in the dashboard. No type grouping, no section headers. */}
                {blocks.map((block, index) => (
                  <div key={block.id ?? index} className={blockWidthClass(block) || undefined}>
                    <div className="space-y-3">
                      <PublicPageClient page={currentContent} blocks={[block]} className="" />
                      {renderMediaCta(block)}
                    </div>
                  </div>
                ))}

                {(hasAboutSection || currentContent.publicEpkAvailable || artist.contactEmail) && (
                  <section className="space-y-4">
                    {hasAboutSection && (
                      <div className="neon-card-border rounded-[1.5rem] p-[1px]">
                        <div className="rounded-[1.4rem] bg-[#0b0614] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                            {t('sections.about')}
                          </p>
                          {/* Only fullBio is shown here — the short bio already appears
                              as a teaser above the blocks to avoid duplication. */}
                          <div className="bio-prose mt-4">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => (
                                  <p className="mb-4 text-sm leading-7 text-zinc-300 last:mb-0 sm:text-base">
                                    {children}
                                  </p>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold text-white">{children}</strong>
                                ),
                                em: ({ children }) => (
                                  <em className="italic text-zinc-300">{children}</em>
                                ),
                                ul: ({ children }) => (
                                  <ul className="mb-4 ml-4 list-disc space-y-1 text-sm leading-7 text-zinc-300 sm:text-base">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="mb-4 ml-4 list-decimal space-y-1 text-sm leading-7 text-zinc-300 sm:text-base">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => <li>{children}</li>,
                              }}
                            >
                              {artist.fullBio}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}

                    {(currentContent.publicEpkAvailable || artist.contactEmail) && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {currentContent.publicEpkAvailable && (
                          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                                {t('sections.presskit')}
                              </p>
                              <p className="text-sm leading-7 text-zinc-300">
                                {t('presskit_copy')}
                              </p>
                            </div>
                            <div className="mt-6 flex flex-wrap gap-3">
                              <Link
                                href={`/${activeLocale}/${artist.username}/epk`}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/15 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500/25"
                              >
                                <FileText className="h-4 w-4" />
                                {t('actions.view_presskit')}
                              </Link>
                              <Link
                                href={`/${activeLocale}/${artist.username}/epk/print?download=1`}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
                              >
                                <Download className="h-4 w-4" />
                                {t('actions.download_presskit')}
                              </Link>
                            </div>
                          </div>
                        )}

                        {artist.contactEmail && (
                          <div className="rounded-[1.5rem] border border-violet-400/20 bg-violet-500/10 p-6 shadow-[0_20px_80px_rgba(45,10,90,0.16)]">
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-200/70">
                              {t('sections.bookings')}
                            </p>
                            <p className="mt-4 text-sm leading-7 text-violet-50">
                              {t('booking_copy')}
                            </p>
                            <a
                              href={`mailto:${artist.contactEmail}`}
                              className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                            >
                              <Mail className="h-4 w-4" />
                              {t('actions.book_artist')}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                )}

                {!hasAnyPublicContent && (
                  <p className="py-10 text-center text-sm text-zinc-500">{t('no_blocks')}</p>
                )}

                {currentContent.promoSlot.kind === 'free_branding' && (
                  <div className="mx-auto max-w-2xl rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm">
                    <p className="text-sm font-medium text-zinc-100">{t('branding_slot.title')}</p>
                    <Link
                      href={`/${activeLocale}/pricing`}
                      className="mt-4 inline-flex items-center justify-center rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400"
                    >
                      {t('branding_slot.cta')}
                    </Link>
                    <p className="mt-5 text-sm leading-relaxed text-zinc-400">
                      {t.rich('branding_slot.secondary', {
                        brand: (chunks) => (
                          <Link
                            href={`/${activeLocale}`}
                            className="font-semibold text-violet-300 transition hover:text-violet-200"
                          >
                            {chunks}
                          </Link>
                        ),
                        signup: (chunks) => (
                          <Link
                            href={`/${activeLocale}/signup`}
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
          </div>
        </div>
      </div>
    </div>
  );
}
