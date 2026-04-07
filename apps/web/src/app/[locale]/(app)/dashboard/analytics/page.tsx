import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth';
import { getBillingEntitlements } from '@/lib/api/billing';
import { getAuthMe, getCurrentArtistId } from '@/lib/api/me';
import {
  getAnalyticsFanInsights,
  getAnalyticsOverview,
  getAnalyticsProTrends,
  getAnalyticsSmartLinkPerformance,
  type AnalyticsFeatureLockPayload,
  type AnalyticsRange,
} from '@/lib/api/analytics';
import { AnalyticsDashboard } from '@/features/analytics/components/AnalyticsDashboard';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard.analytics');
  return { title: t('title') };
}

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

const VALID_RANGES: AnalyticsRange[] = ['7d', '30d', '90d', '365d'];

function parseRange(raw: string | undefined): AnalyticsRange {
  if (raw && VALID_RANGES.includes(raw as AnalyticsRange)) {
    return raw as AnalyticsRange;
  }
  return '30d';
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
export default async function DashboardAnalyticsPage({ searchParams }: PageProps) {
  const { range: rawRange } = await searchParams;
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

  const entitlements = await getBillingEntitlements(artistId, session.accessToken).catch(
    () => null,
  );
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

      if (trendsResult.kind === 'ok') {
        proTrends = trendsResult.data;
      } else if (trendsResult.kind === 'locked') {
        analyticsProLockPayload = trendsResult.payload;
      } else {
        analyticsProErrorMessage = trendsResult.message;
      }

      if (smartLinksResult.kind === 'ok') {
        smartLinkPerformance = smartLinksResult.data;
      } else if (smartLinksResult.kind === 'locked') {
        analyticsProLockPayload = smartLinksResult.payload;
      } else {
        analyticsProErrorMessage ??= smartLinksResult.message;
      }
    } else {
      const [trendsResult, smartLinksResult] = await Promise.all([
        getAnalyticsProTrends(artistId, session.accessToken, range),
        getAnalyticsSmartLinkPerformance(artistId, session.accessToken, range),
      ]);

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
      if (fanInsightsResult.kind === 'ok') {
        fanInsights = fanInsightsResult.data;
      } else if (fanInsightsResult.kind === 'locked') {
        fanInsightsLockPayload = fanInsightsResult.payload;
      } else {
        fanInsightsErrorMessage = fanInsightsResult.message;
      }
    } else {
      const fanInsightsResult = await getAnalyticsFanInsights(artistId, session.accessToken, range);
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
    />
  );
}
