import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { withAuth, getSignInUrl } from '@workos-inc/authkit-nextjs';
import { LoginForm } from '@/features/auth/components/LoginForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.login');
  return { title: t('title') };
}

interface LoginPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const [{ locale }, resolvedSearchParams, t] = await Promise.all([
    params,
    searchParams,
    getTranslations('auth.login'),
  ]);

  // Si ya hay sesión activa → ir al dashboard directamente
  const { user } = await withAuth();
  if (user) {
    redirect(`/${locale}/dashboard`);
  }

  /**
   * Server Action: generates the WorkOS authorization URL and redirects.
   *
   * getSignInUrl({ returnTo }) stores the destination path in the encrypted PKCE
   * state cookie. handleAuth() at /api/auth/callback reads this from the cookie
   * and redirects there after successful authentication.
   *
   * Passing `/${locale}/dashboard` ensures the user lands on the correct locale
   * after auth. Without it the callback falls back to the hardcoded
   * returnPathname: '/en/dashboard', sending non-English users to the wrong locale.
   *
   * Flow:
   *   1. User submits the form (POST to this action)
   *   2. getSignInUrl() generates the WorkOS OAuth URL + writes PKCE state cookie
   *   3. redirect() sends the browser to https://authkit.workos.com/...
   *   4. WorkOS authenticates and redirects to /api/auth/callback
   *   5. handleAuth reads returnTo from PKCE state → redirects to /{locale}/dashboard
   *   6. Dashboard checks for artist; if none → redirects to /{locale}/onboarding
   */
  async function startSignIn() {
    'use server';
    const signInUrl = await getSignInUrl({ returnTo: `/${locale}/dashboard` });
    redirect(signInUrl);
  }

  // ?error=auth_failed is set by the onError handler in /api/auth/callback
  // when the OAuth flow fails (PKCE mismatch, missing cookie, code-exchange error).
  const errorKey = resolvedSearchParams['error'];
  const errorMessage = errorKey === 'auth_failed' ? t('error_auth_failed') : undefined;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      <LoginForm action={startSignIn} locale={locale} errorMessage={errorMessage} />
    </div>
  );
}
