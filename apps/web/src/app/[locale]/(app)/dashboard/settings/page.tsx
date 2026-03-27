import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ComingSoon } from '@/components/shared/ComingSoon';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard.settings');
  return { title: t('title') };
}

export default async function DashboardSettingsPage() {
  const t = await getTranslations('dashboard.settings');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <ComingSoon title={t('coming_soon')} description={t('coming_soon_description')} />
    </div>
  );
}
