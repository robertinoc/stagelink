import type { Metadata } from 'next';
import type { SupportedLocale } from '@stagelink/types';
import {
  buildPublicArtistMetadata,
  PublicArtistPageDocument,
} from '@/features/public-page/server/PublicArtistPageDocument';

interface LocalizedArtistPageProps {
  params: Promise<{ locale: SupportedLocale; username: string }>;
}

export async function generateMetadata({ params }: LocalizedArtistPageProps): Promise<Metadata> {
  const { locale, username } = await params;
  return buildPublicArtistMetadata(username, locale);
}

export default async function LocalizedArtistPage({ params }: LocalizedArtistPageProps) {
  const { locale, username } = await params;

  return <PublicArtistPageDocument username={username} locale={locale} />;
}
