import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ArtistProfileSettings } from '@/features/artist/components/ArtistProfileSettings';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard.profile');
  return { title: t('title') };
}

interface DashboardProfilePageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardProfilePage({ params }: DashboardProfilePageProps) {
  const { locale } = await params;
  // The (app) layout already guarantees auth, but getSession() returns
  // AuthSession | null. This redirect is needed for TypeScript to narrow the
  // type before accessing session.accessToken — it will never fire at runtime.
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const t = await getTranslations('dashboard.profile');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <ArtistProfileSettings accessToken={session.accessToken} />
    </div>
  );
}
