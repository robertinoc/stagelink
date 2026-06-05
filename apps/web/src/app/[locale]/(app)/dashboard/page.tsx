import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { DashboardWelcome } from '@/features/dashboard/components/DashboardWelcome';
import { ConnectionErrorState } from '@/components/shared/ConnectionErrorState';
import { getArtist } from '@/lib/api/artists';
import { getBillingSummary } from '@/lib/api/billing';
import { getAuthMe, getCurrentArtistId } from '@/lib/api/me';
import { getSession } from '@/lib/auth';
import { getAnalyticsOverview } from '@/lib/api/analytics';

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard');
  return { title: t('title') };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const session = await getSession();

  if (!session) {
    return null;
  }

  const me = await getAuthMe(session.accessToken);

  // me === null means the API is unreachable (deploy in progress, network error, etc.).
  // NEVER redirect to onboarding in this case — existing users would lose their artist.
  // Show a recoverable error page instead so the user can simply refresh.
  if (me === null) {
    return <ConnectionErrorState href={`/${locale}/dashboard`} />;
  }

  const artistId = getCurrentArtistId(me);

  if (!artistId) {
    redirect(`/${locale}/onboarding`);
  }

  const [artist, billingSummary, analyticsResult] = await Promise.all([
    getArtist(artistId, session.accessToken).catch(() => null),
    getBillingSummary(artistId, session.accessToken).catch(() => null),
    getAnalyticsOverview(artistId, session.accessToken, '7d').catch(() => null),
  ]);

  const analyticsOverview =
    analyticsResult && 'kind' in analyticsResult && analyticsResult.kind !== 'ok'
      ? null
      : ((analyticsResult as Awaited<ReturnType<typeof getAnalyticsOverview>> & { kind: 'ok' })
          ?.data ?? null);

  return (
    <DashboardWelcome
      artist={artist}
      billingSummary={billingSummary}
      analyticsOverview={analyticsOverview}
    />
  );
}
