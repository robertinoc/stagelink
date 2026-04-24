import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  loadDashboardSettingsData,
  resolvePlanLabel,
} from '@/features/dashboard/settings/settings-data';
import {
  SettingsSectionShell,
  SmartMerchSection,
} from '@/features/dashboard/settings/SettingsSections';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'StageLink | Smart Merch' };
}

export default async function DashboardSettingsSmartMerchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('dashboard.settings');
  const data = await loadDashboardSettingsData(locale);

  return (
    <SettingsSectionShell
      eyebrow={t('navigation.smart_merch')}
      title={t('navigation.smart_merch')}
      description={t('overview.smart_merch')}
      backHref={`/${locale}/dashboard/settings`}
      backLabel={t('title')}
    >
      <SmartMerchSection
        artistId={data.artistId}
        currentPlanLabel={resolvePlanLabel(data.summary.effectivePlan)}
        hasFeatureAccess={data.summary.entitlements.smart_merch}
        initialConnection={data.merchConnection}
      />
    </SettingsSectionShell>
  );
}
