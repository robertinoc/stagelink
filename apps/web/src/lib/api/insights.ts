import { apiFetch } from '@/lib/auth';
import type {
  BillingSubscriptionStatus,
  FeatureKey,
  PlanCode,
  StageLinkInsightsDashboard,
} from '@stagelink/types';

export interface StageLinkInsightsLockPayload {
  code: 'FEATURE_NOT_INCLUDED_IN_PLAN';
  feature: FeatureKey;
  effectivePlan: PlanCode;
  billingPlan: PlanCode;
  subscriptionStatus: BillingSubscriptionStatus;
  requiredPlan: PlanCode;
  message: string;
}

export type StageLinkInsightsResult =
  | { kind: 'ok'; data: StageLinkInsightsDashboard }
  | { kind: 'locked'; payload: StageLinkInsightsLockPayload }
  | { kind: 'error'; message: string };

async function fetchInsightsResource(
  path: string,
  accessToken: string,
): Promise<StageLinkInsightsResult> {
  try {
    const res = await apiFetch(path, {
      accessToken,
      cache: 'no-store',
    });

    if (res.ok) {
      return { kind: 'ok', data: (await res.json()) as StageLinkInsightsDashboard };
    }

    const payload = (await res
      .json()
      .catch(() => ({}))) as Partial<StageLinkInsightsLockPayload> & {
      message?: string | string[];
    };
    const message = Array.isArray(payload.message)
      ? payload.message.join(', ')
      : (payload.message ?? 'Failed to load StageLink Insights');

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
    return { kind: 'error', message: 'Failed to load StageLink Insights' };
  }
}

export function getStageLinkInsightsDashboard(
  artistId: string,
  accessToken: string,
): Promise<StageLinkInsightsResult> {
  return fetchInsightsResource(`/api/insights/${artistId}/dashboard`, accessToken);
}
