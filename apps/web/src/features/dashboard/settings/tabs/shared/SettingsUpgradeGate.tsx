'use client';

import { useTranslations } from 'next-intl';
import { FeatureLockCta } from '@/components/billing/FeatureLockCta';
import { resolvePlanLabel } from '@/features/dashboard/settings/settings-data';
import type { DashboardSettingsData } from '@/features/dashboard/settings/settings-data';

interface SettingsUpgradeGateProps {
  data: DashboardSettingsData;
  locale: string;
  /** i18n key under dashboard.settings.upgrade_gate for the title */
  titleKey: string;
  /** i18n key under dashboard.settings.upgrade_gate for the description */
  descriptionKey: string;
}

/**
 * Shown in place of the Connections / Stores functional UI when the user's
 * plan doesn't include the feature. Reuses the existing FeatureLockCta and
 * sends the user to the Plan tab (?tab=plan) to upgrade. Pure presentation —
 * the caller decides when to render it based on summary.entitlements.
 */
export function SettingsUpgradeGate({
  data,
  locale,
  titleKey,
  descriptionKey,
}: SettingsUpgradeGateProps) {
  const t = useTranslations('dashboard.settings.upgrade_gate');

  return (
    <FeatureLockCta
      title={t(titleKey)}
      description={t(descriptionKey)}
      currentPlanLabel={t('current_plan', {
        plan: resolvePlanLabel(data.summary.effectivePlan),
      })}
      requiredPlanLabel={t('required_plan')}
      href={`/${locale}/dashboard/settings?tab=plan`}
      ctaLabel={t('cta')}
    />
  );
}
