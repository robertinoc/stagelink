import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getArtist } from '@/lib/api/artists';
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

  const artist = await getArtist(artistId, session.accessToken);
  const pages = await getArtistPages(artistId, session.accessToken);
  const page = pages[0];
  if (!page) redirect(`/${locale}/onboarding`);

  const t = await getTranslations('blocks');
  const navT = await getTranslations('nav');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>

        {artist?.username && (
          <Link
            href={`/p/${artist.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {navT('view_page')}
          </Link>
        )}
      </div>

      <BlockManager pageId={page.id} artistId={artistId} accessToken={session.accessToken} />
    </div>
  );
}
