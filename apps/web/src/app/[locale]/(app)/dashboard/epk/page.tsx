import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FeatureLockCta } from '@/components/billing/FeatureLockCta';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EpkEditor } from '@/features/epk/components/EpkEditor';
import { getArtist } from '@/lib/api/artists';
import { getArtistAssets } from '@/lib/api/assets';
import { getBillingSummary } from '@/lib/api/billing';
import { getArtistEpk } from '@/lib/api/epk';
import { getAuthMe, getCurrentArtistId } from '@/lib/api/me';
import { getSmartLinks } from '@/lib/api/smart-links';
import { getSession } from '@/lib/auth';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'EPK Builder',
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
            <h1 className="text-2xl font-bold">EPK Builder</h1>
            <p className="text-sm text-muted-foreground">
              Build a shareable press kit with a public URL and a print-friendly export.
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
          title="Unlock the EPK builder"
          description="EPK pages, public sharing and print export are available starting in Pro."
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
    getSmartLinks(artistId, session.accessToken).catch(() => []),
    getArtistAssets(artistId, session.accessToken).catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">EPK Builder</h1>
          <p className="text-sm text-muted-foreground">
            Build a professional press kit from your StageLink profile, then share it publicly or
            export it from the print view.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {billingSummary.effectivePlan === 'pro_plus' ? 'Pro+' : 'Pro'}
          </Badge>
          <Link
            href={`/p/${artist.username}/epk`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Open public EPK
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How this EPK works</CardTitle>
          <CardDescription>
            Profile data is used as the default identity layer. Public contacts, bio overrides and
            featured content are controlled explicitly here.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
          <p>Draft and publication are independent from your main public page.</p>
          <p>Only published EPK fields appear on the public shareable route.</p>
          <p>The print view is designed so you can Save as PDF directly from the browser.</p>
        </CardContent>
      </Card>

      <EpkEditor
        artistId={artistId}
        username={artist.username}
        locale={locale}
        initialData={epkData}
        smartLinks={smartLinks}
        assets={assets}
      />
    </div>
  );
}
