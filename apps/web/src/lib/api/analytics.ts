import { apiFetch } from '@/lib/auth';
import type { BillingSubscriptionStatus, FeatureKey, PlanCode } from '@stagelink/types';

export type AnalyticsRange = '7d' | '30d' | '90d' | '365d';

export interface TopLink {
  linkItemId: string;
  label: string | null;
  blockId: string | null;
  clicks: number;
  isSmartLink: boolean;
  smartLinkId: string | null;
}

export interface AnalyticsSummary {
  pageViews: number;
  linkClicks: number;
  ctr: number;
  smartLinkResolutions: number;
}

export interface AnalyticsNotes {
  dataQuality: 'basic' | 'standard' | 'advanced';
  botFilteringApplied: boolean;
  deduplicationApplied: boolean;
  qualityFlagsApplied: boolean;
  filtersActive: string[];
}

export interface AnalyticsOverview {
  artistId: string;
  range: AnalyticsRange;
  summary: AnalyticsSummary;
  topLinks: TopLink[];
  notes: AnalyticsNotes;
}

export interface AnalyticsTrendPoint {
  date: string;
  value: number;
}

export interface AnalyticsProTrends {
  artistId: string;
  range: AnalyticsRange;
  series: {
    pageViews: AnalyticsTrendPoint[];
    linkClicks: AnalyticsTrendPoint[];
    smartLinkResolutions: AnalyticsTrendPoint[];
  };
  notes: AnalyticsNotes;
}

export interface SmartLinkPerformanceItem {
  smartLinkId: string;
  label: string;
  clicks: number;
  resolutions: number;
}

export interface AnalyticsSmartLinkPerformance {
  artistId: string;
  range: AnalyticsRange;
  items: SmartLinkPerformanceItem[];
  notes: AnalyticsNotes;
}

export interface TopCaptureBlock {
  blockId: string;
  label: string;
  captures: number;
}

export interface AnalyticsFanInsights {
  artistId: string;
  range: AnalyticsRange;
  summary: {
    pageViews: number;
    fanCaptures: number;
    fanCaptureRate: number;
  };
  capturesOverTime: AnalyticsTrendPoint[];
  topCaptureBlocks: TopCaptureBlock[];
  notes: AnalyticsNotes & {
    captureRateFormula: 'fan_capture_submit / page_view';
    piiIncluded: false;
  };
}

export interface AnalyticsFeatureLockPayload {
  code: 'FEATURE_NOT_INCLUDED_IN_PLAN';
  feature: FeatureKey;
  effectivePlan: PlanCode;
  billingPlan: PlanCode;
  subscriptionStatus: BillingSubscriptionStatus;
  requiredPlan: PlanCode;
  message: string;
}

export type AnalyticsProtectedResult<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'locked'; payload: AnalyticsFeatureLockPayload }
  | { kind: 'error'; message: string };

async function fetchAnalyticsResource<T>(
  path: string,
  accessToken: string,
): Promise<AnalyticsProtectedResult<T>> {
  try {
    const res = await apiFetch(path, {
      accessToken,
      cache: 'no-store',
    });

    if (res.ok) {
      return { kind: 'ok', data: (await res.json()) as T };
    }

    const payload = (await res.json().catch(() => ({}))) as Partial<AnalyticsFeatureLockPayload> & {
      message?: string | string[];
    };
    const message = Array.isArray(payload.message)
      ? payload.message.join(', ')
      : (payload.message ?? 'Failed to load analytics');

    if (res.status === 403 && payload.code === 'FEATURE_NOT_INCLUDED_IN_PLAN') {
      return {
        kind: 'locked',
        payload: {
          code: 'FEATURE_NOT_INCLUDED_IN_PLAN',
          feature: payload.feature!,
          effectivePlan: payload.effectivePlan!,
          billingPlan: payload.billingPlan!,
          subscriptionStatus: payload.subscriptionStatus!,
          requiredPlan: payload.requiredPlan!,
          message,
        },
      };
    }

    return { kind: 'error', message };
  } catch {
    return { kind: 'error', message: 'Failed to load analytics' };
  }
}

export function getAnalyticsOverview(
  artistId: string,
  accessToken: string,
  range: AnalyticsRange = '30d',
): Promise<AnalyticsProtectedResult<AnalyticsOverview>> {
  return fetchAnalyticsResource<AnalyticsOverview>(
    `/api/analytics/${artistId}/overview?range=${range}`,
    accessToken,
  );
}

export function getAnalyticsProTrends(
  artistId: string,
  accessToken: string,
  range: AnalyticsRange = '30d',
): Promise<AnalyticsProtectedResult<AnalyticsProTrends>> {
  return fetchAnalyticsResource<AnalyticsProTrends>(
    `/api/analytics/${artistId}/pro/trends?range=${range}`,
    accessToken,
  );
}

export function getAnalyticsSmartLinkPerformance(
  artistId: string,
  accessToken: string,
  range: AnalyticsRange = '30d',
): Promise<AnalyticsProtectedResult<AnalyticsSmartLinkPerformance>> {
  return fetchAnalyticsResource<AnalyticsSmartLinkPerformance>(
    `/api/analytics/${artistId}/pro/smart-links?range=${range}`,
    accessToken,
  );
}

export function getAnalyticsFanInsights(
  artistId: string,
  accessToken: string,
  range: AnalyticsRange = '30d',
): Promise<AnalyticsProtectedResult<AnalyticsFanInsights>> {
  return fetchAnalyticsResource<AnalyticsFanInsights>(
    `/api/analytics/${artistId}/pro/fan-insights?range=${range}`,
    accessToken,
  );
}
