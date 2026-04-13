import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { SupportedLocale } from '@stagelink/types';
import { PublicEpkView } from '@/features/epk/components/PublicEpkView';
import { fetchPublicEpk } from '@/lib/api/epk';

interface LocalizedPrintEpkPageProps {
  params: Promise<{ locale: SupportedLocale; username: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: LocalizedPrintEpkPageProps): Promise<Metadata> {
  const { locale, username } = await params;
  const epk = await fetchPublicEpk(username, locale);

  if (!epk) {
    return {
      title: 'EPK print view not found — StageLink',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${epk.artist.displayName} EPK Print — StageLink`,
    robots: { index: false, follow: false },
  };
}

export default async function LocalizedPrintEpkPage({ params }: LocalizedPrintEpkPageProps) {
  const { locale, username } = await params;
  const epk = await fetchPublicEpk(username, locale);

  if (!epk) notFound();

  return <PublicEpkView epk={epk} printMode locale={locale} />;
}
