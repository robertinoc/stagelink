'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle, ExternalLink, Music4, RefreshCw, Settings2 } from 'lucide-react';
import type {
  SoundCloudInsightsConnectionValidationResult,
  StageLinkInsightsPlatformSummary,
} from '@stagelink/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InsightsDetailDialog } from '@/features/insights/components/InsightsDetailDialog';
import {
  saveSoundCloudInsightsConnection,
  syncSoundCloudInsightsConnection,
  validateSoundCloudInsightsConnection,
} from '@/lib/api/insights';

interface SoundCloudInsightsCardProps {
  artistId: string;
  artistSoundCloudUrl?: string | null;
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

export function SoundCloudInsightsCard({
  artistId,
  artistSoundCloudUrl = null,
  summary,
  mode = 'analytics',
  analyticsHref,
  settingsHref,
}: SoundCloudInsightsCardProps) {
  const t = useTranslations('dashboard.insights.soundcloud');
  const commonT = useTranslations('dashboard.insights');
  const locale = useLocale();
  const router = useRouter();

  const resolvedProfileInput =
    artistSoundCloudUrl?.trim() ||
    summary.connection?.externalUrl ||
    summary.connection?.externalHandle ||
    '';
  const resolvedAnalyticsHref =
    analyticsHref ?? `/${locale}/dashboard/analytics#stage-link-insights`;
  const resolvedSettingsHref = settingsHref ?? `/${locale}/dashboard/settings#insights-connections`;
  const isSettingsMode = mode === 'settings';

  const [profileInput, setProfileInput] = useState(resolvedProfileInput);
  const [validation, setValidation] = useState<SoundCloudInsightsConnectionValidationResult | null>(
    null,
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'success' | 'error' | 'default'>('default');
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setProfileInput(resolvedProfileInput);
  }, [resolvedProfileInput]);

  const latestSnapshot = summary.latestSnapshot;
  const history = summary.history;
  const firstHistoryPoint = history[0] ?? null;
  const latestHistoryPoint = history[history.length - 1] ?? null;
  const persistedSyncError =
    !statusMessage && summary.connection?.lastSyncStatus === 'error'
      ? summary.connection.lastSyncError
      : null;

  const followersCount = formatNumber(latestSnapshot?.metrics['followers_count'], locale);
  const trackCount =
    typeof latestSnapshot?.metrics['track_count'] === 'number'
      ? String(latestSnapshot.metrics['track_count'])
      : null;
  const topTracksCount =
    typeof latestSnapshot?.metrics['top_tracks_count'] === 'number'
      ? String(latestSnapshot.metrics['top_tracks_count'])
      : null;

  const followersDelta = (() => {
    const current = latestHistoryPoint?.metrics['followers_count'];
    const previous = firstHistoryPoint?.metrics['followers_count'];
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
  })();

  const formattedLastSynced = useMemo(
    () => formatDate(summary.connection?.lastSyncedAt ?? null, locale),
    [locale, summary.connection?.lastSyncedAt],
  );

  async function handleValidate() {
    setValidating(true);
    setStatusMessage(null);
    try {
      const result = await validateSoundCloudInsightsConnection(artistId, { profileInput });
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
      await saveSoundCloudInsightsConnection(artistId, { profileInput });
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
      const result = await syncSoundCloudInsightsConnection(artistId);
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
              <label className="text-sm font-medium">{t('fields.profile_input')}</label>
              <Input
                value={profileInput}
                onChange={(event) => setProfileInput(event.target.value)}
                placeholder={t('fields.profile_input_placeholder')}
              />
              <p className="text-xs text-muted-foreground">{t('fields.profile_input_hint')}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleValidate}
                disabled={validating || profileInput.trim().length === 0}
              >
                {validating ? t('actions.validating') : t('actions.validate')}
              </Button>
              <Button
                type="button"
                onClick={handleConnect}
                disabled={saving || profileInput.trim().length === 0}
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
                  <Music4 className="h-5 w-5 text-emerald-100" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-emerald-50">{validation.displayName}</p>
                  <Badge variant="outline">SoundCloud</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-emerald-100/80">
                  {typeof validation.followersCount === 'number' ? (
                    <span>
                      {t('metrics.followers_count')}:{' '}
                      {formatNumber(validation.followersCount, locale)}
                    </span>
                  ) : null}
                  {typeof validation.trackCount === 'number' ? (
                    <span>
                      {t('metrics.track_count')}: {validation.trackCount}
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
                    {summary.connection.displayName ?? t('connected.unknown_artist')}
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
                      {t('actions.open_soundcloud')}
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
                  <li>{t('scope.includes.profile')}</li>
                  <li>{t('scope.includes.followers')}</li>
                  <li>{t('scope.includes.track_count')}</li>
                  <li>{t('scope.includes.top_tracks')}</li>
                </ul>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-sm font-medium text-foreground">
                  {t('scope.not_included_title')}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>{t('scope.not_included.play_history')}</li>
                  <li>{t('scope.not_included.demographics')}</li>
                  <li>{t('scope.not_included.revenue')}</li>
                  <li>{t('scope.not_included.private_stats')}</li>
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
                        {t('history.followers_change')}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {followersDelta ?? '—'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                      <p className="text-xs text-muted-foreground">{t('history.tracks_synced')}</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {topTracksCount ?? '—'}
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
                              {t('metrics.followers_count')}:{' '}
                              {formatNumber(point.metrics['followers_count'], locale) ?? '—'}
                            </span>
                            <span className="text-muted-foreground">
                              {t('metrics.track_count')}:{' '}
                              {formatNumber(point.metrics['track_count'], locale) ?? '—'}
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

  // Analytics mode — no connection
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

  // Analytics mode — connected
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
                {summary.connection.displayName ?? t('connected.unknown_artist')}
              </p>
              <Badge variant="secondary">{commonT(`status.${summary.connection.status}`)}</Badge>
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
                  {t('actions.open_soundcloud')}
                </Link>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
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
                    <p className="text-xs text-muted-foreground">{t('history.followers_change')}</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {followersDelta ?? '—'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                    <p className="text-xs text-muted-foreground">{t('history.tracks_synced')}</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {topTracksCount ?? '—'}
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
                            {t('metrics.followers_count')}:{' '}
                            {formatNumber(point.metrics['followers_count'], locale) ?? '—'}
                          </span>
                          <span className="text-muted-foreground">
                            {t('metrics.track_count')}:{' '}
                            {formatNumber(point.metrics['track_count'], locale) ?? '—'}
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
                <li>{t('scope.includes.profile')}</li>
                <li>{t('scope.includes.followers')}</li>
                <li>{t('scope.includes.track_count')}</li>
                <li>{t('scope.includes.top_tracks')}</li>
              </ul>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/10 p-4">
              <p className="text-sm font-medium text-foreground">{t('scope.not_included_title')}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>{t('scope.not_included.play_history')}</li>
                <li>{t('scope.not_included.demographics')}</li>
                <li>{t('scope.not_included.revenue')}</li>
                <li>{t('scope.not_included.private_stats')}</li>
              </ul>
            </div>
          </div>
        </InsightsDetailDialog>
      </div>

      {latestSnapshot ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('metrics.followers_count')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{followersCount ?? '—'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('metrics.track_count')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{trackCount ?? '—'}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('top_tracks.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestSnapshot.topContent.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('top_tracks.empty')}</p>
              ) : (
                latestSnapshot.topContent.map((track) => (
                  <div
                    key={track.externalId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/10 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {track.imageUrl ? (
                        <img
                          src={track.imageUrl}
                          alt={track.title}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                          <Music4 className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {track.title}
                        </p>
                        {track.subtitle ? (
                          <p className="truncate text-xs text-muted-foreground">{track.subtitle}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {track.metricLabel === 'Plays' ? t('metrics.plays') : track.metricLabel}
                        </p>
                        <p className="text-sm font-medium text-foreground">{track.metricValue}</p>
                      </div>
                      {track.externalUrl ? (
                        <Button asChild variant="ghost" size="icon">
                          <Link href={track.externalUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">{t('top_tracks.open_track')}</span>
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
