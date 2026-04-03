import { apiFetch } from '@/lib/auth';
import type { BillingSubscriptionStatus, FeatureKey, PlanCode } from '@stagelink/types';

// ─── Types (mirror of API DTOs) ───────────────────────────────────────────────

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
  /** Decimal CTR: 0.17 = 17 %. Returns 0 when there are no page views. */
  ctr: number;
  smartLinkResolutions: number;
}

export interface AnalyticsNotes {
  /** T4-4: 'standard' = quality flag filtering applied at query time. */
  dataQuality: 'basic' | 'standard' | 'advanced';
  botFilteringApplied: boolean;
  deduplicationApplied: boolean;
  /** T4-4: true when quality flag filters (isBot/isInternal/isQa/environment) are applied. */
  qualityFlagsApplied: boolean;
  /** T4-4: human-readable list of active filters for debugging. */
  filtersActive: string[];
}

export interface AnalyticsOverview {
  artistId: string;
  range: AnalyticsRange;
  summary: AnalyticsSummary;
  topLinks: TopLink[];
  notes: AnalyticsNotes;
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

export type AnalyticsOverviewResult =
  | { kind: 'ok'; data: AnalyticsOverview }
  | { kind: 'locked'; payload: AnalyticsFeatureLockPayload }
  | { kind: 'error'; message: string };

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Fetches analytics overview for an artist.
 * Returns null on any error (network, auth, 404) — caller shows error/empty state.
 *
 * @param artistId    Validated artist UUID (caller must have read access).
 * @param accessToken WorkOS access token from the server session.
 * @param range       Date range preset. Defaults to '30d'.
 */
export async function getAnalyticsOverview(
  artistId: string,
  accessToken: string,
  range: AnalyticsRange = '30d',
): Promise<AnalyticsOverviewResult> {
  try {
    const res = await apiFetch(`/api/analytics/${artistId}/overview?range=${range}`, {
      accessToken,
      cache: 'no-store',
    });

    if (res.ok) {
      return { kind: 'ok', data: (await res.json()) as AnalyticsOverview };
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
