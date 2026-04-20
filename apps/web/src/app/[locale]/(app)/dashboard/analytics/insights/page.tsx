import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { InsightsDashboard } from '@/features/insights/components/InsightsDashboard';
import { getBillingEntitlements } from '@/lib/api/billing';
import { getStageLinkInsightsDashboard } from '@/lib/api/insights';
import { getAuthMe, getCurrentArtistId } from '@/lib/api/me';
import { getSession } from '@/lib/auth';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard.insights');
  return { title: t('title') };
}

export default async function DashboardInsightsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const me = await getAuthMe(session.accessToken);
  const artistId = getCurrentArtistId(me);

  if (!artistId) {
    redirect(`/${locale}/onboarding`);
  }

  const [entitlements, result] = await Promise.all([
    getBillingEntitlements(artistId, session.accessToken).catch(() => null),
    getStageLinkInsightsDashboard(artistId, session.accessToken),
  ]);

  return (
    <InsightsDashboard
      data={result.kind === 'ok' ? result.data : null}
      entitlements={entitlements}
      lockedPayload={result.kind === 'locked' ? result.payload : null}
      errorMessage={result.kind === 'error' ? result.message : null}
    />
  );
}
