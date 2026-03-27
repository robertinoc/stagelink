import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAuthMe } from '@/lib/api/me';
import { OnboardingWizard } from '@/features/onboarding/components/OnboardingWizard';

interface OnboardingPageProps {
  params: Promise<{ locale: string }>;
}

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const { locale } = await params;
  const session = await getSession();

  // Layout already redirects unauthenticated users, but getSession() returns
  // null | AuthSession — this redirect is required for TypeScript to narrow the
  // type before accessing session.accessToken below.
  if (!session) {
    redirect(`/${locale}/login`);
  }

  const { accessToken } = session;

  // If the user already has an artist, skip onboarding (e.g. back-navigation).
  const me = await getAuthMe(accessToken);
  if (me && me.artistIds.length > 0) {
    redirect(`/${locale}/dashboard`);
  }

  return <OnboardingWizard accessToken={accessToken} locale={locale} />;
}
