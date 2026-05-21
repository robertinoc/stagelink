'use client';

import { useTranslations } from 'next-intl';
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
    validate: t('actions.validate'),
    update_connection: t('actions.update'),
    validating: t('actions.validating'),
    syncing: t('actions.syncing'),
    validate_success: t('actions.validate_success'),
    validate_error: t('actions.validate_error'),
  };

  const spotifyState = extractInsightsState(data, 'spotify');
  const youtubeState = extractInsightsState(data, 'youtube');

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
        tier={spotifyState.connected ? { label: t('spotify.tier') } : null}
        tip={t('spotify.tip')}
        connected={spotifyState.connected}
        connectionUrl={spotifyState.url}
        lastSync={spotifyState.lastSync}
        externalUrl={spotifyState.url}
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
        tier={youtubeState.connected ? { label: t('youtube.tier') } : null}
        tip={t('youtube.tip')}
        connected={youtubeState.connected}
        connectionUrl={youtubeState.url}
        lastSync={youtubeState.lastSync}
        externalUrl={youtubeState.url}
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

function extractInsightsState(
  data: DashboardSettingsData,
  platform: 'spotify' | 'youtube',
): { connected: boolean; url: string | null; lastSync: string | null } {
  const insights =
    data.insightsResult && 'kind' in data.insightsResult ? data.insightsResult : null;
  if (!insights || insights.kind === 'error') {
    return { connected: false, url: null, lastSync: null };
  }
  const record = (insights as unknown as Record<string, unknown>)[platform];
  if (!record || typeof record !== 'object') {
    return { connected: false, url: null, lastSync: null };
  }
  const r = record as Record<string, unknown>;
  const status = typeof r['status'] === 'string' ? (r['status'] as string) : '';
  const connected = status === 'connected' || status === 'ok';
  const url =
    typeof r['profileUrl'] === 'string'
      ? (r['profileUrl'] as string)
      : typeof r['url'] === 'string'
        ? (r['url'] as string)
        : typeof r['channelUrl'] === 'string'
          ? (r['channelUrl'] as string)
          : null;
  const lastSyncRaw =
    typeof r['lastSyncAt'] === 'string'
      ? (r['lastSyncAt'] as string)
      : typeof r['lastSync'] === 'string'
        ? (r['lastSync'] as string)
        : null;
  let lastSync: string | null = null;
  if (lastSyncRaw) {
    const date = new Date(lastSyncRaw);
    if (!Number.isNaN(date.getTime())) {
      lastSync = date.toLocaleString();
    }
  }
  return { connected, url, lastSync };
}
