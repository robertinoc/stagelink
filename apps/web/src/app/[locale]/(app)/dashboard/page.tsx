import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { DashboardWelcome } from '@/features/dashboard/components/DashboardWelcome';
import { getArtist } from '@/lib/api/artists';
import { getBillingSummary } from '@/lib/api/billing';
import { getAuthMe, getCurrentArtistId } from '@/lib/api/me';
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

  if (!session) {
    return null;
  }

  const me = await getAuthMe(session.accessToken);

  // me === null means the API is unreachable (deploy in progress, network error, etc.).
  // NEVER redirect to onboarding in this case — existing users would lose their artist.
  // Show a recoverable error page instead so the user can simply refresh.
  if (me === null) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-semibold">Having trouble connecting…</p>
        <p className="text-sm text-muted-foreground">
          The server is temporarily unavailable. Please refresh the page in a few seconds.
        </p>
        <a
          href={`/${locale}/dashboard`}
          className="mt-2 rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Refresh
        </a>
      </div>
    );
  }

  const artistId = getCurrentArtistId(me);

  if (!artistId) {
    redirect(`/${locale}/onboarding`);
  }

  const [artist, billingSummary] = await Promise.all([
    getArtist(artistId, session.accessToken).catch(() => null),
    getBillingSummary(artistId, session.accessToken).catch(() => null),
  ]);

  return <DashboardWelcome artist={artist} billingSummary={billingSummary} />;
}
