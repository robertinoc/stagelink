import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchPublicEpk } from '@/lib/api/epk';
import { PublicEpkView } from '@/features/epk/components/PublicEpkView';

interface PublicEpkPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PublicEpkPageProps): Promise<Metadata> {
  const { username } = await params;
  const epk = await fetchPublicEpk(username);

  if (!epk) {
    return {
      title: 'EPK not found — StageLink',
      robots: { index: false, follow: false },
    };
  }

  const title = `${epk.artist.displayName} EPK — StageLink`;
  const description =
    epk.headline ??
    epk.shortBio ??
    epk.artist.bio ??
    `${epk.artist.displayName} press kit on StageLink.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: epk.heroImageUrl ? [{ url: epk.heroImageUrl, alt: epk.artist.displayName }] : [],
      type: 'article',
    },
    twitter: {
      card: epk.heroImageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: epk.heroImageUrl ? [epk.heroImageUrl] : [],
    },
  };
}

export default async function PublicEpkPage({ params }: PublicEpkPageProps) {
  const { username } = await params;
  const epk = await fetchPublicEpk(username);

  if (!epk) notFound();

  return <PublicEpkView epk={epk} />;
}
