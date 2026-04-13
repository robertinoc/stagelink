import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { fetchPublicEpk } from '@/lib/api/epk';
import { AutoPrintOnMount } from '@/features/epk/components/AutoPrintOnMount';
import { PublicEpkView } from '@/features/epk/components/PublicEpkView';
import { detectLocale } from '@/lib/detect-locale';

interface PrintEpkPageProps {
  params: Promise<{ username: string }>;
  searchParams?: Promise<{ download?: string }>;
}

export async function generateMetadata({ params }: PrintEpkPageProps): Promise<Metadata> {
  const { username } = await params;
  const locale = detectLocale((await headers()).get('accept-language') ?? '');
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

export default async function PrintEpkPage({ params, searchParams }: PrintEpkPageProps) {
  const { username } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const locale = detectLocale((await headers()).get('accept-language') ?? '');
  const epk = await fetchPublicEpk(username, locale);

  if (!epk) notFound();

  return (
    <>
      <AutoPrintOnMount enabled={resolvedSearchParams?.download === '1'} />
      <PublicEpkView epk={epk} printMode locale={locale} />
    </>
  );
}
