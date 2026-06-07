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
import { getShopifyConnection } from '@/lib/api/shopify';
import { getMerchConnection } from '@/lib/api/merch';
import { ConnectionErrorState } from '@/components/shared/ConnectionErrorState';
import { BlockManager } from '@/features/blocks/components/BlockManager';
import { ThemeSelector } from '@/features/blocks/components/ThemeSelector';
import { PhonePreviewFrame } from '@/features/blocks/components/PhonePreviewFrame';

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
 * Passes pageId to the BlockManager client component.
 * Authenticated block/smart-link mutations are proxied through web route handlers
 * so WorkOS access tokens stay server-side.
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
  if (me === null) {
    return <ConnectionErrorState href={`/${locale}/dashboard/page`} />;
  }

  const artistId = me?.artistIds[0];
  if (!artistId) redirect(`/${locale}/onboarding`);

  const [artist, pages, billingSummary, epkData, shopifyConn, merchConn] = await Promise.all([
    getArtist(artistId, session.accessToken),
    getArtistPages(artistId, session.accessToken),
    getBillingSummary(artistId, session.accessToken),
    getArtistEpk(artistId, session.accessToken).catch(() => null),
    getShopifyConnection(artistId, session.accessToken).catch(() => null),
    getMerchConnection(artistId, session.accessToken).catch(() => null),
  ]);
  const page = pages[0];
  if (!page) redirect(`/${locale}/onboarding`);

  const t = await getTranslations('blocks');
  const navT = await getTranslations('nav');
  const textSourceLabels =
    locale === 'es'
      ? {
          profileBio: 'Bio corta del perfil',
          profileFullBio: 'Bio completa del perfil',
          epkShortBio: 'Bio corta del Press Kit',
          epkFullBio: 'Bio completa del Press Kit',
          availability: 'Disponibilidad y logística',
          artistRequirements: 'Requerimientos del artista',
          technicalRider: 'Technical rider',
          pressQuote: 'Cita de prensa',
        }
      : {
          profileBio: 'Short bio (profile)',
          profileFullBio: 'Full bio (profile)',
          epkShortBio: 'Press Kit short bio',
          epkFullBio: 'Press Kit full bio',
          availability: 'Availability and logistics',
          artistRequirements: 'Artist requirements',
          technicalRider: 'Technical rider',
          pressQuote: 'Press quote',
        };

  const textSourceList = [
    artist?.bio
      ? { id: 'profile-bio', label: textSourceLabels.profileBio, body: artist.bio }
      : null,
    artist?.fullBio
      ? { id: 'profile-full-bio', label: textSourceLabels.profileFullBio, body: artist.fullBio }
      : null,
    epkData?.epk.shortBio
      ? { id: 'epk-short-bio', label: textSourceLabels.epkShortBio, body: epkData.epk.shortBio }
      : null,
    epkData?.epk.fullBio
      ? { id: 'epk-full-bio', label: textSourceLabels.epkFullBio, body: epkData.epk.fullBio }
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
      ? { id: 'epk-press-quote', label: textSourceLabels.pressQuote, body: epkData.epk.pressQuote }
      : null,
  ].filter((item): item is { id: string; label: string; body: string } => Boolean(item));

  return (
    <div className="space-y-5 pb-10">
      {/* ── SL-style page header ───────────────────────────────────────── */}
      <div className="sl-header flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-2 font-[family-name:var(--font-heading)] text-[11px] font-semibold uppercase tracking-[3px] text-[#E040FB]">
            My Page · {locale === 'es' ? 'tu link público' : 'your public link'}
          </p>
          <h1 className="m-0 font-[family-name:var(--font-heading)] text-[clamp(24px,4cqw,36px)] font-bold leading-[1.1] tracking-[-0.025em] text-white">
            {t('title')}{' '}
            <span className="text-sl-grad">
              {locale === 'es' ? 'se ve así.' : 'looks like this.'}
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-white/60">{t('description')}</p>
        </div>

        {artist?.username && (
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/${locale}/${artist.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              {navT('view_page')}
            </Link>
          </div>
        )}
      </div>

      {/* ── Two-column editor layout ────────────────────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-[1fr_320px] xl:items-start">
        {/* Left: Block manager */}
        <BlockManager
          pageId={page.id}
          artistId={artistId}
          canUseShopifyIntegration={billingSummary.entitlements.shopify_integration}
          canUseSmartMerch={billingSummary.entitlements.smart_merch}
          shopifyIsConnected={shopifyConn?.isConnected ?? false}
          smartMerchIsConnected={merchConn?.isConnected ?? false}
          userPlan={billingSummary.effectivePlan}
          galleryImages={artist?.galleryImageUrls ?? []}
          username={artist?.username ?? undefined}
          textSources={textSourceList}
        />

        {/* Right: Phone frame preview (sticky on xl+) */}
        {artist?.username && (
          <div className="hidden xl:block xl:sticky xl:top-6">
            <PhonePreviewFrame username={artist.username} locale={locale} />
          </div>
        )}
      </div>

      {/* ── Theme selector ──────────────────────────────────────────────── */}
      <ThemeSelector pageId={page.id} currentTheme={page.theme ?? undefined} />
    </div>
  );
}
