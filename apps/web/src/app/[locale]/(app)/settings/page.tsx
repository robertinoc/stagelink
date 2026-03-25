import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('settings');
  return { title: t('title') };
}

export default async function SettingsPage() {
  const t = await getTranslations('settings');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">Manage your account settings.</p>
      </div>
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        Settings coming soon.
      </div>
    </div>
  );
}
