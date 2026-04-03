import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth';
import { getBillingEntitlements } from '@/lib/api/billing';
import { getAuthMe, getCurrentArtistId } from '@/lib/api/me';
import {
  getAnalyticsOverview,
  type AnalyticsFeatureLockPayload,
  type AnalyticsRange,
} from '@/lib/api/analytics';
import type { BillingEntitlementsResponse } from '@/lib/api/billing';
import { AnalyticsDashboard } from '@/features/analytics/components/AnalyticsDashboard';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard.analytics');
  return { title: t('title') };
}

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

const VALID_RANGES: AnalyticsRange[] = ['7d', '30d', '90d', '365d'];

function createLocalRangeLockPayload(
  entitlements: BillingEntitlementsResponse,
): AnalyticsFeatureLockPayload {
  return {
    code: 'FEATURE_NOT_INCLUDED_IN_PLAN',
    feature: 'analytics_pro',
    effectivePlan: entitlements.effectivePlan,
    billingPlan: entitlements.billingPlan,
    subscriptionStatus: entitlements.subscriptionStatus,
    requiredPlan: 'pro_plus',
    message: 'Feature not included in current plan',
  };
}

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
  let rangeLockedPayload: AnalyticsFeatureLockPayload | null = null;
  let data = null;
  let errorMessage: string | null = null;

  if (range === '365d' && analyticsProEnabled === false) {
    rangeLockedPayload = entitlements ? createLocalRangeLockPayload(entitlements) : null;
  } else {
    const result = await getAnalyticsOverview(artistId, session.accessToken, range);
    if (result.kind === 'ok') {
      data = result.data;
    } else if (result.kind === 'locked') {
      rangeLockedPayload = result.payload;
    } else {
      errorMessage = result.message;
    }
  }

  return (
    <AnalyticsDashboard
      data={data}
      range={range}
      entitlements={entitlements}
      rangeLocked={Boolean(rangeLockedPayload)}
      rangeLockedPayload={rangeLockedPayload}
      errorMessage={errorMessage}
    />
  );
}
