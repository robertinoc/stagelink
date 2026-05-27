import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ConnectionErrorState } from '@/components/shared/ConnectionErrorState';
import { SectionHeader } from '@/components/sl/SlPrimitives';
import { SettingsTabs } from '@/features/dashboard/settings/tabs/SettingsTabs';
import {
  DashboardSettingsUnavailableError,
  loadDashboardSettingsData,
  resolveTabId,
} from '@/features/dashboard/settings/settings-data';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard.settings');
  return { title: t('title') };
}

export default async function DashboardSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { locale } = await params;
  const { tab } = await searchParams;
  const initialTab = resolveTabId(tab);

  const t = await getTranslations('dashboard.settings.layout');
  const data = await loadDashboardSettingsData(locale).catch((error: unknown) => {
    if (error instanceof DashboardSettingsUnavailableError) {
      return null;
    }
    throw error;
  });

  if (!data) {
    return <ConnectionErrorState href={`/${locale}/dashboard/settings`} />;
  }

  return (
    <div className="space-y-0">
      <SectionHeader
        eyebrow={t('eyebrow')}
        title={t('title_lead')}
        gradient={t('title_gradient')}
        subtitle={t('subtitle')}
      />
      <SettingsTabs initialTab={initialTab} locale={locale} data={data} />
    </div>
  );
}
