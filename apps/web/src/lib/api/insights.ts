import { apiFetch } from '@/lib/auth';
import type {
  BillingSubscriptionStatus,
  FeatureKey,
  PlanCode,
  SpotifyInsightsConnectionValidationResult,
  SpotifyInsightsSyncResult,
  StageLinkInsightsDateRange,
  StageLinkInsightsConnection,
  StageLinkInsightsDashboard,
  UpdateSpotifyInsightsConnectionPayload,
  ValidateSpotifyInsightsConnectionPayload,
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
  range?: StageLinkInsightsDateRange,
): Promise<StageLinkInsightsResult> {
  const query = range ? `?range=${encodeURIComponent(range)}` : '';
  return fetchInsightsResource(`/api/insights/${artistId}/dashboard${query}`, accessToken);
}

async function readJsonOrThrow<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    const message = !err.message
      ? fallback
      : Array.isArray(err.message)
        ? err.message.join(', ')
        : err.message;
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export async function validateSpotifyInsightsConnection(
  artistId: string,
  payload: ValidateSpotifyInsightsConnectionPayload,
): Promise<SpotifyInsightsConnectionValidationResult> {
  const res = await fetch(`/api/insights/${artistId}/spotify/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return readJsonOrThrow<SpotifyInsightsConnectionValidationResult>(
    res,
    'Could not validate Spotify connection',
  );
}

export async function saveSpotifyInsightsConnection(
  artistId: string,
  payload: UpdateSpotifyInsightsConnectionPayload,
): Promise<StageLinkInsightsConnection> {
  const res = await fetch(`/api/insights/${artistId}/spotify`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return readJsonOrThrow<StageLinkInsightsConnection>(res, 'Could not save Spotify connection');
}

export async function syncSpotifyInsightsConnection(
  artistId: string,
): Promise<SpotifyInsightsSyncResult> {
  const res = await fetch(`/api/insights/${artistId}/spotify/sync`, {
    method: 'POST',
    cache: 'no-store',
  });

  return readJsonOrThrow<SpotifyInsightsSyncResult>(res, 'Could not sync Spotify insights');
}
