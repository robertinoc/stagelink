import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { FeatureLockCta } from '@/components/billing/FeatureLockCta';
import { Badge } from '@/components/ui/badge';
import { EpkEditorV2 } from '@/features/epk/components/EpkEditorV2';
import { getArtist } from '@/lib/api/artists';
import { getArtistAssets } from '@/lib/api/assets';
import { getBillingSummary } from '@/lib/api/billing';
import { getArtistEpk } from '@/lib/api/epk';
import { getAuthMe, getCurrentArtistId } from '@/lib/api/me';
import { getSmartLinksForArtist } from '@/lib/api/smart-links-server';
import { getSession } from '@/lib/auth';

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
  const artistId = getCurrentArtistId(me);
  if (!artistId) redirect(`/${locale}/onboarding`);

  const [artist, billingSummary] = await Promise.all([
    getArtist(artistId, session.accessToken),
    getBillingSummary(artistId, session.accessToken),
  ]);

  if (!artist) redirect(`/${locale}/onboarding`);

  if (!billingSummary.entitlements.epk_builder) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Press Kit (EPK)</h1>
            <p className="text-sm text-muted-foreground">
              Build a shareable Press Kit (EPK) with a public URL and a print-friendly export.
            </p>
          </div>
          <Badge variant="outline">
            Current plan:{' '}
            {billingSummary.effectivePlan === 'pro_plus'
              ? 'Pro+'
              : billingSummary.effectivePlan === 'pro'
                ? 'Pro'
                : 'Free'}
          </Badge>
        </div>

        <FeatureLockCta
          title="Unlock the Press Kit (EPK) builder"
          description="Press Kit (EPK) pages, public sharing, and print export are available starting in Pro."
          currentPlanLabel={
            billingSummary.effectivePlan === 'pro_plus'
              ? 'Pro+'
              : billingSummary.effectivePlan === 'pro'
                ? 'Pro'
                : 'Free'
          }
          requiredPlanLabel="Pro"
          href={`/${locale}/dashboard/billing`}
          ctaLabel="Upgrade plan"
        />
      </div>
    );
  }

  const [epkData, smartLinks, assets] = await Promise.all([
    getArtistEpk(artistId, session.accessToken),
    getSmartLinksForArtist(artistId, session.accessToken).catch(() => []),
    getArtistAssets(artistId, session.accessToken).catch(() => []),
  ]);

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
    />
  );
}
