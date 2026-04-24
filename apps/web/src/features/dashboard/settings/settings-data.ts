import { redirect } from 'next/navigation';
import { getArtist } from '@/lib/api/artists';
import { getBillingSummary } from '@/lib/api/billing';
import { getStageLinkInsightsDashboard } from '@/lib/api/insights';
import { getAuthMe, getCurrentArtistId } from '@/lib/api/me';
import { getMerchConnection } from '@/lib/api/merch';
import { getShopifyConnection } from '@/lib/api/shopify';
import { getSession } from '@/lib/auth';

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

export async function loadDashboardSettingsData(locale: string) {
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

  return {
    session,
    artistId,
    artist,
    summary,
    shopifyConnection,
    merchConnection,
    insightsResult,
  };
}
