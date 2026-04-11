import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { detectLocale } from '@/lib/detect-locale';
import {
  buildPublicArtistMetadata,
  PublicArtistPageDocument,
} from '@/features/public-page/server/PublicArtistPageDocument';

interface LegacyArtistPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: LegacyArtistPageProps): Promise<Metadata> {
  const { username } = await params;
  const locale = detectLocale((await headers()).get('accept-language') ?? '');

  return buildPublicArtistMetadata(username, locale);
}

export default async function LegacyArtistPage({ params }: LegacyArtistPageProps) {
  const { username } = await params;
  const locale = detectLocale((await headers()).get('accept-language') ?? '');

  return <PublicArtistPageDocument username={username} locale={locale} />;
}
