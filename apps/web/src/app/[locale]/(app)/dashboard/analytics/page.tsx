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
  getAnalyticsSmartLinkPerformance,
  type AnalyticsFeatureLockPayload,
  type AnalyticsProtectedResult,
  type AnalyticsRange,
} from '@/lib/api/analytics';
import { AnalyticsDashboard } from '@/features/analytics/components/AnalyticsDashboard';

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

/**
 * Type predicate: narrows an AnalyticsProtectedResult to session_expired.
 * Using a type predicate (not plain boolean) lets TypeScript exclude the
 * session_expired variant after the guard redirect, preventing false TS
 * errors on `.message` access in the non-expired branches.
 */
function isSessionExpired<T>(
  result: AnalyticsProtectedResult<T>,
): result is { kind: 'session_expired' } {
  return result.kind === 'session_expired';
}

/**
 * DashboardAnalyticsPage — server component.
 *
 * Fetches analytics data server-side so the initial render is complete
 * (no loading flash). Range switching navigates to ?range=... which
 * causes Next.js to re-run this function with the new search params.
 *
 * Authentication is guaranteed by the parent (app) layout.
 * artistId is resolved from the session via getAuthMe.
 */
export default async function DashboardAnalyticsPage({ params, searchParams }: PageProps) {
  const [{ locale }, { range: rawRange, insightsRange }] = await Promise.all([
    params,
    searchParams,
  ]);
  const range = parseRange(rawRange);

  const session = await getSession();
  if (!session) {
    // Parent layout handles auth redirect; this branch is a safety net.
    return null;
  }

  const me = await getAuthMe(session.accessToken);
  const artistId = getCurrentArtistId(me);

  // No artist yet (e.g. during onboarding) — parent layout handles redirect.
  if (!artistId) {
    return null;
  }

  const [entitlements, artist, insightsResult] = await Promise.all([
    getBillingEntitlements(artistId, session.accessToken).catch(() => null),
    getArtist(artistId, session.accessToken).catch(() => null),
    getStageLinkInsightsDashboard(artistId, session.accessToken, insightsRange).catch(() => ({
      kind: 'error' as const,
      message: 'Failed to load StageLink Insights',
    })),
  ]);
  const analyticsProEnabled = entitlements?.features.analytics_pro;
  const advancedFanInsightsEnabled = entitlements?.features.advanced_fan_insights;
  let rangeLockedPayload: AnalyticsFeatureLockPayload | null = null;
  let data = null;
  let errorMessage: string | null = null;
  let proTrends = null;
  let smartLinkPerformance = null;
  let fanInsights = null;
  let analyticsProLockPayload: AnalyticsFeatureLockPayload | null = null;
  let fanInsightsLockPayload: AnalyticsFeatureLockPayload | null = null;
  let analyticsProErrorMessage: string | null = null;
  let fanInsightsErrorMessage: string | null = null;

  const result = await getAnalyticsOverview(artistId, session.accessToken, range);
  if (isSessionExpired(result)) {
    // Access token rejected — clear the stale WorkOS session and force re-auth.
    redirect(`/${locale}/login`);
  }
  if (result.kind === 'ok') {
    data = result.data;
  } else if (result.kind === 'locked') {
    rangeLockedPayload = result.payload;
  } else {
    errorMessage = result.message;
  }

  if (!rangeLockedPayload) {
    if (analyticsProEnabled) {
      const [trendsResult, smartLinksResult] = await Promise.all([
        getAnalyticsProTrends(artistId, session.accessToken, range),
        getAnalyticsSmartLinkPerformance(artistId, session.accessToken, range),
      ]);

      if (isSessionExpired(trendsResult) || isSessionExpired(smartLinksResult)) {
        redirect(`/${locale}/login`);
      }

      if (trendsResult.kind === 'ok') {
        proTrends = trendsResult.data;
      } else if (trendsResult.kind === 'locked') {
        analyticsProLockPayload = trendsResult.payload;
      } else if (trendsResult.kind === 'error') {
        analyticsProErrorMessage = trendsResult.message;
      }

      if (smartLinksResult.kind === 'ok') {
        smartLinkPerformance = smartLinksResult.data;
      } else if (smartLinksResult.kind === 'locked') {
        analyticsProLockPayload = smartLinksResult.payload;
      } else if (smartLinksResult.kind === 'error') {
        analyticsProErrorMessage ??= smartLinksResult.message;
      }
    } else {
      const [trendsResult, smartLinksResult] = await Promise.all([
        getAnalyticsProTrends(artistId, session.accessToken, range),
        getAnalyticsSmartLinkPerformance(artistId, session.accessToken, range),
      ]);

      if (isSessionExpired(trendsResult) || isSessionExpired(smartLinksResult)) {
        redirect(`/${locale}/login`);
      }

      if (trendsResult.kind === 'locked') {
        analyticsProLockPayload = trendsResult.payload;
      } else if (trendsResult.kind === 'error') {
        analyticsProErrorMessage = trendsResult.message;
      }

      if (smartLinksResult.kind === 'locked') {
        analyticsProLockPayload ??= smartLinksResult.payload;
      } else if (smartLinksResult.kind === 'error') {
        analyticsProErrorMessage ??= smartLinksResult.message;
      }
    }

    if (advancedFanInsightsEnabled) {
      const fanInsightsResult = await getAnalyticsFanInsights(artistId, session.accessToken, range);
      if (isSessionExpired(fanInsightsResult)) {
        redirect(`/${locale}/login`);
      }
      if (fanInsightsResult.kind === 'ok') {
        fanInsights = fanInsightsResult.data;
      } else if (fanInsightsResult.kind === 'locked') {
        fanInsightsLockPayload = fanInsightsResult.payload;
      } else if (fanInsightsResult.kind === 'error') {
        fanInsightsErrorMessage = fanInsightsResult.message;
      }
    } else {
      const fanInsightsResult = await getAnalyticsFanInsights(artistId, session.accessToken, range);
      if (isSessionExpired(fanInsightsResult)) {
        redirect(`/${locale}/login`);
      }
      if (fanInsightsResult.kind === 'locked') {
        fanInsightsLockPayload = fanInsightsResult.payload;
      } else if (fanInsightsResult.kind === 'error') {
        fanInsightsErrorMessage = fanInsightsResult.message;
      }
    }
  }

  return (
    <AnalyticsDashboard
      data={data}
      proTrends={proTrends}
      smartLinkPerformance={smartLinkPerformance}
      fanInsights={fanInsights}
      range={range}
      entitlements={entitlements}
      rangeLocked={Boolean(rangeLockedPayload)}
      rangeLockedPayload={rangeLockedPayload}
      analyticsProLockPayload={analyticsProLockPayload}
      fanInsightsLockPayload={fanInsightsLockPayload}
      errorMessage={errorMessage}
      analyticsProErrorMessage={analyticsProErrorMessage}
      fanInsightsErrorMessage={fanInsightsErrorMessage}
      artistId={artistId}
      artistYouTubeUrl={artist?.youtubeUrl ?? null}
      insightsData={insightsResult.kind === 'ok' ? insightsResult.data : null}
      insightsLockPayload={insightsResult.kind === 'locked' ? insightsResult.payload : null}
      insightsErrorMessage={insightsResult.kind === 'error' ? insightsResult.message : null}
    />
  );
}
