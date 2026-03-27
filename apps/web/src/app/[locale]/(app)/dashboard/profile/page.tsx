import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getArtist } from '@/lib/api/artists';
import { getAuthMe } from '@/lib/api/me';
import { ArtistProfileSettings } from '@/features/artist/components/ArtistProfileSettings';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard.profile');
  return { title: t('title') };
}

interface DashboardProfilePageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Profile editor page — server component.
 *
 * Resolves artist data on the server so the client component receives fully
 * hydrated initial state (no loading spinner, no extra fetch on mount).
 *
 * The (app) layout already calls getAuthMe + getArtist for the shell;
 * Next.js deduplicates these fetch calls within the same request lifecycle.
 *
 * Auth contract:
 * - (app)/layout.tsx guarantees the user is authenticated.
 * - The redirect below is a TypeScript narrowing guard — it will never fire.
 * - If the user has no artist, they are sent back to onboarding.
 */
export default async function DashboardProfilePage({ params }: DashboardProfilePageProps) {
  const { locale } = await params;

  // TypeScript narrowing — layout already guards auth
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  // Resolve artist (deduped by Next.js — layout fetches the same data)
  const me = await getAuthMe(session.accessToken);
  const artistId = me?.artistIds[0];
  if (!artistId) redirect(`/${locale}/onboarding`);

  const artist = await getArtist(artistId, session.accessToken);
  if (!artist) redirect(`/${locale}/onboarding`);

  const t = await getTranslations('dashboard.profile');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <ArtistProfileSettings artist={artist} accessToken={session.accessToken} />
    </div>
  );
}
