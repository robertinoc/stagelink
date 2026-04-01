import { redirect } from 'next/navigation';

/**
 * /[locale]/settings is no longer used.
 * All settings have moved to /[locale]/dashboard/settings.
 *
 * This permanent redirect ensures any bookmarked or linked URLs
 * continue to work without breaking user flows.
 */
interface SettingsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsRedirectPage({ params }: SettingsPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/settings`);
}
