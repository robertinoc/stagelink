import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { SupportedLocale } from '@stagelink/types';
import { PublicEpkView } from '@/features/epk/components/PublicEpkView';
import { fetchPublicEpk } from '@/lib/api/epk';

interface LocalizedPublicEpkPageProps {
  params: Promise<{ locale: SupportedLocale; username: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: LocalizedPublicEpkPageProps): Promise<Metadata> {
  const { locale, username } = await params;
  const epk = await fetchPublicEpk(username, locale);

  if (!epk) {
    return {
      title: 'EPK not found — StageLink',
      robots: { index: false, follow: false },
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const canonical = appUrl ? `${appUrl}/${locale}/${epk.artist.username}/epk` : undefined;
  const title = `${epk.artist.displayName} EPK — StageLink`;
  const description =
    epk.headline ??
    epk.shortBio ??
    epk.artist.bio ??
    `${epk.artist.displayName} press kit on StageLink.`;

  return {
    title,
    description,
    ...(canonical && {
      alternates: {
        canonical,
        languages: {
          en: `${appUrl}/en/${epk.artist.username}/epk`,
          es: `${appUrl}/es/${epk.artist.username}/epk`,
        },
      },
    }),
    openGraph: {
      title,
      description,
      ...(canonical && { url: canonical }),
      images: epk.heroImageUrl ? [{ url: epk.heroImageUrl, alt: epk.artist.displayName }] : [],
      type: 'article',
      locale,
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
