import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      <SignupForm signUpUrl="/api/auth/signin" />
    </div>
  );
}
