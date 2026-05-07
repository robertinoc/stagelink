import Link from 'next/link';
import { Download, FileText, Globe, Instagram, Mail, Sparkles } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import type { PublicPageResponse } from '@stagelink/types';
import { PublicPageClient } from './PublicPageClient';
import { PublicAvatarImage } from './PublicAvatarImage';
import { PublicCoverImage } from './PublicCoverImage';
import { SpotifyIcon, YouTubeIcon, TikTokIcon, SoundCloudIcon } from './SocialPlatformIcons';

interface ArtistPageViewProps {
  page: PublicPageResponse;
}

type IconComponent = (props: { className?: string }) => React.ReactElement;

function normalizeTextForComparison(value: string | null | undefined): string {
  return value?.toLowerCase().replace(/\s+/g, ' ').trim() ?? '';
}

function isFeaturedMediaBlock(block: PublicPageResponse['blocks'][number]) {
  return block.type === 'music_embed' || block.type === 'video_embed';
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
      Icon: Instagram as IconComponent,
    },
    artist.tiktokUrl && {
      href: artist.tiktokUrl,
      label: t('social.tiktok'),
      key: 'tiktok',
      Icon: TikTokIcon as IconComponent,
    },
    artist.youtubeUrl && {
      href: artist.youtubeUrl,
      label: t('social.youtube'),
      key: 'youtube',
      Icon: YouTubeIcon as IconComponent,
    },
    artist.spotifyUrl && {
      href: artist.spotifyUrl,
      label: t('social.spotify'),
      key: 'spotify',
      Icon: SpotifyIcon as IconComponent,
    },
    artist.soundcloudUrl && {
      href: artist.soundcloudUrl,
      label: t('social.soundcloud'),
      key: 'soundcloud',
      Icon: SoundCloudIcon as IconComponent,
    },
    artist.websiteUrl && {
      href: artist.websiteUrl,
      label: t('social.website'),
      key: 'website',
      Icon: Globe as IconComponent,
    },
  ].filter(
    (
      item,
    ): item is {
      href: string;
      label: string;
      key: string;
      Icon: IconComponent;
    } => Boolean(item),
  );

  const categoryLabels = [artist.category, ...artist.secondaryCategories].map((category) =>
    t(`categories.${category}`),
  );
  const descriptorLine = categoryLabels.join(t('tagline_separator'));

  const linkBlocks = blocks.filter((block) => block.type === 'links');
  const featuredMediaBlocks = blocks.filter(isFeaturedMediaBlock);
  const merchBlocks = blocks.filter(
    (block) => block.type === 'shopify_store' || block.type === 'smart_merch',
  );
  const textBlocks = blocks.filter((block) => block.type === 'text');
  const emailCaptureBlocks = blocks.filter((block) => block.type === 'email_capture');
  const remainingBlocks = blocks.filter(
    (block) =>
      block.type !== 'links' &&
      !isFeaturedMediaBlock(block) &&
      block.type !== 'shopify_store' &&
      block.type !== 'smart_merch' &&
      block.type !== 'text' &&
      block.type !== 'email_capture',
  );
  const additionalInfoBlocks = [...textBlocks, ...remainingBlocks];
  const normalizedArtistBio = normalizeTextForComparison(artist.bio);
  const hasCustomAboutBlock = textBlocks.some((block) => {
    const title = normalizeTextForComparison(block.title);
    const body =
      'body' in block.config && typeof block.config.body === 'string'
        ? normalizeTextForComparison(block.config.body)
        : '';

    return (
      title.includes('about') ||
      title.includes(artist.displayName.toLowerCase()) ||
      (normalizedArtistBio.length > 0 && body === normalizedArtistBio)
    );
  });

  const hasAboutSection = Boolean(artist.bio) && !hasCustomAboutBlock;
  const hasAdditionalInfo = additionalInfoBlocks.length > 0;
  const hasAnyPublicContent =
    linkBlocks.length > 0 ||
    featuredMediaBlocks.length > 0 ||
    hasAboutSection ||
    hasAdditionalInfo ||
    emailCaptureBlocks.length > 0 ||
    remainingBlocks.length > 0;

  // YouTube CTA shows below featured media if media blocks exist, or falls through to
  // the platform CTAs row below the header if there are no media blocks.
  const showYouTubeInMediaSection = Boolean(artist.youtubeUrl) && featuredMediaBlocks.length > 0;
  const showYouTubeInCtaRow = Boolean(artist.youtubeUrl) && featuredMediaBlocks.length === 0;
  const showPlatformCtaRow =
    Boolean(artist.spotifyUrl) || Boolean(artist.soundcloudUrl) || showYouTubeInCtaRow;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090411] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute left-0 top-1/3 h-[260px] w-[260px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Language toggle */}
        <div className="mb-4 flex justify-end">
          <nav
            aria-label={t('language_toggle.label')}
            className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1"
          >
            {(['en', 'es'] as const).map((lng) => (
              <Link
                key={lng}
                href={lng === locale ? '#' : `/${lng}/${artist.username}`}
                aria-current={lng === locale ? 'true' : undefined}
                className={
                  lng === locale
                    ? 'inline-flex h-7 min-w-[2.75rem] items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white'
                    : 'inline-flex h-7 min-w-[2.75rem] items-center justify-center rounded-full text-xs font-medium text-white/50 transition hover:text-white/80'
                }
              >
                {lng.toUpperCase()}
              </Link>
            ))}
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
                    {artist.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-violet-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {socialLinks.length > 0 && (
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    {socialLinks.map((social) => (
                      <a
                        key={social.key}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        title={social.label}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:border-violet-300/30 hover:bg-violet-400/10 hover:text-white"
                      >
                        <social.Icon className="h-4 w-4" />
                        <span className="sr-only">{social.label}</span>
                      </a>
                    ))}
                  </div>
                )}

                {(artist.contactEmail || artist.websiteUrl) && (
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    {artist.contactEmail && (
                      <a
                        href={`mailto:${artist.contactEmail}`}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/15 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500/25"
                      >
                        <Mail className="h-4 w-4" />
                        {t('actions.book_artist')}
                      </a>
                    )}
                    {artist.websiteUrl && (
                      <a
                        href={artist.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
                      >
                        <Globe className="h-4 w-4" />
                        {t('actions.visit_website')}
                      </a>
                    )}
                  </div>
                )}

                {/* Platform CTAs: Spotify, SoundCloud, and YouTube (when no media blocks) */}
                {showPlatformCtaRow && (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    {artist.spotifyUrl && (
                      <a
                        href={artist.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t('cta.spotify')}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/15 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500/25"
                      >
                        <SpotifyIcon />
                        {t('cta.spotify')}
                      </a>
                    )}
                    {showYouTubeInCtaRow && (
                      <a
                        href={artist.youtubeUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t('cta.youtube')}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
                      >
                        <YouTubeIcon />
                        {t('cta.youtube')}
                      </a>
                    )}
                    {artist.soundcloudUrl && (
                      <a
                        href={artist.soundcloudUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t('cta.soundcloud')}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
                      >
                        <SoundCloudIcon />
                        {t('cta.soundcloud')}
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="mx-auto mt-10 max-w-5xl space-y-10">
                {linkBlocks.length > 0 && (
                  <section className="mx-auto max-w-xl">
                    <div className="mb-4 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                        {t('sections.featured_links')}
                      </p>
                    </div>
                    <PublicPageClient page={page} blocks={linkBlocks} className="space-y-5" />
                  </section>
                )}

                {featuredMediaBlocks.length > 0 && (
                  <section className="space-y-4">
                    <div className="space-y-2 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                        {t('sections.featured_media')}
                      </p>
                    </div>
                    <PublicPageClient
                      page={page}
                      blocks={featuredMediaBlocks}
                      className="grid gap-4 lg:grid-cols-2 lg:items-start"
                    />
                    {/* YouTube CTA — appears below the last video when the artist has a channel */}
                    {showYouTubeInMediaSection && (
                      <div className="flex justify-center pt-2">
                        <a
                          href={artist.youtubeUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={t('cta.youtube')}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
                        >
                          <YouTubeIcon />
                          {t('cta.youtube')}
                        </a>
                      </div>
                    )}
                  </section>
                )}

                {merchBlocks.length > 0 && (
                  <section className="space-y-4">
                    <div className="space-y-2 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                        {t('sections.merch')}
                      </p>
                    </div>
                    <PublicPageClient page={page} blocks={merchBlocks} className="space-y-4" />
                  </section>
                )}

                {additionalInfoBlocks.length > 0 && (
                  <section className="space-y-4">
                    <div className="space-y-2 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                        {t('sections.additional_info')}
                      </p>
                    </div>
                    <PublicPageClient
                      page={page}
                      blocks={additionalInfoBlocks}
                      className="space-y-4"
                    />
                  </section>
                )}

                {(hasAboutSection || page.publicEpkAvailable || artist.contactEmail) && (
                  <section className="space-y-4">
                    {hasAboutSection && (
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                          {t('sections.about')}
                        </p>
                        {artist.bio && (
                          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-200 sm:text-base">
                            {artist.bio}
                          </p>
                        )}
                      </div>
                    )}

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
                        <p className="mt-4 text-sm leading-7 text-violet-50">{t('booking_copy')}</p>
                        <a
                          href={`mailto:${artist.contactEmail}`}
                          className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                        >
                          <Mail className="h-4 w-4" />
                          {artist.contactEmail}
                        </a>
                      </div>
                    )}
                  </section>
                )}

                {emailCaptureBlocks.length > 0 && (
                  <section className="space-y-4">
                    <div className="space-y-2 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                        {t('sections.fan_list')}
                      </p>
                      <p className="mx-auto max-w-2xl text-sm leading-7 text-zinc-400">
                        {t('fan_list_copy')}
                      </p>
                    </div>
                    <div className="mx-auto max-w-2xl">
                      <PublicPageClient
                        page={page}
                        blocks={emailCaptureBlocks}
                        className="space-y-4"
                      />
                    </div>
                  </section>
                )}

                {!hasAnyPublicContent && (
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
