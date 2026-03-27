import { redirect } from 'next/navigation';
import { getSession, apiFetch } from '@/lib/auth';
import { OnboardingWizard } from '@/features/onboarding/components/OnboardingWizard';

interface OnboardingPageProps {
  params: Promise<{ locale: string }>;
}

interface AuthMeResponse {
  artistIds: string[];
}

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const { locale } = await params;
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect(`/${locale}/login`);
  }

  const { accessToken } = session;

  // Check if user already has an artist — if so, skip onboarding
  try {
    const res = await apiFetch('/api/auth/me', { accessToken });
    if (res.ok) {
      const me = (await res.json()) as AuthMeResponse;
      if (me.artistIds.length > 0) {
        redirect(`/${locale}/dashboard`);
      }
    }
  } catch {
    // If we can't fetch, let them through to onboarding anyway
  }

  return <OnboardingWizard accessToken={accessToken} locale={locale} />;
}
