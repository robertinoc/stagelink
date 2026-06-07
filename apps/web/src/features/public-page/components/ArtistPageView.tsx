import Link from 'next/link';
import { Download, FileText, Globe, Instagram, Mail, Sparkles } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import type { PublicPageResponse } from '@stagelink/types';
import { PublicPageClient } from './PublicPageClient';
import { PublicAvatarImage } from './PublicAvatarImage';
import { PublicCoverImage } from './PublicCoverImage';
import { SocialIconLink } from './SocialIconLink';
import { ArtistStatsRow } from './ArtistStatsRow';
import { ReleasesSection } from './ReleasesSection';
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

function normalizeTextForComparison(value: string | null | undefined): string {
  return value?.toLowerCase().replace(/\s+/g, ' ').trim() ?? '';
}

export async function ArtistPageView({ page }: ArtistPageViewProps) {
  const t = await getTranslations('public_page');
  const locale = await getLocale();
  const { artist, blocks } = page;

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
      Icon: IconComponent;
    } => Boolean(item),
  );

  const categoryLabels = [artist.category, ...artist.secondaryCategories].map((category) =>
    t(`categories.${category}`),
  );
  const descriptorLine = categoryLabels.join(t('tagline_separator'));

  // Render blocks in the exact order the artist set in the dashboard (position ASC).
  // The API already returns them sorted by position ASC.
  const orderedBlocks = blocks;

  // Determine whether the auto-bio "About" section should be shown.
  // Suppressed if the artist has a custom text block referencing their bio
  // (to avoid showing the same content twice).
  const normalizedArtistBio = normalizeTextForComparison(artist.bio);
  const textBlocks = blocks.filter((b) => b.type === 'text');
  const hasCustomAboutBlock = textBlocks.some((block) => {
    const config = block.config as { body?: string; bioSource?: string };
    const title = normalizeTextForComparison(block.title);
    const body = typeof config.body === 'string' ? normalizeTextForComparison(config.body) : '';
    if (config.bioSource === 'short_bio' || config.bioSource === 'full_bio') return true;
    return (
      title.includes('about') ||
      title.includes(artist.displayName.toLowerCase()) ||
      (normalizedArtistBio.length > 0 && body === normalizedArtistBio)
    );
  });

  const hasAboutSection = (Boolean(artist.bio) || Boolean(artist.fullBio)) && !hasCustomAboutBlock;
  const hasAnyContent = orderedBlocks.length > 0 || hasAboutSection;

  // Theme
  const themeName = page.theme?.name ?? 'noche';
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
        <div className="mb-4 flex justify-end">
          <nav
            aria-label={t('language_toggle.label')}
            className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1"
          >
            {(['en', 'es'] as const).map((lng) =>
              lng === locale ? (
                <span
                  key={lng}
                  aria-current="true"
                  className="inline-flex h-7 min-w-[2.75rem] items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white"
                >
                  {lng.toUpperCase()}
                </span>
              ) : (
                <Link
                  key={lng}
                  href={`/${lng}/${artist.username}`}
                  className="inline-flex h-7 min-w-[2.75rem] items-center justify-center rounded-full text-xs font-medium text-white/50 transition hover:text-white/80"
                >
                  {lng.toUpperCase()}
                </Link>
              ),
            )}
          </nav>
        </div>

        <div className="rounded-[2rem] border border-violet-500/15 bg-black/20 p-3 shadow-[0_32px_140px_rgba(0,0,0,0.45)]">
          <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.24),_rgba(11,6,20,0.98)_55%)] backdrop-blur-xl">
            {/* ── Cover + header ── */}
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
                {page.promoSlot.kind === 'free_branding' && (
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
                        artistId={page.artistId}
                        username={artist.username}
                        pageId={page.pageId}
                      >
                        <social.Icon className="h-5 w-5" />
                      </SocialIconLink>
                    ))}
                  </div>
                )}

                <ArtistStatsRow
                  epsReleasedCount={artist.epsReleasedCount}
                  recordLabelsCount={artist.recordLabelsCount}
                  externalCollabsCount={artist.externalCollabsCount}
                  locale={artist.locale}
                />
              </div>

              {/* ── Main content: blocks in user-defined order ── */}
              <div className="mx-auto mt-10 max-w-5xl space-y-6">
                {/* Blocks rendered in the exact order set in the dashboard */}
                {orderedBlocks.length > 0 && (
                  <PublicPageClient page={page} blocks={orderedBlocks} className="space-y-6" />
                )}

                {/* REQ-10 — Releases / EPs / Albums. Shown after user blocks.
                    Returns null when releases is empty. */}
                <ReleasesSection releases={artist.releases} locale={artist.locale} />

                {/* Auto "About" section — only shown when the artist has a bio
                    but hasn't placed a custom text block for it. */}
                {hasAboutSection && (
                  <section className="space-y-4">
                    <div className="neon-card-border rounded-[1.5rem] p-[1px]">
                      <div className="rounded-[1.4rem] bg-[#0b0614] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                          {t('sections.about')}
                        </p>
                        {artist.bio && (
                          <div className="bio-prose mt-4">
                            <p className="mb-3 text-sm leading-7 text-zinc-200 last:mb-0 sm:text-base">
                              {artist.bio}
                            </p>
                          </div>
                        )}
                        {artist.fullBio && (
                          <>
                            {artist.bio && (
                              <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            )}
                            <div className="bio-prose">
                              <p className="mb-4 text-sm leading-7 text-zinc-300 last:mb-0 sm:text-base">
                                {artist.fullBio}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* EPK + contact — fixed at bottom */}
                {(page.publicEpkAvailable || artist.contactEmail) && (
                  <section className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {page.publicEpkAvailable && (
                        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                              {t('sections.presskit')}
                            </p>
                            <p className="text-sm leading-7 text-zinc-300">{t('presskit_copy')}</p>
                          </div>
                          <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                              href={`/${locale}/${artist.username}/epk`}
                              className="inline-flex items-center justify-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/15 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500/25"
                            >
                              <FileText className="h-4 w-4" />
                              {t('actions.view_presskit')}
                            </Link>
                            <Link
                              href={`/${locale}/${artist.username}/epk/print?download=1`}
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
                  </section>
                )}

                {!hasAnyContent && (
                  <p className="py-10 text-center text-sm text-zinc-500">{t('no_blocks')}</p>
                )}

                {page.promoSlot.kind === 'free_branding' && (
                  <div className="mx-auto max-w-2xl rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm">
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
                          <Link
                            href={`/${locale}`}
                            className="font-semibold text-violet-300 transition hover:text-violet-200"
                          >
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
          </div>
        </div>
      </div>
    </div>
  );
}
