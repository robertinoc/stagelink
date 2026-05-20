'use client';

import { useTranslations } from 'next-intl';
import type {
  StageLinkInsightsDashboard,
  StageLinkInsightsPlatformSummary,
} from '@stagelink/types';
import { derivePlatformTier, tierLabel } from '../../lib/tier';
import { OverviewCard } from './OverviewCard';
import { InsightCard } from './InsightCard';
import { PlatformCard } from './PlatformCard';
import { SpotifyPanel } from './SpotifyPanel';
import { YouTubePanel } from './YouTubePanel';
import { SoundCloudComingSoon } from './SoundCloudComingSoon';
import { DataFreshnessCard, type FreshnessEntry } from './DataFreshnessCard';
import { Bento } from '@/components/sl/Bento';

interface PlatformsTabProps {
  insights: StageLinkInsightsDashboard | null;
  artistYouTubeUrl: string | null;
  artistId: string;
  locale: 'es' | 'en';
}

function findPlatform(
  insights: StageLinkInsightsDashboard | null,
  platform: 'spotify' | 'youtube' | 'soundcloud',
): StageLinkInsightsPlatformSummary | undefined {
  return insights?.platforms.find((p) => p.platform === platform);
}

export function PlatformsTab({ insights, artistYouTubeUrl, artistId, locale }: PlatformsTabProps) {
  const t = useTranslations('analytics.v2');

  if (!insights) {
    return (
      <Bento pad={22}>
        <p className="text-[13.5px] text-white/70">{t('platforms.unavailable')}</p>
      </Bento>
    );
  }

  const spotify = findPlatform(insights, 'spotify');
  const youtube = findPlatform(insights, 'youtube');
  const soundcloud = findPlatform(insights, 'soundcloud');

  const connectedNames = [spotify, youtube, soundcloud]
    .filter((p) => p?.connection?.status === 'connected')
    .map((p) =>
      p!.platform === 'spotify' ? 'Spotify' : p!.platform === 'youtube' ? 'YouTube' : 'SoundCloud',
    );

  const connectedCount = connectedNames.length;
  const syncedCount = [spotify, youtube, soundcloud].filter(
    (p) => p?.connection?.lastSyncedAt,
  ).length;
  const snapshotsCount = [spotify, youtube, soundcloud].reduce(
    (s, p) => s + (p?.history.length ?? 0),
    0,
  );

  const overviewStats = [
    {
      label: t('platforms.statsConnected'),
      value: String(connectedCount),
      icon: '🌐',
      hint: connectedNames.join(' · ') || t('platforms.none'),
    },
    {
      label: t('platforms.statsSynced'),
      value: String(syncedCount),
      icon: '🔄',
      hint: t('platforms.atLeastOneSync'),
    },
    {
      label: t('platforms.statsSnapshots'),
      value: String(snapshotsCount),
      icon: '📸',
      hint: t('platforms.historical'),
    },
    {
      label: t('platforms.statsSupported'),
      value: '3',
      icon: '✨',
      hint: t('platforms.today'),
    },
  ];

  const topContentInsight = pickTopContent(insights);
  const recentlyConnectedInsight = pickRecentlyConnected(insights, locale);

  const spotifyPrev =
    spotify?.history.length && spotify.history.length > 0 ? buildPrevSnapshot(spotify) : null;
  const youtubePrev =
    youtube?.history.length && youtube.history.length > 0 ? buildPrevSnapshot(youtube) : null;

  const freshness: FreshnessEntry[] = [
    spotify && {
      platformName: 'Spotify',
      iso: spotify.connection?.lastSyncedAt ?? null,
      state: mapSyncStateToFreshness(spotify.connection?.lastSyncStatus),
      label: freshnessLabel(spotify.connection?.lastSyncStatus, t),
    },
    youtube && {
      platformName: 'YouTube',
      iso: youtube.connection?.lastSyncedAt ?? null,
      state: mapSyncStateToFreshness(youtube.connection?.lastSyncStatus),
      label: freshnessLabel(youtube.connection?.lastSyncStatus, t),
    },
  ].filter(Boolean) as FreshnessEntry[];

  return (
    <div className="space-y-4">
      <OverviewCard
        eyebrow={t('platforms.eyebrow')}
        heroNumber={connectedCount}
        heroTotal={3}
        heroSuffix={t('platforms.heroSuffix')}
        body={{
          bold: t('platforms.heroBoldNumber', { count: snapshotsCount }),
          plain: t('platforms.heroBody'),
          tail: '',
        }}
        buttons={{
          viewSnapshots: t('platforms.viewSnapshots'),
          connect: t('platforms.connect'),
        }}
        stats={overviewStats}
      />

      <div className="sl-insight-grid grid gap-3.5 sm:grid-cols-2">
        {topContentInsight && (
          <InsightCard
            tone="yellow"
            icon="⭐"
            eyebrow={t('platforms.topContent')}
            sourcePill={topContentInsight.sourcePill}
            title={topContentInsight.title}
            sub={topContentInsight.sub}
            cta={{ label: t('platforms.viewOnPlatform') + ' →', href: topContentInsight.url }}
          />
        )}
        {recentlyConnectedInsight && (
          <InsightCard
            tone="cyan"
            icon="⚡"
            eyebrow={t('platforms.newPlatform')}
            title={recentlyConnectedInsight.title}
            sub={recentlyConnectedInsight.sub}
            cta={{ label: t('platforms.explore') + ' →', href: '#' }}
          />
        )}
      </div>

      {spotify && spotify.connection?.status === 'connected' && (
        <PlatformCard
          brand="#1DB954"
          emoji="🎧"
          name="Spotify"
          connectedLabel={t('platforms.connected')}
          tier={tierLabel(derivePlatformTier(spotify), locale)}
          lastSyncIso={spotify.connection.lastSyncedAt}
          lastSyncLabel={t('platforms.lastSync')}
          openLabel={t('platforms.openIn')}
          syncLabel={t('platforms.syncNow')}
          manageLabel={t('platforms.manage')}
          externalUrl={spotify.connection.externalUrl}
          syncEndpoint={`/api/insights/${artistId}/spotify/sync`}
          footerNote={t('platforms.spotifyFooter')}
          locale={locale}
        >
          <SpotifyPanel
            snapshot={spotify.latestSnapshot}
            prev={spotifyPrev}
            labels={{
              followers: t('platforms.followers'),
              popularity: t('platforms.popularity'),
              genres: t('platforms.genres'),
              topTracksEmpty: t('platforms.spotifyTopTracksEmpty'),
            }}
            locale={locale}
          />
        </PlatformCard>
      )}

      {youtube && youtube.connection?.status === 'connected' && (
        <PlatformCard
          brand="#FF0000"
          emoji="📺"
          name="YouTube"
          connectedLabel={t('platforms.connected')}
          tier={tierLabel(derivePlatformTier(youtube), locale)}
          lastSyncIso={youtube.connection.lastSyncedAt}
          lastSyncLabel={t('platforms.lastSync')}
          openLabel={t('platforms.openIn')}
          syncLabel={t('platforms.syncNow')}
          manageLabel={t('platforms.manage')}
          externalUrl={youtube.connection.externalUrl ?? artistYouTubeUrl}
          syncEndpoint={`/api/insights/${artistId}/youtube/sync`}
          footerNote={t('platforms.youtubeFooter')}
          locale={locale}
        >
          <YouTubePanel
            snapshot={youtube.latestSnapshot}
            prev={youtubePrev}
            labels={{
              subscribers: t('platforms.subscribers'),
              totalViews: t('platforms.totalViews'),
              videos: t('platforms.videos'),
              recentVideos: t('platforms.recentVideos'),
              viewAll: t('platforms.viewAllVideos'),
              viewsLabel: t('platforms.views'),
            }}
            recentVideosUrl={artistYouTubeUrl ?? undefined}
            locale={locale}
          />
        </PlatformCard>
      )}

      <SoundCloudComingSoon
        title={t('platforms.soundcloudTitle')}
        description={t('platforms.soundcloudDesc')}
        comingSoonLabel={t('platforms.soundcloudPill')}
      />

      <DataFreshnessCard
        title={t('platforms.freshnessTitle')}
        hint={t('platforms.freshnessHint')}
        lastUpdatedLabel={t('platforms.lastUpdated')}
        lastUpdatedIso={insights.lastUpdatedAt}
        entries={freshness}
        locale={locale}
      />
    </div>
  );
}

function buildPrevSnapshot(p: StageLinkInsightsPlatformSummary) {
  // history is ordered newest → oldest typically; we look for the second
  // element after current and re-wrap as a pseudo-snapshot for delta math.
  if (p.history.length < 2 || !p.latestSnapshot) return null;
  const previous = p.history[1];
  if (!previous) return null;
  return {
    platform: p.platform,
    capturedAt: previous.capturedAt,
    profile: p.latestSnapshot.profile,
    metrics: previous.metrics,
    topContent: [],
  };
}

function mapSyncStateToFreshness(
  status: 'never' | 'pending' | 'success' | 'partial' | 'error' | undefined,
) {
  switch (status) {
    case 'success':
      return 'ok' as const;
    case 'partial':
      return 'partial' as const;
    case 'never':
    case undefined:
      return 'never' as const;
    case 'error':
      return 'never' as const;
    case 'pending':
      return 'partial' as const;
  }
}

function freshnessLabel(
  status: 'never' | 'pending' | 'success' | 'partial' | 'error' | undefined,
  t: ReturnType<typeof useTranslations>,
): string {
  switch (status) {
    case 'success':
      return t('platforms.syncSuccess');
    case 'partial':
      return t('platforms.syncPartial');
    case 'pending':
      return t('platforms.syncPending');
    case 'error':
      return t('platforms.syncError');
    case 'never':
    case undefined:
    default:
      return t('platforms.syncNever');
  }
}

function pickTopContent(insights: StageLinkInsightsDashboard) {
  for (const p of insights.platforms) {
    const item = p.latestSnapshot?.topContent?.[0];
    if (item) {
      return {
        sourcePill: p.platform.toUpperCase(),
        title: item.title,
        sub: `${item.metricLabel}: ${item.metricValue}`,
        url: item.externalUrl ?? '#',
      };
    }
  }
  return null;
}

function pickRecentlyConnected(insights: StageLinkInsightsDashboard, locale: 'es' | 'en') {
  const recent = insights.platforms
    .filter((p) => p.connection?.status === 'connected')
    .sort(
      (a, b) =>
        new Date(b.connection?.createdAt ?? 0).getTime() -
        new Date(a.connection?.createdAt ?? 0).getTime(),
    )[0];
  if (!recent || !recent.connection?.createdAt) return null;
  const created = new Date(recent.connection.createdAt).getTime();
  const days = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
  if (days > 14) return null;
  const platformName =
    recent.platform === 'spotify'
      ? 'Spotify'
      : recent.platform === 'youtube'
        ? 'YouTube'
        : 'SoundCloud';
  const dayLabel = locale === 'es' ? (days === 1 ? 'día' : 'días') : days === 1 ? 'day' : 'days';
  return {
    title:
      locale === 'es'
        ? `${platformName} conectado hace ${days} ${dayLabel}`
        : `${platformName} connected ${days} ${dayLabel} ago`,
    sub: locale === 'es' ? 'Datos del primer sync ya disponibles.' : 'First-sync data is in.',
  };
}
