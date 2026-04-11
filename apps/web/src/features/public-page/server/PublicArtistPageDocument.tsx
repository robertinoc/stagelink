import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import type { SupportedLocale } from '@stagelink/types';
import { getTranslations } from 'next-intl/server';
import { fetchPublicPage } from '@/lib/public-api';
import { ArtistPageView } from '@/features/public-page/components/ArtistPageView';
import { AnalyticsConsentBanner } from '@/features/public-page/components/AnalyticsConsentBanner';
import { QaModeInitializer } from '@/features/public-page/components/QaModeInitializer';

function buildJsonLd(
  artist: NonNullable<Awaited<ReturnType<typeof fetchPublicPage>>>['artist'],
  canonical: string | undefined,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: artist.displayName,
    ...(artist.bio && { description: artist.bio }),
    ...(canonical && { url: canonical }),
    ...(artist.avatarUrl && { image: artist.avatarUrl }),
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const canonical = appUrl ? `${appUrl}/${locale}/${artist.username}` : undefined;

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
    ...(canonical && {
      alternates: {
        canonical,
        languages: {
          en: `${appUrl}/en/${artist.username}`,
          es: `${appUrl}/es/${artist.username}`,
        },
      },
    }),
    robots: {
      index: !!canonical,
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
      locale,
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const canonical = appUrl ? `${appUrl}/${locale}/${page.artist.username}` : undefined;
  const jsonLd = buildJsonLd(page.artist, canonical);

  const headersList = await headers();
  const analyticsLocale = headersList.get('accept-language') ?? locale;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArtistPageView page={page} />
      <AnalyticsConsentBanner />
      <Suspense fallback={null}>
        <QaModeInitializer />
      </Suspense>
      <meta name="sl-request-locale" content={analyticsLocale} />
    </>
  );
}
