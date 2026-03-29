import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAuthMe } from '@/lib/api/me';
import { getArtistPages } from '@/lib/api/pages';
import { BlockManager } from '@/features/blocks/components/BlockManager';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('blocks');
  return { title: t('title') };
}

interface Props {
  params: Promise<{ locale: string }>;
}

/**
 * Dashboard > My Page
 *
 * Server component: resolves session, artist, and default page.
 * Passes pageId + accessToken to the BlockManager client component.
 *
 * Multi-page note:
 *   Each artist currently has exactly one page (1:1 relation in DB).
 *   When multiple pages are supported, this page will need a page selector.
 *   The BlockManager contract (pageId prop) will not change.
 */
export default async function DashboardPageBuilderPage({ params }: Props) {
  const { locale } = await params;

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const me = await getAuthMe(session.accessToken);
  const artistId = me?.artistIds[0];
  if (!artistId) redirect(`/${locale}/onboarding`);

  const pages = await getArtistPages(artistId, session.accessToken);
  const page = pages[0];
  if (!page) redirect(`/${locale}/onboarding`);

  const t = await getTranslations('blocks');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <BlockManager pageId={page.id} artistId={artistId} accessToken={session.accessToken} />
    </div>
  );
}
