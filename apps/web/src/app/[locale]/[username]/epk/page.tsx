import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { SupportedLocale } from '@stagelink/types';
import { PublicEpkView } from '@/features/epk/components/PublicEpkView';
import { fetchPublicEpk } from '@/lib/api/epk';
import {
  buildLocalizedAlternates,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
} from '@/lib/seo-localization';
import { getCanonicalAppUrl } from '@/lib/site-url';

interface LocalizedPublicEpkPageProps {
  params: Promise<{ locale: SupportedLocale; username: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: LocalizedPublicEpkPageProps): Promise<Metadata> {
  const { locale, username } = await params;
  const t = await getTranslations({ locale, namespace: 'public_epk.metadata' });
  const epk = await fetchPublicEpk(username, locale);

  if (!epk) {
    return {
      title: t('not_found'),
      robots: { index: false, follow: false },
    };
  }

  const appUrl = getCanonicalAppUrl();
  const canonical = `${appUrl}/${locale}/${epk.artist.username}/epk`;
  const title = `${epk.artist.displayName} EPK — StageLink`;
  const description =
    epk.headline ??
    epk.shortBio ??
    epk.artist.bio ??
    t('fallback_description', { name: epk.artist.displayName });

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: buildLocalizedAlternates(`/${epk.artist.username}/epk`, appUrl),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      images: epk.heroImageUrl ? [{ url: epk.heroImageUrl, alt: epk.artist.displayName }] : [],
      type: 'article',
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
    },
    twitter: {
      card: epk.heroImageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: epk.heroImageUrl ? [epk.heroImageUrl] : [],
    },
  };
}

export default async function LocalizedPublicEpkPage({ params }: LocalizedPublicEpkPageProps) {
  const { locale, username } = await params;
  const epk = await fetchPublicEpk(username, locale);

  if (!epk) notFound();

  return <PublicEpkView epk={epk} locale={locale} />;
}
