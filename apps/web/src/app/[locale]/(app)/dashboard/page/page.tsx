import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getArtist } from '@/lib/api/artists';
import { getBillingSummary } from '@/lib/api/billing';
import { getArtistEpk } from '@/lib/api/epk';
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
  const billingSummary = await getBillingSummary(artistId, session.accessToken);
  const epkData = await getArtistEpk(artistId, session.accessToken).catch(() => null);
  const page = pages[0];
  if (!page) redirect(`/${locale}/onboarding`);

  const t = await getTranslations('blocks');
  const navT = await getTranslations('nav');
  const textSourceLabels =
    locale === 'es'
      ? {
          profileBio: 'Bio del perfil',
          epkShortBio: 'Bio corta del Press Kit',
          epkFullBio: 'Bio completa del Press Kit',
          availability: 'Disponibilidad y logística',
          artistRequirements: 'Requerimientos del artista',
          technicalRider: 'Technical rider',
          pressQuote: 'Cita de prensa',
        }
      : {
          profileBio: 'Profile bio',
          epkShortBio: 'Press Kit short bio',
          epkFullBio: 'Press Kit full bio',
          availability: 'Availability and logistics',
          artistRequirements: 'Artist requirements',
          technicalRider: 'Technical rider',
          pressQuote: 'Press quote',
        };

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

      <BlockManager
        pageId={page.id}
        artistId={artistId}
        accessToken={session.accessToken}
        canUseShopifyIntegration={billingSummary.entitlements.shopify_integration}
        canUseSmartMerch={billingSummary.entitlements.smart_merch}
        textSources={[
          artist?.bio
            ? {
                id: 'profile-bio',
                label: textSourceLabels.profileBio,
                body: artist.bio,
              }
            : null,
          epkData?.epk.shortBio
            ? {
                id: 'epk-short-bio',
                label: textSourceLabels.epkShortBio,
                body: epkData.epk.shortBio,
              }
            : null,
          epkData?.epk.fullBio
            ? {
                id: 'epk-full-bio',
                label: textSourceLabels.epkFullBio,
                body: epkData.epk.fullBio,
              }
            : null,
          epkData?.epk.availabilityNotes
            ? {
                id: 'epk-availability',
                label: textSourceLabels.availability,
                body: epkData.epk.availabilityNotes,
              }
            : null,
          epkData?.epk.riderInfo
            ? {
                id: 'epk-artist-requirements',
                label: textSourceLabels.artistRequirements,
                body: epkData.epk.riderInfo,
              }
            : null,
          epkData?.epk.techRequirements
            ? {
                id: 'epk-technical-rider',
                label: textSourceLabels.technicalRider,
                body: epkData.epk.techRequirements,
              }
            : null,
          epkData?.epk.pressQuote
            ? {
                id: 'epk-press-quote',
                label: textSourceLabels.pressQuote,
                body: epkData.epk.pressQuote,
              }
            : null,
        ].filter((item): item is { id: string; label: string; body: string } => Boolean(item))}
      />
    </div>
  );
}
