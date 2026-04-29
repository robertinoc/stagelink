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
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  const t = await getTranslations('auth.login');

  // Si ya hay sesión activa → ir al dashboard directamente
  const { user } = await withAuth();
  if (user) {
    redirect(`/${locale}/dashboard`);
  }

  /**
   * Server Action: generates the WorkOS authorization URL and redirects.
   *
   * getSignInUrl() must run in a Route Handler or Server Action (not a plain
   * Server Component) because it writes a state cookie for PKCE verification.
   * By using a Server Action here the browser never navigates to /api/auth/signin,
   * which prevents Chrome SafeBrowsing from flagging the URL as dangerous.
   *
   * Flow:
   *   1. User submits the form (POST to this action)
   *   2. getSignInUrl() generates the WorkOS OAuth URL + sets state cookie
   *   3. redirect() sends the browser to https://authkit.workos.com/...
   *   4. WorkOS authenticates and redirects to /api/auth/callback
   */
  async function startSignIn() {
    'use server';
    const signInUrl = await getSignInUrl();
    redirect(signInUrl);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      <LoginForm action={startSignIn} locale={locale} />
    </div>
  );
}
