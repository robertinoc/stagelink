import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  loadDashboardSettingsData,
  resolvePlanLabel,
} from '@/features/dashboard/settings/settings-data';
import {
  SettingsSectionShell,
  ShopifyStoreSection,
} from '@/features/dashboard/settings/SettingsSections';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'StageLink | Shopify Store' };
}

export default async function DashboardSettingsShopifyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('dashboard.settings');
  const data = await loadDashboardSettingsData(locale);

  return (
    <SettingsSectionShell
      eyebrow={t('navigation.shopify_store')}
      title={t('navigation.shopify_store')}
      description={t('overview.shopify_store')}
      backHref={`/${locale}/dashboard/settings`}
      backLabel={t('title')}
    >
      <ShopifyStoreSection
        artistId={data.artistId}
        currentPlanLabel={resolvePlanLabel(data.summary.effectivePlan)}
        hasFeatureAccess={data.summary.entitlements.shopify_integration}
        initialConnection={data.shopifyConnection}
      />
    </SettingsSectionShell>
  );
}
