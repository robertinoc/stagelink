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
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  const t = await getTranslations('auth.login');

  // Si ya hay sesión activa → ir al dashboard directamente
  const { user } = await withAuth();
  if (user) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      {/* signInUrl points to the route handler which calls getSignInUrl() server-side */}
      <LoginForm signInUrl="/api/auth/signin" locale={locale} />
    </div>
  );
}
