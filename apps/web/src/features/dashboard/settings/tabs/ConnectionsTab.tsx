'use client';

import { useTranslations } from 'next-intl';
import type { StageLinkInsightsConnection, StageLinkInsightsDashboard } from '@stagelink/types';
import type { DashboardSettingsData } from '@/features/dashboard/settings/settings-data';
import { ConnectionCard, type ConnectionCardCopy } from './connections/ConnectionCard';
import { SoundCloudCard } from './connections/SoundCloudCard';
import { HelpBanner } from './connections/HelpBanner';

interface ConnectionsTabProps {
  data: DashboardSettingsData;
  locale: string;
}

export function ConnectionsTab({ data, locale }: ConnectionsTabProps) {
  const t = useTranslations('dashboard.settings.connections');

  const copy: ConnectionCardCopy = {
    status_connected: t('status.connected'),
    status_disconnected: t('status.disconnected'),
    last_sync: t('last_sync'),
    connected_ok: t('connected_panel.ok'),
    snapshots_note: t('connected_panel.snapshots'),
    open_in_platform: t('connected_panel.open'),
    view_analytics: t('connected_panel.analytics'),
    disconnect: t('connected_panel.disconnect'),
    disconnecting: t('connected_panel.disconnecting'),
    disconnect_confirm: t('connected_panel.disconnect_confirm'),
    validate: t('actions.validate'),
    connect: t('actions.connect'),
    update_connection: t('actions.update'),
    validating: t('actions.validating'),
    saving: t('actions.saving'),
    syncing: t('actions.syncing'),
    sync: t('actions.sync'),
    validate_error: t('actions.validate_error'),
    save_error: t('actions.save_error'),
    sync_error: t('actions.sync_error'),
    validated_prefix: t('actions.validated_prefix'),
    stat_followers: t('stats.followers'),
    stat_popularity: t('stats.popularity'),
    stat_subscribers: t('stats.subscribers'),
    stat_views: t('stats.views'),
    stat_videos: t('stats.videos'),
  };

  const dashboard = resolveDashboard(data);
  const spotifyConn = findConnection(dashboard, 'spotify');
  const youtubeConn = findConnection(dashboard, 'youtube');

  return (
    <div className="space-y-5">
      <HelpBanner
        title={t('help.title')}
        emoji="💡"
        tone="cyan"
        body={t.rich('help.body', {
          strong: (chunks) => <strong className="text-white">{chunks}</strong>,
        })}
      />

      <ConnectionCard
        platform="spotify"
        artistId={data.artistId}
        brand="#1DB954"
        emoji="🎵"
        name="Spotify"
        title={t('spotify.title')}
        hint={t('spotify.hint')}
        inputLabel={t('spotify.input_label')}
        inputHint={t('spotify.input_hint')}
        placeholder="https://open.spotify.com/artist/..."
        tier={spotifyConn?.status === 'connected' ? { label: t('spotify.tier') } : null}
        tip={t('spotify.tip')}
        connection={spotifyConn}
        artistSavedUrl={readArtistUrl(data, 'spotifyUrl')}
        locale={locale}
        copy={copy}
      />

      <ConnectionCard
        platform="youtube"
        artistId={data.artistId}
        brand="#FF0000"
        emoji="▶️"
        name="YouTube"
        title={t('youtube.title')}
        hint={t('youtube.hint')}
        inputLabel={t('youtube.input_label')}
        inputHint={t('youtube.input_hint')}
        placeholder="https://youtube.com/@..."
        tier={youtubeConn?.status === 'connected' ? { label: t('youtube.tier') } : null}
        tip={t('youtube.tip')}
        connection={youtubeConn}
        artistSavedUrl={readArtistUrl(data, 'youtubeUrl')}
        locale={locale}
        copy={copy}
      />

      <SoundCloudCard
        name="SoundCloud"
        comingSoonLabel={t('soundcloud.coming_soon')}
        body={t('soundcloud.body')}
        ctaLabel={t('soundcloud.cta')}
        profileHref={`/${locale}/dashboard/profile`}
      />
    </div>
  );
}

function resolveDashboard(data: DashboardSettingsData): StageLinkInsightsDashboard | null {
  const res = data.insightsResult;
  if (res && 'kind' in res && res.kind === 'ok') {
    return res.data;
  }
  return null;
}

function findConnection(
  dashboard: StageLinkInsightsDashboard | null,
  platform: 'spotify' | 'youtube',
): StageLinkInsightsConnection | null {
  if (!dashboard) return null;
  return dashboard.platforms.find((p) => p.platform === platform)?.connection ?? null;
}

function readArtistUrl(
  data: DashboardSettingsData,
  key: 'spotifyUrl' | 'youtubeUrl',
): string | null {
  const artist = data.artist as unknown as Record<string, unknown> | null;
  const value = artist?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}
