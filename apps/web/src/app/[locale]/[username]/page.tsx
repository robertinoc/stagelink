import type { Metadata } from 'next';
import { ArtistPagePlaceholder } from '@/features/public-page/components/ArtistPagePlaceholder';

interface ArtistPageProps {
  params: Promise<{ username: string; locale: string }>;
}

export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username} on StageLink`,
    description: `Check out ${username}'s artist page on StageLink`,
  };
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { username } = await params;
  return <ArtistPagePlaceholder username={username} />;
}
