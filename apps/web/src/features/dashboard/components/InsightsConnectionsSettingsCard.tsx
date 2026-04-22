import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { FeatureLockCta } from '@/components/billing/FeatureLockCta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SpotifyInsightsCard } from '@/features/insights/components/SpotifyInsightsCard';
import { YouTubeInsightsCard } from '@/features/insights/components/YouTubeInsightsCard';
import type { Artist } from '@/lib/api/artists';
import type { StageLinkInsightsDashboard } from '@stagelink/types';

interface InsightsConnectionsSettingsCardProps {
  artistId: string;
  artist: Artist | null;
  currentPlanLabel: string;
  hasFeatureAccess: boolean;
  data: StageLinkInsightsDashboard | null;
  errorMessage?: string | null;
}

export async function InsightsConnectionsSettingsCard({
  artistId,
  artist,
  currentPlanLabel,
  hasFeatureAccess,
  data,
  errorMessage,
}: InsightsConnectionsSettingsCardProps) {
  const t = await getTranslations('dashboard.settings.insights');
  const locale = await getLocale();
  const analyticsHref = `/${locale}/dashboard/analytics#stage-link-insights`;
  const profileHref = `/${locale}/dashboard/profile`;

  const spotifySummary =
    data?.platforms.find((platform) => platform.platform === 'spotify') ?? null;
  const youtubeSummary =
    data?.platforms.find((platform) => platform.platform === 'youtube') ?? null;

  return (
    <Card id="insights-connections">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </div>
          <Badge variant={hasFeatureAccess ? 'secondary' : 'outline'}>
            {hasFeatureAccess ? t('status.enabled') : t('status.locked')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasFeatureAccess ? (
          <FeatureLockCta
            compact
            title={t('lock.description')}
            description={t('lock.copy', { currentPlan: currentPlanLabel })}
            currentPlanLabel={currentPlanLabel}
            requiredPlanLabel="Pro+"
            href={`/${locale}/dashboard/billing`}
            ctaLabel={t('lock.cta')}
          />
        ) : null}

        {hasFeatureAccess ? (
          <>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{t('helper.title')}</p>
              <p className="mt-1">{t('helper.description')}</p>
            </div>

            {errorMessage ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            {spotifySummary ? (
              <section className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold">{t('spotify.title')}</h3>
                    <p className="text-sm text-muted-foreground">{t('spotify.description')}</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={analyticsHref}>{t('actions.view_analytics')}</Link>
                  </Button>
                </div>
                <SpotifyInsightsCard
                  artistId={artistId}
                  artistSpotifyUrl={artist?.spotifyUrl ?? null}
                  summary={spotifySummary}
                  mode="settings"
                  analyticsHref={analyticsHref}
                />
              </section>
            ) : null}

            {youtubeSummary ? (
              <section className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold">{t('youtube.title')}</h3>
                    <p className="text-sm text-muted-foreground">{t('youtube.description')}</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={profileHref}>{t('actions.open_profile')}</Link>
                  </Button>
                </div>
                <YouTubeInsightsCard
                  artistId={artistId}
                  artistYouTubeUrl={artist?.youtubeUrl ?? null}
                  summary={youtubeSummary}
                  mode="settings"
                  analyticsHref={analyticsHref}
                />
              </section>
            ) : null}

            <section className="space-y-3">
              <div>
                <h3 className="text-base font-semibold">{t('soundcloud.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('soundcloud.description')}</p>
              </div>
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{t('soundcloud.badges.coming_soon')}</Badge>
                      <Badge variant="outline">{t('soundcloud.badges.public_profile')}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{t('soundcloud.copy')}</p>
                    {artist?.soundcloudUrl ? (
                      <p className="text-xs text-muted-foreground">
                        {t('soundcloud.profile_detected', { url: artist.soundcloudUrl })}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {t('soundcloud.profile_missing')}
                      </p>
                    )}
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={profileHref}>{t('actions.open_profile')}</Link>
                  </Button>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
