import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import type { SupportedLocale } from '@stagelink/types';
import { getTranslations } from 'next-intl/server';
import { fetchPublicPage } from '@/lib/public-api';
import { ArtistPageView } from '@/features/public-page/components/ArtistPageView';
import { QaModeInitializer } from '@/features/public-page/components/QaModeInitializer';
import { serializeJsonLd } from '@/lib/json-ld';
import {
  buildLocalizedAlternates,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
} from '@/lib/seo-localization';
import { getCanonicalAppUrl } from '@/lib/site-url';

function buildJsonLd(
  artist: NonNullable<Awaited<ReturnType<typeof fetchPublicPage>>>['artist'],
  canonical: string | undefined,
): Record<string, unknown> {
  const sameAs = [
    artist.instagramUrl,
    artist.tiktokUrl,
    artist.youtubeUrl,
    artist.spotifyUrl,
    artist.soundcloudUrl,
    artist.websiteUrl,
  ].filter((url): url is string => Boolean(url));

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: artist.displayName,
    ...(artist.bio && { description: artist.bio }),
    ...(canonical && { url: canonical }),
    ...(artist.avatarUrl && { image: artist.avatarUrl }),
    ...(sameAs.length > 0 && { sameAs }),
    ...(artist.tags.length > 0 && { knowsAbout: artist.tags }),
  };
}

export async function buildPublicArtistMetadata(
  username: string,
  locale: SupportedLocale,
): Promise<Metadata> {
  const page = await fetchPublicPage(username, locale);

  if (!page) {
    return {
      title: 'Artist not found — StageLink',
      robots: { index: false, follow: false },
    };
  }

  const { artist } = page;
  const t = await getTranslations({ locale, namespace: 'public_page' });
  const appUrl = getCanonicalAppUrl();
  const canonical = `${appUrl}/${locale}/${artist.username}`;

  const title = artist.seoTitle
    ? `${artist.seoTitle} — StageLink`
    : `${artist.displayName} (@${artist.username}) — StageLink`;

  const description =
    artist.seoDescription ??
    artist.bio ??
    t('seo_description_fallback', { name: artist.displayName });

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: buildLocalizedAlternates(`/${artist.username}`, appUrl),
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: artist.seoTitle ?? artist.displayName,
      description,
      ...(canonical && { url: canonical }),
      images: artist.coverUrl
        ? [{ url: artist.coverUrl, width: 1200, height: 630, alt: artist.displayName }]
        : artist.avatarUrl
          ? [{ url: artist.avatarUrl, width: 400, height: 400, alt: artist.displayName }]
          : [],
      type: 'profile',
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
    },
    twitter: {
      card: artist.coverUrl ? 'summary_large_image' : 'summary',
      title: artist.seoTitle ?? artist.displayName,
      description,
      images: artist.coverUrl ? [artist.coverUrl] : artist.avatarUrl ? [artist.avatarUrl] : [],
    },
  };
}

interface PublicArtistPageDocumentProps {
  username: string;
  locale: SupportedLocale;
}

export async function PublicArtistPageDocument({
  username,
  locale,
}: PublicArtistPageDocumentProps) {
  const page = await fetchPublicPage(username, locale);

  if (!page) {
    notFound();
  }

  const appUrl = getCanonicalAppUrl();
  const canonical = `${appUrl}/${locale}/${page.artist.username}`;
  const jsonLd = buildJsonLd(page.artist, canonical);

  const headersList = await headers();
  const analyticsLocale = headersList.get('accept-language') ?? locale;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <ArtistPageView page={page} />
      <Suspense fallback={null}>
        <QaModeInitializer />
      </Suspense>
      <meta name="sl-request-locale" content={analyticsLocale} />
    </>
  );
}
