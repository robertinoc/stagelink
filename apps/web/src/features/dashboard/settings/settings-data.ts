import { redirect } from 'next/navigation';
import { getArtist } from '@/lib/api/artists';
import { getBillingSummary } from '@/lib/api/billing';
import { getStageLinkInsightsDashboard } from '@/lib/api/insights';
import { getAuthMe, getCurrentArtistId, type AuthMeResponse } from '@/lib/api/me';
import { getMerchConnection } from '@/lib/api/merch';
import { getShopifyConnection } from '@/lib/api/shopify';
import { getSession } from '@/lib/auth';
import type { BillingUiSummary } from '@stagelink/types';

export function resolvePlanLabel(plan: 'free' | 'pro' | 'pro_plus') {
  switch (plan) {
    case 'pro':
      return 'Pro';
    case 'pro_plus':
      return 'Pro+';
    default:
      return 'Free';
  }
}

export function canUpgradeToPlan(
  currentPlan: 'free' | 'pro' | 'pro_plus',
  nextPlan: 'free' | 'pro' | 'pro_plus',
) {
  const rank = { free: 0, pro: 1, pro_plus: 2 };
  return rank[nextPlan] > rank[currentPlan];
}

export type SettingsTabId = 'plan' | 'connections' | 'stores' | 'privacy';

export const SETTINGS_TAB_IDS: SettingsTabId[] = ['plan', 'connections', 'stores', 'privacy'];

export function resolveTabId(input: string | string[] | undefined): SettingsTabId {
  const raw = Array.isArray(input) ? input[0] : input;
  if (raw && (SETTINGS_TAB_IDS as readonly string[]).includes(raw)) {
    return raw as SettingsTabId;
  }
  return 'plan';
}

/**
 * Usage figures shown in the Plan tab usage panel. `null` max = unlimited
 * (rendered with the striped magenta fill).
 *
 * Per-artist counts (smart link resolutions, language count, page count,
 * storage bytes) are still wired to plan defaults. Switching them to live
 * data is tracked as a follow-up — the table already accepts real values.
 */
export interface SettingsUsage {
  smartLinkResolutions: { value: number; max: number | null };
  activeLanguages: { value: number; max: number | null };
  artistPages: { value: number; max: number | null };
  storageMb: { value: number; max: number | null };
}

export function defaultUsageForPlan(plan: 'free' | 'pro' | 'pro_plus'): SettingsUsage {
  if (plan === 'pro_plus') {
    return {
      smartLinkResolutions: { value: 0, max: null },
      activeLanguages: { value: 1, max: null },
      artistPages: { value: 1, max: 3 },
      storageMb: { value: 0, max: 2048 },
    };
  }
  if (plan === 'pro') {
    return {
      smartLinkResolutions: { value: 0, max: null },
      activeLanguages: { value: 1, max: 1 },
      artistPages: { value: 1, max: 3 },
      storageMb: { value: 0, max: 1024 },
    };
  }
  return {
    smartLinkResolutions: { value: 0, max: 50 },
    activeLanguages: { value: 1, max: 1 },
    artistPages: { value: 1, max: 1 },
    storageMb: { value: 0, max: 256 },
  };
}

export interface SettingsInvoice {
  id: string;
  date: string;
  amount: string;
  status: 'paid' | 'pending';
  pdfUrl: string | null;
}

export interface SettingsTabBadgeCounts {
  connections: { connected: number; total: number };
  stores: { connected: number; total: number };
}

export interface DashboardSettingsData {
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
  artistId: string;
  artist: Awaited<ReturnType<typeof getArtist>> | null;
  me: AuthMeResponse | null;
  summary: BillingUiSummary;
  shopifyConnection: Awaited<ReturnType<typeof getShopifyConnection>> | null;
  merchConnection: Awaited<ReturnType<typeof getMerchConnection>> | null;
  insightsResult: Awaited<ReturnType<typeof getStageLinkInsightsDashboard>> | null;
  usage: SettingsUsage;
  invoices: SettingsInvoice[];
  badges: SettingsTabBadgeCounts;
}

export async function loadDashboardSettingsData(locale: string): Promise<DashboardSettingsData> {
  const session = await getSession();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const me = await getAuthMe(session.accessToken);
  const artistId = getCurrentArtistId(me);

  if (!artistId) {
    redirect(`/${locale}/onboarding`);
  }

  const [summary, artist] = await Promise.all([
    getBillingSummary(artistId, session.accessToken),
    getArtist(artistId, session.accessToken).catch(() => null),
  ]);

  const [shopifyConnection, merchConnection, insightsResult] = await Promise.all([
    summary.entitlements.shopify_integration
      ? getShopifyConnection(artistId, session.accessToken).catch(() => null)
      : Promise.resolve(null),
    summary.entitlements.smart_merch
      ? getMerchConnection(artistId, session.accessToken).catch(() => null)
      : Promise.resolve(null),
    summary.entitlements.stage_link_insights
      ? getStageLinkInsightsDashboard(artistId, session.accessToken, '30d').catch(() => ({
          kind: 'error' as const,
          message: 'Failed to load StageLink Insights connections',
        }))
      : Promise.resolve(null),
  ]);

  const insights = insightsResult && 'kind' in insightsResult ? insightsResult : null;
  const spotifyConnected = isInsightsPlatformConnected(insights, 'spotify');
  const youtubeConnected = isInsightsPlatformConnected(insights, 'youtube');

  const connectionsBadge = {
    connected: (spotifyConnected ? 1 : 0) + (youtubeConnected ? 1 : 0),
    total: 3,
  };

  const storesBadge = {
    connected: (shopifyConnection ? 1 : 0) + (merchConnection ? 1 : 0),
    total: 2,
  };

  return {
    session,
    artistId,
    artist,
    me,
    summary,
    shopifyConnection,
    merchConnection,
    insightsResult,
    usage: defaultUsageForPlan(summary.effectivePlan),
    invoices: [],
    badges: {
      connections: connectionsBadge,
      stores: storesBadge,
    },
  };
}

function isInsightsPlatformConnected(
  insights: Awaited<ReturnType<typeof getStageLinkInsightsDashboard>> | null,
  platform: 'spotify' | 'youtube',
): boolean {
  if (!insights || insights.kind === 'error') return false;
  const record = (insights as unknown as Record<string, unknown>)[platform];
  if (!record || typeof record !== 'object') return false;
  const status = (record as Record<string, unknown>)['status'];
  return status === 'connected' || status === 'ok';
}
