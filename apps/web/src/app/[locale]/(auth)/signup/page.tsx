import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { withAuth, getSignUpUrl } from '@workos-inc/authkit-nextjs';
import { SignupForm } from '@/features/auth/components/SignupForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.signup');
  return { title: t('title') };
}

interface SignupPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SignupPage({ params }: SignupPageProps) {
  const { locale } = await params;
  const t = await getTranslations('auth.signup');

  // Si ya hay sesión activa → ir al dashboard directamente
  const { user } = await withAuth();
  if (user) {
    redirect(`/${locale}/dashboard`);
  }

  /**
   * Server Action: generates the WorkOS authorization URL and redirects.
   *
   * getSignUpUrl() sets screenHint: 'sign-up' internally, so WorkOS opens
   * the "Create account" screen directly instead of the sign-in screen.
   * This avoids the confusing step where a new user clicks "Create account"
   * on StageLink but lands on the WorkOS sign-in screen first.
   *
   * returnTo stores the locale-aware path in the PKCE state cookie so the
   * user lands on the correct locale after completing sign-up.
   * Dashboard will redirect to onboarding for brand-new users (no artist profile).
   *
   * See login/page.tsx for the full explanation of the Server Action pattern.
   */
  async function startSignUp() {
    'use server';
    const signUpUrl = await getSignUpUrl({ returnTo: `/${locale}/dashboard` });
    redirect(signUpUrl);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      <SignupForm action={startSignUp} locale={locale} />
    </div>
  );
}
