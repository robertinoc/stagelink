import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAuthMe } from '@/lib/api/me';
import { OnboardingWizard } from '@/features/onboarding/components/OnboardingWizard';

interface OnboardingPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Onboarding lives OUTSIDE the (app) route group intentionally.
 *
 * The (app) layout wraps every page with AppShell (sidebar + topbar).
 * New users who haven't created an artist yet should see a clean,
 * distraction-free wizard — not the full app chrome with "—" for
 * artist name and disabled nav items.
 *
 * Auth is provided by [locale]/layout.tsx (i18n) + this page's own
 * getSession() check. The (app) layout auth guard does NOT apply here.
 */
export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const { locale } = await params;
  const session = await getSession();

  // getSession() returns AuthSession | null — this redirect is required for
  // TypeScript to narrow the type before accessing session.accessToken below.
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
