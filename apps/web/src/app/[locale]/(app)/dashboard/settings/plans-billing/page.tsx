import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  startCheckoutAction,
  startPortalAction,
} from '@/app/[locale]/(app)/dashboard/billing/actions';
import {
  loadDashboardSettingsData,
  canUpgradeToPlan,
  resolvePlanLabel,
} from '@/features/dashboard/settings/settings-data';
import {
  PlansBillingSection,
  SettingsSectionShell,
} from '@/features/dashboard/settings/SettingsSections';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'StageLink | Plans and Billing' };
}

export default async function DashboardSettingsPlansBillingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('dashboard.settings');
  const data = await loadDashboardSettingsData(locale);

  return (
    <SettingsSectionShell
      eyebrow={t('navigation.plans_billing')}
      title={t('plans.title')}
      description={t('plans.description')}
      backHref={`/${locale}/dashboard/settings`}
      backLabel={t('title')}
    >
      <PlansBillingSection
        locale={locale}
        artistId={data.artistId}
        summary={data.summary}
        t={t}
        startCheckoutAction={startCheckoutAction}
        startPortalAction={startPortalAction}
        resolvePlanLabel={resolvePlanLabel}
        canUpgradeToPlan={canUpgradeToPlan}
      />
    </SettingsSectionShell>
  );
}
