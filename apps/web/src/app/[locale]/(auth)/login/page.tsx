import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
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
      <LoginForm action={`/${locale}/login/start`} locale={locale} errorMessage={errorMessage} />
    </div>
  );
}
