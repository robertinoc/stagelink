import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  loadDashboardSettingsData,
  resolvePlanLabel,
} from '@/features/dashboard/settings/settings-data';
import {
  InsightsConnectionsSection,
  SettingsSectionShell,
} from '@/features/dashboard/settings/SettingsSections';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'StageLink | Insights Connections' };
}

export default async function DashboardSettingsInsightsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('dashboard.settings');
  const data = await loadDashboardSettingsData(locale);

  return (
    <SettingsSectionShell
      eyebrow={t('navigation.insights_connections')}
      title={t('navigation.insights_connections')}
      description={t('overview.insights_connections')}
      backHref={`/${locale}/dashboard/settings`}
      backLabel={t('title')}
    >
      <InsightsConnectionsSection
        artistId={data.artistId}
        artist={data.artist}
        currentPlanLabel={resolvePlanLabel(data.summary.effectivePlan)}
        hasFeatureAccess={data.summary.entitlements.stage_link_insights}
        data={data.insightsResult}
      />
    </SettingsSectionShell>
  );
}
