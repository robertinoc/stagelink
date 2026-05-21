import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { StageLinkInsightsDateRange } from '@stagelink/types';
import { getArtist } from '@/lib/api/artists';
import { getSession } from '@/lib/auth';
import { getBillingEntitlements } from '@/lib/api/billing';
import { getStageLinkInsightsDashboard } from '@/lib/api/insights';
import { getAuthMe, getCurrentArtistId } from '@/lib/api/me';
import {
  getAnalyticsFanInsights,
  getAnalyticsOverview,
  getAnalyticsProTrends,
  type AnalyticsFeatureLockPayload,
  type AnalyticsProtectedResult,
  type AnalyticsRange,
} from '@/lib/api/analytics';
import { AnalyticsPage } from '@/features/analytics/components/redesign/AnalyticsPage';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard.analytics');
  return { title: t('title') };
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ range?: string; insightsRange?: StageLinkInsightsDateRange }>;
}

const VALID_RANGES: AnalyticsRange[] = ['7d', '30d', '90d', '365d'];

function parseRange(raw: string | undefined): AnalyticsRange {
  if (raw && VALID_RANGES.includes(raw as AnalyticsRange)) {
    return raw as AnalyticsRange;
  }
  return '30d';
}

function isSessionExpired<T>(
  result: AnalyticsProtectedResult<T>,
): result is { kind: 'session_expired' } {
  return result.kind === 'session_expired';
}

/**
 * DashboardAnalyticsPage — server component for the redesigned Analytics page.
 *
 * Server-fetches every dataset in parallel and passes them to the new
 * `<AnalyticsPage />` client component which renders the 2-tab redesign
 * (Tu página + Plataformas externas).
 *
 * Range switching navigates to ?range=... which re-runs this function.
 */
export default async function DashboardAnalyticsPage({ params, searchParams }: PageProps) {
  const [{ locale }, { range: rawRange, insightsRange }] = await Promise.all([
    params,
    searchParams,
  ]);
  const range = parseRange(rawRange);

  const session = await getSession();
  if (!session) return null;

  const me = await getAuthMe(session.accessToken);
  const artistId = getCurrentArtistId(me);
  if (!artistId) return null;

  const [entitlements, artist, insightsResult, overviewResult, trendsResult, fanInsightsResult] =
    await Promise.all([
      getBillingEntitlements(artistId, session.accessToken).catch(() => null),
      getArtist(artistId, session.accessToken).catch(() => null),
      getStageLinkInsightsDashboard(artistId, session.accessToken, insightsRange).catch(() => ({
        kind: 'error' as const,
        message: 'Failed to load StageLink Insights',
      })),
      getAnalyticsOverview(artistId, session.accessToken, range),
      getAnalyticsProTrends(artistId, session.accessToken, range),
      getAnalyticsFanInsights(artistId, session.accessToken, range),
    ]);

  if (
    isSessionExpired(overviewResult) ||
    isSessionExpired(trendsResult) ||
    isSessionExpired(fanInsightsResult)
  ) {
    redirect(`/${locale}/login`);
  }

  const overview = overviewResult.kind === 'ok' ? overviewResult.data : null;
  const proTrends = trendsResult.kind === 'ok' ? trendsResult.data : null;
  const fanInsights = fanInsightsResult.kind === 'ok' ? fanInsightsResult.data : null;
  const insights = insightsResult.kind === 'ok' ? insightsResult.data : null;

  let rangeLockedPayload: AnalyticsFeatureLockPayload | null = null;
  if (overviewResult.kind === 'locked') {
    rangeLockedPayload = overviewResult.payload;
  }

  const errorMessage =
    overviewResult.kind === 'error'
      ? overviewResult.message
      : insightsResult.kind === 'error'
        ? insightsResult.message
        : null;

  const hasOneYearAccess = Boolean(entitlements?.features.analytics_pro);

  return (
    <AnalyticsPage
      overview={overview}
      proTrends={proTrends}
      fanInsights={fanInsights}
      insights={insights}
      range={range}
      hasOneYearAccess={hasOneYearAccess}
      rangeLockedPayload={rangeLockedPayload}
      errorMessage={errorMessage}
      artistId={artistId}
      artistYouTubeUrl={artist?.youtubeUrl ?? null}
    />
  );
}
