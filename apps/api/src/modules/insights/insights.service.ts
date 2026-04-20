import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type {
  StageLinkInsightsConnection,
  StageLinkInsightsDashboard,
  StageLinkInsightsPlatform,
  StageLinkInsightsPlatformSummary,
  StageLinkInsightsSnapshot,
  StageLinkInsightsTopContentItem,
} from '@stagelink/types';
import { STAGELINK_INSIGHTS_PLATFORMS } from '@stagelink/types';
import { PrismaService } from '../../lib/prisma.service';
import { BillingEntitlementsService } from '../billing/billing-entitlements.service';
import { SoundCloudInsightsProvider } from './providers/soundcloud-insights.provider';
import { SpotifyInsightsProvider } from './providers/spotify-insights.provider';
import { YouTubeInsightsProvider } from './providers/youtube-insights.provider';
import type { PlatformInsightsProvider } from './providers/insights-provider.interface';

type InsightsConnectionRecord = {
  artistId: string;
  platform: StageLinkInsightsPlatform;
  connectionMethod: 'oauth' | 'reference';
  status: 'pending' | 'connected' | 'needs_reauth' | 'error';
  displayName: string | null;
  externalAccountId: string | null;
  externalHandle: string | null;
  externalUrl: string | null;
  scopes: Prisma.JsonValue;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  lastSyncStartedAt: Date | null;
  lastSyncedAt: Date | null;
  lastSyncStatus: 'never' | 'pending' | 'success' | 'partial' | 'error';
  lastSyncError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type InsightsSnapshotRecord = {
  platform: StageLinkInsightsPlatform;
  capturedAt: Date;
  profile: Prisma.JsonValue;
  metrics: Prisma.JsonValue;
  topContent: Prisma.JsonValue;
};

@Injectable()
export class InsightsService {
  private readonly providers: Record<StageLinkInsightsPlatform, PlatformInsightsProvider>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly billingEntitlementsService: BillingEntitlementsService,
    spotifyProvider: SpotifyInsightsProvider,
    youTubeProvider: YouTubeInsightsProvider,
    soundCloudProvider: SoundCloudInsightsProvider,
  ) {
    this.providers = {
      spotify: spotifyProvider,
      youtube: youTubeProvider,
      soundcloud: soundCloudProvider,
    };
  }

  async getDashboard(artistId: string): Promise<StageLinkInsightsDashboard> {
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'stage_link_insights');

    const [connections, snapshots, snapshotCount] = await Promise.all([
      this.prisma.artistPlatformInsightsConnection.findMany({
        where: { artistId },
        orderBy: [{ createdAt: 'asc' }],
      }),
      this.prisma.artistPlatformInsightsSnapshot.findMany({
        where: { artistId },
        orderBy: [{ capturedAt: 'desc' }],
        take: 30,
      }),
      this.prisma.artistPlatformInsightsSnapshot.count({
        where: { artistId },
      }),
    ]);

    const connectionsByPlatform = new Map<StageLinkInsightsPlatform, InsightsConnectionRecord>();
    connections.forEach((connection) => {
      connectionsByPlatform.set(
        connection.platform as StageLinkInsightsPlatform,
        connection as InsightsConnectionRecord,
      );
    });

    const latestSnapshots = new Map<StageLinkInsightsPlatform, InsightsSnapshotRecord>();
    snapshots.forEach((snapshot) => {
      const platform = snapshot.platform as StageLinkInsightsPlatform;
      if (!latestSnapshots.has(platform)) {
        latestSnapshots.set(platform, snapshot as InsightsSnapshotRecord);
      }
    });

    const platformSummaries: StageLinkInsightsPlatformSummary[] = STAGELINK_INSIGHTS_PLATFORMS.map(
      (platform) => ({
        platform,
        capabilities: this.providers[platform].getCapabilities(),
        connection: this.mapConnection(connectionsByPlatform.get(platform) ?? null),
        latestSnapshot: this.mapSnapshot(latestSnapshots.get(platform) ?? null),
      }),
    );

    const connectedPlatforms = platformSummaries.filter(
      (platform) => platform.connection?.status === 'connected',
    ).length;
    const syncedPlatforms = platformSummaries.filter(
      (platform) =>
        platform.connection?.lastSyncStatus === 'success' ||
        platform.connection?.lastSyncStatus === 'partial',
    ).length;
    const lastUpdatedAt = snapshots[0]?.capturedAt?.toISOString() ?? null;

    return {
      artistId,
      feature: 'stage_link_insights',
      hasAnyConnectedPlatforms: connectedPlatforms > 0,
      lastUpdatedAt,
      summaryCards: [
        { id: 'connected_platforms', value: String(connectedPlatforms) },
        { id: 'synced_platforms', value: String(syncedPlatforms) },
        { id: 'stored_snapshots', value: String(snapshotCount) },
        { id: 'supported_platforms', value: String(STAGELINK_INSIGHTS_PLATFORMS.length) },
      ],
      platforms: platformSummaries,
    };
  }

  private mapConnection(
    connection: InsightsConnectionRecord | null,
  ): StageLinkInsightsConnection | null {
    if (!connection) {
      return null;
    }

    return {
      artistId: connection.artistId,
      platform: connection.platform,
      status: connection.status,
      connectionMethod: connection.connectionMethod,
      displayName: connection.displayName,
      externalAccountId: connection.externalAccountId,
      externalHandle: connection.externalHandle,
      externalUrl: connection.externalUrl,
      scopes: this.readStringArray(connection.scopes),
      hasAccessToken: Boolean(connection.accessToken),
      hasRefreshToken: Boolean(connection.refreshToken),
      tokenExpiresAt: connection.tokenExpiresAt?.toISOString() ?? null,
      lastSyncStartedAt: connection.lastSyncStartedAt?.toISOString() ?? null,
      lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
      lastSyncStatus: connection.lastSyncStatus,
      lastSyncError: connection.lastSyncError,
      createdAt: connection.createdAt.toISOString(),
      updatedAt: connection.updatedAt.toISOString(),
    };
  }

  private mapSnapshot(snapshot: InsightsSnapshotRecord | null): StageLinkInsightsSnapshot | null {
    if (!snapshot) {
      return null;
    }

    return {
      platform: snapshot.platform,
      capturedAt: snapshot.capturedAt.toISOString(),
      profile: this.readProfile(snapshot.profile),
      metrics: this.readMetrics(snapshot.metrics),
      topContent: this.readTopContent(snapshot.topContent, snapshot.platform),
    };
  }

  private readStringArray(value: Prisma.JsonValue): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === 'string');
  }

  private readProfile(value: Prisma.JsonValue): StageLinkInsightsSnapshot['profile'] {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return {
        displayName: null,
        imageUrl: null,
        externalUrl: null,
      };
    }

    const profile = value as Record<string, unknown>;
    return {
      displayName: typeof profile['displayName'] === 'string' ? profile['displayName'] : null,
      imageUrl: typeof profile['imageUrl'] === 'string' ? profile['imageUrl'] : null,
      externalUrl: typeof profile['externalUrl'] === 'string' ? profile['externalUrl'] : null,
    };
  }

  private readMetrics(value: Prisma.JsonValue): Record<string, string | number | boolean | null> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return {};
    }

    return Object.entries(value as Record<string, unknown>).reduce<
      Record<string, string | number | boolean | null>
    >((acc, [key, item]) => {
      if (
        typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean' ||
        item === null
      ) {
        acc[key] = item;
      }
      return acc;
    }, {});
  }

  private readTopContent(
    value: Prisma.JsonValue,
    platform: StageLinkInsightsPlatform,
  ): StageLinkInsightsTopContentItem[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.reduce<StageLinkInsightsTopContentItem[]>((acc, item) => {
      if (typeof item !== 'object' || item === null || Array.isArray(item)) {
        return acc;
      }

      const candidate = item as Record<string, unknown>;
      if (typeof candidate['externalId'] !== 'string' || typeof candidate['title'] !== 'string') {
        return acc;
      }

      acc.push({
        platform,
        externalId: candidate['externalId'],
        title: candidate['title'],
        subtitle: typeof candidate['subtitle'] === 'string' ? candidate['subtitle'] : null,
        metricLabel:
          typeof candidate['metricLabel'] === 'string' ? candidate['metricLabel'] : 'Metric',
        metricValue:
          typeof candidate['metricValue'] === 'string'
            ? candidate['metricValue']
            : String(candidate['metricValue'] ?? ''),
        imageUrl: typeof candidate['imageUrl'] === 'string' ? candidate['imageUrl'] : null,
        externalUrl: typeof candidate['externalUrl'] === 'string' ? candidate['externalUrl'] : null,
      });
      return acc;
    }, []);
  }
}
