import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  loadDashboardSettingsData,
  resolvePlanLabel,
} from '@/features/dashboard/settings/settings-data';
import {
  SettingsOverviewGrid,
  type SettingsSectionCardItem,
} from '@/features/dashboard/settings/SettingsSections';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard.settings');
  return { title: t('title') };
}

export default async function DashboardSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('dashboard.settings');
  const data = await loadDashboardSettingsData(locale);

  const items: SettingsSectionCardItem[] = [
    {
      slug: 'plans-billing',
      label: t('navigation.plans_billing'),
      description: t('overview.plans_billing'),
      badge: resolvePlanLabel(data.summary.effectivePlan),
      href: `/${locale}/dashboard/settings/plans-billing`,
    },
    {
      slug: 'insights-connections',
      label: t('navigation.insights_connections'),
      description: t('overview.insights_connections'),
      badge: data.summary.entitlements.stage_link_insights
        ? t('overview.badges.enabled')
        : t('overview.badges.locked'),
      href: `/${locale}/dashboard/settings/insights-connections`,
      muted: !data.summary.entitlements.stage_link_insights,
    },
    {
      slug: 'shopify-store',
      label: t('navigation.shopify_store'),
      description: t('overview.shopify_store'),
      badge:
        data.summary.entitlements.shopify_integration && data.shopifyConnection
          ? t('overview.badges.connected')
          : data.summary.entitlements.shopify_integration
            ? t('overview.badges.ready')
            : t('overview.badges.locked'),
      href: `/${locale}/dashboard/settings/shopify-store`,
      muted: !data.summary.entitlements.shopify_integration,
    },
    {
      slug: 'smart-merch',
      label: t('navigation.smart_merch'),
      description: t('overview.smart_merch'),
      badge:
        data.summary.entitlements.smart_merch && data.merchConnection
          ? t('overview.badges.connected')
          : data.summary.entitlements.smart_merch
            ? t('overview.badges.ready')
            : t('overview.badges.locked'),
      href: `/${locale}/dashboard/settings/smart-merch`,
      muted: !data.summary.entitlements.smart_merch,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <SettingsOverviewGrid
        title={t('navigation.title')}
        description={t('navigation.description')}
        items={items}
        openLabel={t('overview.open_section')}
      />
    </div>
  );
}
