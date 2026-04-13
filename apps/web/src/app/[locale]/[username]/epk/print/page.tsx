import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { SupportedLocale } from '@stagelink/types';
import { PublicEpkView } from '@/features/epk/components/PublicEpkView';
import { fetchPublicEpk } from '@/lib/api/epk';

interface LocalizedPrintEpkPageProps {
  params: Promise<{ locale: SupportedLocale; username: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: LocalizedPrintEpkPageProps): Promise<Metadata> {
  const { locale, username } = await params;
  const t = await getTranslations({ locale, namespace: 'public_epk.metadata' });
  const epk = await fetchPublicEpk(username, locale);

  if (!epk) {
    return {
      title: t('print_not_found'),
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
