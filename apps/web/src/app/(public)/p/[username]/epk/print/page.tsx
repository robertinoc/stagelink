import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchPublicEpk } from '@/lib/api/epk';
import { PublicEpkView } from '@/features/epk/components/PublicEpkView';

interface PrintEpkPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PrintEpkPageProps): Promise<Metadata> {
  const { username } = await params;
  const epk = await fetchPublicEpk(username);

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

export default async function PrintEpkPage({ params }: PrintEpkPageProps) {
  const { username } = await params;
  const epk = await fetchPublicEpk(username);

  if (!epk) notFound();

  return <PublicEpkView epk={epk} printMode />;
}
