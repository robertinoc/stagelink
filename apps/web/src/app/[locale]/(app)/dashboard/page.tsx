import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { DashboardWelcome } from '@/features/dashboard/components/DashboardWelcome';
import { getSession, apiFetch } from '@/lib/auth';

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

interface AuthMeResponse {
  artistIds: string[];
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard');
  return { title: t('title') };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const session = await getSession();

  if (session) {
    try {
      const res = await apiFetch('/api/auth/me', { accessToken: session.accessToken });
      if (res.ok) {
        const me = (await res.json()) as AuthMeResponse;
        if (me.artistIds.length === 0) {
          redirect(`/${locale}/onboarding`);
        }
      }
    } catch {
      // If we can't fetch, show dashboard anyway
    }
  }

  return <DashboardWelcome />;
}
