import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { withAuth, getSignInUrl } from '@workos-inc/authkit-nextjs';
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
   * Sign-up and sign-in both go through the same WorkOS hosted auth UI.
   *
   * Passing `returnTo: /${locale}/dashboard` stores the locale-aware path in the
   * PKCE state cookie. handleAuth() reads it and redirects there after the user
   * completes sign-up, ensuring they land on the correct locale.
   * Dashboard will redirect to onboarding for brand-new users (no artist profile).
   *
   * See login/page.tsx for the full explanation of the Server Action pattern.
   */
  async function startSignIn() {
    'use server';
    const signInUrl = await getSignInUrl({ returnTo: `/${locale}/dashboard` });
    redirect(signInUrl);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      <SignupForm action={startSignIn} locale={locale} />
    </div>
  );
}
