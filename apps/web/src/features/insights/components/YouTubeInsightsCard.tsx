'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle, ExternalLink, RefreshCw, Settings2, Video } from 'lucide-react';
import type {
  StageLinkInsightsPlatformSummary,
  YouTubeInsightsConnectionValidationResult,
} from '@stagelink/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InsightsDetailDialog } from '@/features/insights/components/InsightsDetailDialog';
import { MetricSparkline } from '@/features/insights/components/MetricSparkline';
import {
  saveYouTubeInsightsConnection,
  syncYouTubeInsightsConnection,
  validateYouTubeInsightsConnection,
} from '@/lib/api/insights';

interface YouTubeInsightsCardProps {
  artistId: string;
  artistYouTubeUrl: string | null;
  summary: StageLinkInsightsPlatformSummary;
  mode?: 'settings' | 'analytics';
  analyticsHref?: string;
  settingsHref?: string;
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

function formatNumber(value: unknown, locale: string): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return new Intl.NumberFormat(locale).format(value);
}

function formatDelta(current: unknown, previous: unknown, locale: string): string | null {
  if (
    typeof current !== 'number' ||
    !Number.isFinite(current) ||
    typeof previous !== 'number' ||
    !Number.isFinite(previous)
  ) {
    return null;
  }

  const delta = current - previous;
  const sign = delta > 0 ? '+' : '';
  return `${sign}${new Intl.NumberFormat(locale).format(delta)}`;
}

export function YouTubeInsightsCard({
  artistId,
  artistYouTubeUrl,
  summary,
  mode = 'analytics',
  analyticsHref,
  settingsHref,
}: YouTubeInsightsCardProps) {
  const t = useTranslations('dashboard.insights.youtube');
  const commonT = useTranslations('dashboard.insights');
  const locale = useLocale();
  const router = useRouter();

  const profileLinkedChannelInput = artistYouTubeUrl?.trim() ?? '';
  const hasProfileLinkedChannel = profileLinkedChannelInput.length > 0;
  const resolvedChannelInput =
    profileLinkedChannelInput ||
    summary.connection?.externalUrl ||
    (summary.connection?.externalHandle
      ? `@${summary.connection.externalHandle}`
      : (summary.connection?.externalAccountId ?? ''));
  const resolvedAnalyticsHref =
    analyticsHref ?? `/${locale}/dashboard/analytics#stage-link-insights`;
  const resolvedSettingsHref = settingsHref ?? `/${locale}/dashboard/settings#insights-connections`;
  const isSettingsMode = mode === 'settings';

  const [channelInput, setChannelInput] = useState(resolvedChannelInput);
  const [validation, setValidation] = useState<YouTubeInsightsConnectionValidationResult | null>(
    null,
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'success' | 'error' | 'default'>('default');
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setChannelInput(resolvedChannelInput);
  }, [resolvedChannelInput]);

  const latestSnapshot = summary.latestSnapshot;
  const history = summary.history;
  const firstHistoryPoint = history[0] ?? null;
  const latestHistoryPoint = history[history.length - 1] ?? null;
  const persistedSyncError =
    !statusMessage && summary.connection?.lastSyncStatus === 'error'
      ? summary.connection.lastSyncError
      : null;
  const subscriberCount = formatNumber(latestSnapshot?.metrics['subscriber_count'], locale);
  const totalViews = formatNumber(latestSnapshot?.metrics['total_views'], locale);
  const videoCount = formatNumber(latestSnapshot?.metrics['video_count'], locale);
  const recentVideosCount = formatNumber(latestSnapshot?.metrics['recent_videos_count'], locale);
  const subscribersHidden = latestSnapshot?.metrics['subscribers_hidden'] === true;
  const subscribersDelta = formatDelta(
    latestHistoryPoint?.metrics['subscriber_count'],
    firstHistoryPoint?.metrics['subscriber_count'],
    locale,
  );
  const totalViewsDelta = formatDelta(
    latestHistoryPoint?.metrics['total_views'],
    firstHistoryPoint?.metrics['total_views'],
    locale,
  );

  const formattedLastSynced = useMemo(
    () => formatDate(summary.connection?.lastSyncedAt ?? null, locale),
    [locale, summary.connection?.lastSyncedAt],
  );

  async function handleValidate() {
    setValidating(true);
    setStatusMessage(null);

    try {
      const result = await validateYouTubeInsightsConnection(artistId, { channelInput });
      setValidation(result);
      setStatusTone('success');
      setStatusMessage(result.message);
    } catch (error) {
      setValidation(null);
      setStatusTone('error');
      setStatusMessage(error instanceof Error ? error.message : t('messages.validate_error'));
    } finally {
      setValidating(false);
    }
  }

  async function handleConnect() {
    setSaving(true);
    setStatusMessage(null);

    try {
      await saveYouTubeInsightsConnection(artistId, { channelInput });
      setStatusTone('success');
      setStatusMessage(t('messages.connected'));
      router.refresh();
    } catch (error) {
      setStatusTone('error');
      setStatusMessage(error instanceof Error ? error.message : t('messages.connect_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setStatusMessage(null);

    try {
      const result = await syncYouTubeInsightsConnection(artistId);
      setStatusTone('success');
      setStatusMessage(result.message);
      router.refresh();
    } catch (error) {
      setStatusTone('error');
      setStatusMessage(error instanceof Error ? error.message : t('messages.sync_error'));
    } finally {
      setSyncing(false);
    }
  }

  if (!summary.capabilities.connectionFlowReady && !summary.connection) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
        {t('setup_required')}
      </div>
    );
  }

  if (isSettingsMode) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">{t('fields.channel_input')}</label>
              <Input
                value={channelInput}
                onChange={(event) => setChannelInput(event.target.value)}
                readOnly={hasProfileLinkedChannel}
                placeholder={t('fields.channel_input_placeholder')}
              />
              <p className="text-xs text-muted-foreground">
                {hasProfileLinkedChannel
                  ? t('fields.channel_input_hint_locked')
                  : t('fields.channel_input_hint_profile_required')}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleValidate}
                disabled={
                  !hasProfileLinkedChannel || validating || channelInput.trim().length === 0
                }
              >
                {validating ? t('actions.validating') : t('actions.validate')}
              </Button>
              <Button
                type="button"
                onClick={handleConnect}
                disabled={!hasProfileLinkedChannel || saving || channelInput.trim().length === 0}
              >
                {saving
                  ? t('actions.connecting')
                  : summary.connection
                    ? t('actions.update')
                    : t('actions.connect')}
              </Button>
            </div>
          </div>
        </div>

        {!hasProfileLinkedChannel ? (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-50 lg:flex-row lg:items-center lg:justify-between">
            <p>{t('messages.profile_required')}</p>
            <Button asChild variant="outline" size="sm">
              <Link href={`/${locale}/dashboard/profile`}>{t('actions.open_profile')}</Link>
            </Button>
          </div>
        ) : null}

        {validation ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="flex items-start gap-4">
              {validation.imageUrl ? (
                <img
                  src={validation.imageUrl}
                  alt={validation.displayName}
                  className="h-14 w-14 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                  <Video className="h-5 w-5 text-emerald-100" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-emerald-50">{validation.displayName}</p>
                  <Badge variant="outline">YouTube</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-emerald-100/80">
                  {typeof validation.subscriberCount === 'number' ? (
                    <span>
                      {t('metrics.subscriber_count')}:{' '}
                      {formatNumber(validation.subscriberCount, locale)}
                    </span>
                  ) : (
                    <span>{t('messages.subscribers_hidden')}</span>
                  )}
                  {typeof validation.totalViews === 'number' ? (
                    <span>
                      {t('metrics.total_views')}: {formatNumber(validation.totalViews, locale)}
                    </span>
                  ) : null}
                  {typeof validation.videoCount === 'number' ? (
                    <span>
                      {t('metrics.video_count')}: {formatNumber(validation.videoCount, locale)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {statusMessage ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              statusTone === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
                : statusTone === 'error'
                  ? 'border-destructive/30 bg-destructive/10 text-destructive'
                  : 'border-white/10 bg-white/5 text-zinc-200'
            }`}
          >
            {statusMessage}
          </div>
        ) : null}

        {summary.connection ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {summary.connection.displayName ?? t('connected.unknown_channel')}
                  </p>
                  <Badge variant="secondary">
                    {commonT(`status.${summary.connection.status}`)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('connected.last_sync', {
                    value: formattedLastSynced ?? commonT('never_synced'),
                  })}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {commonT(`sync_status.${summary.connection.lastSyncStatus}`)}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {summary.connection.externalUrl ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={summary.connection.externalUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {t('actions.open_youtube')}
                    </Link>
                  </Button>
                ) : null}
                <Button asChild variant="outline" size="sm">
                  <Link href={resolvedAnalyticsHref}>{t('actions.view_analytics')}</Link>
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <InsightsDetailDialog title={t('scope.title')} triggerLabel={t('actions.view_scope')}>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t('scope.description')}</p>

              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
                <p className="text-sm font-medium text-foreground">{t('scope.includes_title')}</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>{t('scope.includes.channel')}</li>
                  <li>{t('scope.includes.subscribers')}</li>
                  <li>{t('scope.includes.views')}</li>
                  <li>{t('scope.includes.recent_videos')}</li>
                </ul>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-sm font-medium text-foreground">
                  {t('scope.not_included_title')}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>{t('scope.not_included.watch_time')}</li>
                  <li>{t('scope.not_included.geography')}</li>
                  <li>{t('scope.not_included.revenue')}</li>
                  <li>{t('scope.not_included.youtube_analytics')}</li>
                </ul>
              </div>
            </div>
          </InsightsDetailDialog>

          <InsightsDetailDialog title={t('history.title')} triggerLabel={t('actions.view_history')}>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t('history.description')}</p>
              {history.length <= 1 ? (
                <p className="text-sm text-muted-foreground">{t('history.empty')}</p>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                      <p className="text-xs text-muted-foreground">
                        {t('history.subscribers_change')}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {subscribersDelta ?? '—'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                      <p className="text-xs text-muted-foreground">{t('history.views_change')}</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {totalViewsDelta ?? '—'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {history
                      .slice(-6)
                      .reverse()
                      .map((point) => (
                        <div
                          key={point.capturedAt}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm"
                        >
                          <span className="text-muted-foreground">
                            {formatDate(point.capturedAt, locale) ?? point.capturedAt}
                          </span>
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="text-muted-foreground">
                              {t('metrics.subscriber_count')}:{' '}
                              {formatNumber(point.metrics['subscriber_count'], locale) ?? '—'}
                            </span>
                            <span className="text-muted-foreground">
                              {t('metrics.total_views')}:{' '}
                              {formatNumber(point.metrics['total_views'], locale) ?? '—'}
                            </span>
                            <span className="text-muted-foreground">
                              {t('metrics.video_count')}:{' '}
                              {formatNumber(point.metrics['video_count'], locale) ?? '—'}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          </InsightsDetailDialog>

          <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{t('settings.helper_title')}</p>
            <p className="mt-1">{t('settings.helper_description')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!summary.connection) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {t('analytics.no_connection_title')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('analytics.no_connection_description')}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={resolvedSettingsHref}>
              <Settings2 className="mr-2 h-4 w-4" />
              {t('actions.open_settings')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {statusMessage ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            statusTone === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
              : statusTone === 'error'
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : 'border-white/10 bg-white/5 text-zinc-200'
          }`}
        >
          {statusMessage}
        </div>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                {summary.connection.displayName ?? t('connected.unknown_channel')}
              </p>
              <Badge variant="secondary">{commonT(`status.${summary.connection.status}`)}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('connected.last_sync', {
                value: formattedLastSynced ?? commonT('never_synced'),
              })}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={
                  summary.connection.lastSyncStatus === 'partial'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                    : ''
                }
              >
                {commonT(`sync_status.${summary.connection.lastSyncStatus}`)}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.connection.externalUrl ? (
              <Button asChild variant="outline" size="sm">
                <Link href={summary.connection.externalUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t('actions.open_youtube')}
                </Link>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={!hasProfileLinkedChannel || syncing}
            >
              {syncing ? t('actions.syncing') : t('actions.sync')}
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={resolvedSettingsHref}>
                <Settings2 className="mr-2 h-4 w-4" />
                {t('actions.manage_connection')}
              </Link>
            </Button>
          </div>
        </div>

        {persistedSyncError ? (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{persistedSyncError}</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <InsightsDetailDialog title={t('history.title')} triggerLabel={t('actions.view_history')}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('history.description')}</p>
            {history.length <= 1 ? (
              <p className="text-sm text-muted-foreground">{t('history.empty')}</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                    <p className="text-xs text-muted-foreground">
                      {t('history.subscribers_change')}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {subscribersDelta ?? '—'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                    <p className="text-xs text-muted-foreground">{t('history.views_change')}</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {totalViewsDelta ?? '—'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {history
                    .slice(-6)
                    .reverse()
                    .map((point) => (
                      <div
                        key={point.capturedAt}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm"
                      >
                        <span className="text-muted-foreground">
                          {formatDate(point.capturedAt, locale) ?? point.capturedAt}
                        </span>
                        <div className="flex flex-wrap items-center gap-4">
                          <span className="text-muted-foreground">
                            {t('metrics.subscriber_count')}:{' '}
                            {formatNumber(point.metrics['subscriber_count'], locale) ?? '—'}
                          </span>
                          <span className="text-muted-foreground">
                            {t('metrics.total_views')}:{' '}
                            {formatNumber(point.metrics['total_views'], locale) ?? '—'}
                          </span>
                          <span className="text-muted-foreground">
                            {t('metrics.video_count')}:{' '}
                            {formatNumber(point.metrics['video_count'], locale) ?? '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        </InsightsDetailDialog>

        <InsightsDetailDialog title={t('scope.title')} triggerLabel={t('actions.view_scope')}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('scope.description')}</p>

            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
              <p className="text-sm font-medium text-foreground">{t('scope.includes_title')}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>{t('scope.includes.channel')}</li>
                <li>{t('scope.includes.subscribers')}</li>
                <li>{t('scope.includes.views')}</li>
                <li>{t('scope.includes.recent_videos')}</li>
              </ul>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/10 p-4">
              <p className="text-sm font-medium text-foreground">{t('scope.not_included_title')}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>{t('scope.not_included.watch_time')}</li>
                <li>{t('scope.not_included.geography')}</li>
                <li>{t('scope.not_included.revenue')}</li>
                <li>{t('scope.not_included.youtube_analytics')}</li>
              </ul>
            </div>
          </div>
        </InsightsDetailDialog>
      </div>

      {latestSnapshot ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="grid gap-3 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('metrics.subscriber_count')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{subscriberCount ?? '—'}</p>
                  {subscribersDelta ? (
                    <p
                      className={`mt-1 text-xs font-medium ${subscribersDelta.startsWith('+') ? 'text-emerald-400' : 'text-destructive'}`}
                    >
                      {subscribersDelta}
                    </p>
                  ) : null}
                  <MetricSparkline
                    history={history}
                    metricKey="subscriber_count"
                    strokeColor="#4ade80"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('metrics.total_views')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{totalViews ?? '—'}</p>
                  {totalViewsDelta ? (
                    <p
                      className={`mt-1 text-xs font-medium ${totalViewsDelta.startsWith('+') ? 'text-emerald-400' : 'text-destructive'}`}
                    >
                      {totalViewsDelta}
                    </p>
                  ) : null}
                  <MetricSparkline
                    history={history}
                    metricKey="total_views"
                    strokeColor="#60a5fa"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('metrics.video_count')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{videoCount ?? '—'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('metrics.recent_videos_count')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{recentVideosCount ?? '—'}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('recent_videos.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {latestSnapshot.topContent.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('recent_videos.empty')}</p>
                ) : (
                  latestSnapshot.topContent.map((video) => (
                    <div
                      key={video.externalId}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/10 p-3"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        {video.imageUrl ? (
                          <img
                            src={video.imageUrl}
                            alt={video.title}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                            <Video className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {video.title}
                          </p>
                          {video.subtitle ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {formatDate(video.subtitle, locale) ?? video.subtitle}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {t('metrics.total_views')}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {formatNumber(Number(video.metricValue), locale) ?? video.metricValue}
                          </p>
                        </div>
                        {video.externalUrl ? (
                          <Button asChild variant="ghost" size="icon">
                            <Link href={video.externalUrl} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                              <span className="sr-only">{t('recent_videos.open_video')}</span>
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {subscribersHidden ? (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
              {t('messages.subscribers_hidden')}
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-4 w-4" />
            <p>{t('empty_synced')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
