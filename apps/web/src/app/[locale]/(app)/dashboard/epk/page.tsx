import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { EPK_VISIBLE_LINKS_LIMITS, type PlanCode } from '@stagelink/types';
import { EpkEditorV2 } from '@/features/epk/components/EpkEditorV2';
import { getArtist } from '@/lib/api/artists';
import { getArtistAssets } from '@/lib/api/assets';
import { getBillingSummary } from '@/lib/api/billing';
import { getArtistEpk } from '@/lib/api/epk';
import { getAuthMe, getCurrentArtistId } from '@/lib/api/me';
import { getSmartLinksForArtist } from '@/lib/api/smart-links-server';
import { getSession } from '@/lib/auth';
import { ConnectionErrorState } from '@/components/shared/ConnectionErrorState';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Press Kit (EPK)',
  };
}

export default async function DashboardEpkPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const me = await getAuthMe(session.accessToken);
  if (me === null) {
    return <ConnectionErrorState href={`/${locale}/dashboard/epk`} />;
  }

  const artistId = getCurrentArtistId(me);
  if (!artistId) redirect(`/${locale}/onboarding`);

  const [artist, billingSummary] = await Promise.all([
    getArtist(artistId, session.accessToken),
    getBillingSummary(artistId, session.accessToken),
  ]);

  if (!artist) redirect(`/${locale}/onboarding`);

  const [epkData, smartLinks, assets] = await Promise.all([
    getArtistEpk(artistId, session.accessToken),
    getSmartLinksForArtist(artistId, session.accessToken).catch(() => []),
    getArtistAssets(artistId, session.accessToken).catch(() => []),
  ]);

  const maxVisibleLinks = EPK_VISIBLE_LINKS_LIMITS[billingSummary.effectivePlan] ?? 3;

  return (
    <EpkEditorV2
      artistId={artistId}
      username={artist.username}
      locale={locale}
      initialData={epkData}
      smartLinks={smartLinks}
      assets={assets}
      hasMultiLanguageAccess={billingSummary.entitlements.multi_language_pages}
      billingHref={`/${locale}/dashboard/billing`}
      maxVisibleLinks={maxVisibleLinks}
      userPlan={billingSummary.effectivePlan as PlanCode}
    />
  );
}
