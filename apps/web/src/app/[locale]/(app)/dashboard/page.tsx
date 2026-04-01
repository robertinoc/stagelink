import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { DashboardWelcome } from '@/features/dashboard/components/DashboardWelcome';
import { getAuthMe } from '@/lib/api/me';
import { getSession } from '@/lib/auth';

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
    if (me && me.artistIds.length === 0) {
      redirect(`/${locale}/onboarding`);
    }
  }

  return <DashboardWelcome />;
}
