'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { STAGELINK_INSIGHTS_DATE_RANGES } from '@stagelink/types';
import {
  AlertCircle,
  BarChart3,
  Clock3,
  Globe2,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { FeatureLockCta } from '@/components/billing/FeatureLockCta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BillingEntitlementsResponse } from '@/lib/api/billing';
import type { StageLinkInsightsLockPayload } from '@/lib/api/insights';
import type { StageLinkInsightsDashboard as StageLinkInsightsDashboardData } from '@stagelink/types';
import { SpotifyInsightsCard } from './SpotifyInsightsCard';
import { YouTubeInsightsCard } from './YouTubeInsightsCard';

interface InsightsDashboardProps {
  artistId: string;
  artistSpotifyUrl: string | null;
  artistYouTubeUrl: string | null;
  artistSoundCloudUrl?: string | null;
  data: StageLinkInsightsDashboardData | null;
  entitlements: BillingEntitlementsResponse | null;
  lockedPayload?: StageLinkInsightsLockPayload | null;
  errorMessage?: string | null;
  mode?: 'standalone' | 'embedded';
  rangeParamName?: string;
  settingsHref?: string;
}

function resolvePlanLabel(plan: BillingEntitlementsResponse['effectivePlan'] | 'free') {
  switch (plan) {
    case 'pro':
      return 'Pro';
    case 'pro_plus':
      return 'Pro+';
    default:
      return 'Free';
  }
}

function resolveStatusTone(status: string) {
  switch (status) {
    case 'connected':
      return 'secondary' as const;
    case 'error':
    case 'needs_reauth':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
}

function formatDate(value: string | null, locale: string): string | null {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function LockedState({ payload }: { payload: StageLinkInsightsLockPayload }) {
  const t = useTranslations('dashboard.insights.locked');
  const locale = useLocale();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('description', {
            currentPlan: resolvePlanLabel(payload.effectivePlan),
            requiredPlan: resolvePlanLabel(payload.requiredPlan),
          })}
        </p>
      </CardHeader>
      <CardContent>
        <FeatureLockCta
          title={t('title')}
          description={t('description', {
            currentPlan: resolvePlanLabel(payload.effectivePlan),
            requiredPlan: resolvePlanLabel(payload.requiredPlan),
          })}
          currentPlanLabel={resolvePlanLabel(payload.effectivePlan)}
          requiredPlanLabel={resolvePlanLabel(payload.requiredPlan)}
          href={`/${locale}/dashboard/billing`}
          ctaLabel={t('cta')}
        />
      </CardContent>
    </Card>
  );
}

function ErrorState({ message }: { message?: string | null }) {
  const t = useTranslations('dashboard.insights.error');

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle>{t('title')}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </CardHeader>
      {message ? (
        <CardContent>
          <p className="text-sm text-destructive">{message}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

function SummaryCards({ data }: { data: StageLinkInsightsDashboardData }) {
  const t = useTranslations('dashboard.insights.summary');

  const iconMap = {
    connected_platforms: Globe2,
    synced_platforms: RefreshCw,
    stored_snapshots: BarChart3,
    supported_platforms: Sparkles,
  } as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {data.summaryCards.map((card) => {
        const Icon = iconMap[card.id];
        const connectedPlatformLabels =
          card.id === 'connected_platforms'
            ? data.platforms
                .filter((platform) => platform.connection?.status === 'connected')
                .map((platform) => t(`platform_labels.${platform.platform}`))
                .join(', ')
            : null;
        return (
          <Card key={card.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t(card.id)}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{card.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{t(`help.${card.id}`)}</p>
              {connectedPlatformLabels ? (
                <p className="mt-2 text-xs text-foreground/80">{connectedPlatformLabels}</p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function EmptyState({
  mode,
  settingsHref,
}: {
  mode: 'standalone' | 'embedded';
  settingsHref: string;
}) {
  const t = useTranslations('dashboard.insights.empty');

  return (
    <Card className="border-dashed">
      <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-3 py-10 text-center">
        <TrendingUp className="h-10 w-10 text-muted-foreground/40" />
        <h3 className="text-base font-semibold">{t('title')}</h3>
        <p className="max-w-lg text-sm text-muted-foreground">{t('description')}</p>
        <Button asChild variant="outline" size="sm">
          <Link href={mode === 'embedded' ? settingsHref : '#platform-insights'}>
            {mode === 'embedded' ? t('cta_settings') : t('cta')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function RangeFilters({
  selectedRange,
  rangeParamName,
}: {
  selectedRange: StageLinkInsightsDashboardData['selectedRange'];
  rangeParamName: string;
}) {
  const t = useTranslations('dashboard.insights.range');
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildHref(range: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(rangeParamName, range);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{t('label')}</p>
          <p className="text-xs text-muted-foreground">
            {t('description', { range: t(`options.${selectedRange}`) })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STAGELINK_INSIGHTS_DATE_RANGES.map((range) => (
            <Button
              key={range}
              asChild
              size="sm"
              variant={selectedRange === range ? 'default' : 'outline'}
            >
              <Link href={buildHref(range)} scroll={false}>
                {t(`options.${range}`)}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function InsightsDashboard({
  artistId,
  artistSpotifyUrl,
  artistYouTubeUrl,
  artistSoundCloudUrl = null,
  data,
  entitlements,
  lockedPayload,
  errorMessage,
  mode = 'standalone',
  rangeParamName = 'range',
  settingsHref,
}: InsightsDashboardProps) {
  const t = useTranslations('dashboard.insights');
  const locale = useLocale();
  const resolvedSettingsHref = settingsHref ?? `/${locale}/dashboard/settings#insights-connections`;
  const embedded = mode === 'embedded';

  if (lockedPayload) {
    return <LockedState payload={lockedPayload} />;
  }

  if (errorMessage) {
    return <ErrorState message={errorMessage} />;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {!embedded ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Pro+</Badge>
              <Badge variant="secondary">{t('beta_badge')}</Badge>
            </div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">{t('description')}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              <span>{t('last_updated_label')}</span>
            </div>
            <p className="mt-1 font-medium text-foreground">
              {formatDate(data.lastUpdatedAt, locale) ?? t('never_synced')}
            </p>
          </div>
        </div>
      ) : null}

      <SummaryCards data={data} />

      <RangeFilters selectedRange={data.selectedRange} rangeParamName={rangeParamName} />

      {!data.hasAnyConnectedPlatforms ? (
        <EmptyState mode={mode} settingsHref={resolvedSettingsHref} />
      ) : null}

      <div id="platform-insights" className="grid gap-4 xl:grid-cols-3">
        {data.platforms.map((platform) => {
          if (platform.platform === 'spotify') {
            return (
              <Card key={platform.platform} id="spotify-insights" className="xl:col-span-3">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{t(`platforms.${platform.platform}.title`)}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t(`platforms.${platform.platform}.description`)}
                      </p>
                    </div>
                    <Badge
                      variant={resolveStatusTone(platform.connection?.status ?? 'disconnected')}
                    >
                      {t(`status.${platform.connection?.status ?? 'disconnected'}`)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {t(`connection_methods.${platform.capabilities.connectionMethod}`)}
                    </Badge>
                    <Badge variant="outline">
                      {t(`support.${platform.capabilities.profileBasics}`)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SpotifyInsightsCard
                    artistId={artistId}
                    artistSpotifyUrl={artistSpotifyUrl}
                    summary={platform}
                    mode="analytics"
                    settingsHref={resolvedSettingsHref}
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    {t(`platforms.${platform.platform}.limitations`)}
                  </p>
                </CardContent>
              </Card>
            );
          }

          if (platform.platform === 'youtube') {
            return (
              <Card key={platform.platform} id="youtube-insights" className="xl:col-span-3">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{t(`platforms.${platform.platform}.title`)}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t(`platforms.${platform.platform}.description`)}
                      </p>
                    </div>
                    <Badge
                      variant={resolveStatusTone(platform.connection?.status ?? 'disconnected')}
                    >
                      {t(`status.${platform.connection?.status ?? 'disconnected'}`)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {t(`connection_methods.${platform.capabilities.connectionMethod}`)}
                    </Badge>
                    <Badge variant="outline">
                      {t(`support.${platform.capabilities.audienceMetrics}`)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <YouTubeInsightsCard
                    artistId={artistId}
                    artistYouTubeUrl={artistYouTubeUrl}
                    summary={platform}
                    mode="analytics"
                    settingsHref={resolvedSettingsHref}
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    {t(`platforms.${platform.platform}.limitations`)}
                  </p>
                </CardContent>
              </Card>
            );
          }

          if (platform.platform === 'soundcloud') {
            return (
              <Card key={platform.platform} id="soundcloud-insights" className="xl:col-span-3">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{t('platforms.soundcloud.title')}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t('platforms.soundcloud.description')}
                      </p>
                    </div>
                    <Badge variant="outline">{t('soundcloud.coming_soon_badge')}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {t('platforms.soundcloud.title')} · v2
                    </p>
                    <p className="mt-1">{t('platforms.soundcloud.coming_soon')}</p>
                  </div>
                </CardContent>
              </Card>
            );
          }

          // Generic fallback for any future platforms not yet fully wired up
          const effectiveStatus = platform.connection?.status ?? 'disconnected';
          const formattedLastSynced = formatDate(platform.connection?.lastSyncedAt ?? null, locale);

          return (
            <Card key={platform.platform} className="h-full">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{t(`platforms.${platform.platform}.title`)}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t(`platforms.${platform.platform}.description`)}
                    </p>
                  </div>
                  <Badge variant={resolveStatusTone(effectiveStatus)}>
                    {t(`status.${effectiveStatus}`)}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {t(`connection_methods.${platform.capabilities.connectionMethod}`)}
                  </Badge>
                  {platform.capabilities.requiresArtistOwnedAccount ? (
                    <Badge variant="outline">{t('requires_owner_account')}</Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                  <p className="font-medium text-foreground">
                    {t('platform_card.connection_title')}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {platform.connection?.displayName ??
                      t(
                        platform.capabilities.connectionFlowReady
                          ? 'platform_card.ready_for_connection'
                          : 'platform_card.connection_flow_coming_soon',
                      )}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t('platform_card.last_synced', {
                      value: formattedLastSynced ?? t('never_synced'),
                    })}
                  </p>
                </div>

                {platform.latestSnapshot ? (
                  <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
                    <p className="text-sm font-medium text-foreground">
                      {t('platform_card.latest_snapshot')}
                    </p>
                    <div className="mt-3 grid gap-2">
                      {Object.entries(platform.latestSnapshot.metrics)
                        .slice(0, 3)
                        .map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between gap-3 text-sm"
                          >
                            <span className="text-muted-foreground">{key}</span>
                            <span className="font-medium text-foreground">{String(value)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                    {t('platform_card.no_snapshot')}
                  </div>
                )}

                <p className="text-xs leading-5 text-muted-foreground">
                  {t(`platforms.${platform.platform}.limitations`)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {data && data.platforms.some((p) => p.connection?.status === 'connected') ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm font-medium">{t('sync_overview.title')}</CardTitle>
              {data.lastUpdatedAt ? (
                <p className="text-xs text-muted-foreground">
                  {t('last_updated_label')}:{' '}
                  {formatDate(data.lastUpdatedAt, locale) ?? data.lastUpdatedAt}
                </p>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.platforms
                .filter((p) => p.connection?.status === 'connected')
                .map((p) => {
                  const syncStatus = p.connection?.lastSyncStatus ?? 'never';
                  const dotColor =
                    syncStatus === 'success'
                      ? 'bg-emerald-400'
                      : syncStatus === 'partial'
                        ? 'bg-amber-400'
                        : syncStatus === 'error'
                          ? 'bg-destructive'
                          : 'bg-muted-foreground';
                  return (
                    <div
                      key={p.platform}
                      className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium capitalize">{p.platform}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {p.connection?.lastSyncedAt
                            ? (formatDate(p.connection.lastSyncedAt, locale) ??
                              p.connection.lastSyncedAt)
                            : t('never_synced')}
                        </p>
                        {syncStatus === 'partial' ? (
                          <p className="mt-0.5 text-xs text-amber-400/70">
                            {t('sync_status.partial_hint')}
                          </p>
                        ) : null}
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-xs ${syncStatus === 'partial' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : ''}`}
                      >
                        {t(`sync_status.${syncStatus}`)}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
