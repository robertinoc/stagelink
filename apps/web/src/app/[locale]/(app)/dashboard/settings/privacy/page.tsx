import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { SettingsSectionShell } from '@/features/dashboard/settings/SettingsSections';
import { PrivacyRightsPanel } from '@/features/privacy/components/PrivacyRightsPanel';
import { getAuthMe } from '@/lib/api/me';
import { getSession } from '@/lib/auth';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard.settings.privacy');
  return { title: t('title') };
}

export default async function PrivacySettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('dashboard.settings');
  const privacyT = await getTranslations('dashboard.settings.privacy');
  const session = await getSession();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const me = await getAuthMe(session.accessToken);
  if (!me) {
    redirect(`/${locale}/login`);
  }

  return (
    <SettingsSectionShell
      eyebrow={t('title')}
      title={privacyT('title')}
      description={privacyT('description')}
      backHref={`/${locale}/dashboard/settings`}
      backLabel={t('navigation.title')}
    >
      <PrivacyRightsPanel email={me.email} firstName={me.firstName} lastName={me.lastName} />
    </SettingsSectionShell>
  );
}
