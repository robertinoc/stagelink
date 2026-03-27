import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { DashboardWelcome } from '@/features/dashboard/components/DashboardWelcome';
import { getSession } from '@/lib/auth';
import { getAuthMe } from '@/lib/api/me';

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard');
  return { title: t('title') };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const session = await getSession();

  if (session) {
    const me = await getAuthMe(session.accessToken);
    // No artist yet → send to onboarding wizard
    if (me && me.artistIds.length === 0) {
      redirect(`/${locale}/onboarding`);
    }
  }

  return <DashboardWelcome locale={locale} />;
}
