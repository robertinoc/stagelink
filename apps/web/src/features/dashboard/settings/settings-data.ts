import { redirect } from 'next/navigation';
import { getArtist } from '@/lib/api/artists';
import { getBillingSummary } from '@/lib/api/billing';
import { getStageLinkInsightsDashboard } from '@/lib/api/insights';
import { getAuthMe, getCurrentArtistId, type AuthMeResponse } from '@/lib/api/me';
import { getMerchConnection } from '@/lib/api/merch';
import { getShopifyConnection } from '@/lib/api/shopify';
import { getSession } from '@/lib/auth';
import type { BillingUiSummary } from '@stagelink/types';
import {
  buildUsage,
  type SettingsInvoice,
  type SettingsTabBadgeCounts,
  type SettingsUsage,
} from './settings-types';

/**
 * Server-side loader for the Settings page. Pure helpers + types live in
 * `./settings-types` so client components and unit tests can import them
 * without dragging the server bundle (authkit, Supabase) into jsdom.
 */
export {
  resolvePlanLabel,
  canUpgradeToPlan,
  resolveTabId,
  SETTINGS_TAB_IDS,
  buildUsage,
} from './settings-types';
export type {
  PlanCode,
  SettingsTabId,
  SettingsUsage,
  SettingsInvoice,
  SettingsTabBadgeCounts,
} from './settings-types';

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

export class DashboardSettingsUnavailableError extends Error {
  constructor() {
    super('Dashboard settings are temporarily unavailable');
    this.name = 'DashboardSettingsUnavailableError';
  }
}

export async function loadDashboardSettingsData(locale: string): Promise<DashboardSettingsData> {
  const session = await getSession();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const me = await getAuthMe(session.accessToken);
  if (me === null) {
    throw new DashboardSettingsUnavailableError();
  }

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

  const spotifyConnected = isInsightsPlatformConnected(insightsResult, 'spotify');
  const youtubeConnected = isInsightsPlatformConnected(insightsResult, 'youtube');

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
    usage: buildUsage(summary.effectivePlan, artist),
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
  // getStageLinkInsightsDashboard returns { kind: 'ok', data } | locked | error.
  // The dashboard exposes platforms as an ARRAY of platform summaries — each
  // with a nested `connection.status`. Earlier code read insights[platform]
  // (a non-existent top-level key), so the badge always counted 0.
  if (!insights || !('kind' in insights) || insights.kind !== 'ok') return false;
  const summary = insights.data.platforms.find((p) => p.platform === platform);
  return summary?.connection?.status === 'connected';
}
