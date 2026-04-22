import {
  BadRequestException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type {
  SpotifyInsightsConnectionValidationResult,
  SpotifyInsightsSyncResult,
  StageLinkInsightsConnection,
  StageLinkInsightsDashboard,
  StageLinkInsightsDateRange,
  StageLinkInsightsHistoryPoint,
  StageLinkInsightsPlatform,
  StageLinkInsightsPlatformSummary,
  StageLinkInsightsSnapshot,
  StageLinkInsightsTopContentItem,
} from '@stagelink/types';
import { STAGELINK_INSIGHTS_DATE_RANGES, STAGELINK_INSIGHTS_PLATFORMS } from '@stagelink/types';
import { PrismaService } from '../../lib/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BillingEntitlementsService } from '../billing/billing-entitlements.service';
import { MembershipService } from '../membership/membership.service';
import { SpotifyInsightsConnectionDto } from './dto';
import { SoundCloudInsightsProvider } from './providers/soundcloud-insights.provider';
import type { PlatformInsightsProvider } from './providers/insights-provider.interface';
import { SpotifyInsightsProvider } from './providers/spotify-insights.provider';
import { YouTubeInsightsProvider } from './providers/youtube-insights.provider';

type InsightsConnectionRecord = {
  id: string;
  artistId: string;
  platform: StageLinkInsightsPlatform;
  connectionMethod: 'oauth' | 'reference';
  status: 'pending' | 'connected' | 'needs_reauth' | 'error';
  displayName: string | null;
  externalAccountId: string | null;
  externalHandle: string | null;
  externalUrl: string | null;
  scopes: Prisma.JsonValue;
  metadata: Prisma.JsonValue;
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

const DEFAULT_INSIGHTS_RANGE: StageLinkInsightsDateRange = '30d';
const MAX_INSIGHTS_HISTORY_POINTS = 180;

@Injectable()
export class InsightsService {
  private readonly providers: Record<StageLinkInsightsPlatform, PlatformInsightsProvider>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
    private readonly auditService: AuditService,
    private readonly billingEntitlementsService: BillingEntitlementsService,
    private readonly spotifyProvider: SpotifyInsightsProvider,
    youTubeProvider: YouTubeInsightsProvider,
    soundCloudProvider: SoundCloudInsightsProvider,
  ) {
    this.providers = {
      spotify: this.spotifyProvider,
      youtube: youTubeProvider,
      soundcloud: soundCloudProvider,
    };
  }

  async getDashboard(artistId: string, rangeInput?: string): Promise<StageLinkInsightsDashboard> {
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'stage_link_insights');
    const selectedRange = this.resolveDateRange(rangeInput);
    const rangeStart = this.resolveRangeStart(selectedRange);
    const snapshotWhere: Prisma.ArtistPlatformInsightsSnapshotWhereInput = rangeStart
      ? {
          artistId,
          capturedAt: { gte: rangeStart },
        }
      : { artistId };

    const [connections, snapshots, snapshotCount] = await Promise.all([
      this.prisma.artistPlatformInsightsConnection.findMany({
        where: { artistId },
        orderBy: [{ createdAt: 'asc' }],
      }),
      this.prisma.artistPlatformInsightsSnapshot.findMany({
        where: snapshotWhere,
        orderBy: [{ capturedAt: 'desc' }],
        take: MAX_INSIGHTS_HISTORY_POINTS,
      }),
      this.prisma.artistPlatformInsightsSnapshot.count({
        where: snapshotWhere,
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

    const historyByPlatform = new Map<StageLinkInsightsPlatform, StageLinkInsightsHistoryPoint[]>();
    [...snapshots].reverse().forEach((snapshot) => {
      const platform = snapshot.platform as StageLinkInsightsPlatform;
      const current = historyByPlatform.get(platform) ?? [];
      current.push(this.mapHistoryPoint(snapshot as InsightsSnapshotRecord));
      historyByPlatform.set(platform, current);
    });

    const platformSummaries: StageLinkInsightsPlatformSummary[] = STAGELINK_INSIGHTS_PLATFORMS.map(
      (platform) => ({
        platform,
        capabilities: this.providers[platform].getCapabilities(),
        connection: this.mapConnection(connectionsByPlatform.get(platform) ?? null),
        latestSnapshot: this.mapSnapshot(latestSnapshots.get(platform) ?? null),
        history: historyByPlatform.get(platform) ?? [],
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
      selectedRange,
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

  async validateSpotifyConnection(
    artistId: string,
    dto: SpotifyInsightsConnectionDto,
    userId: string,
  ): Promise<SpotifyInsightsConnectionValidationResult> {
    await this.membershipService.validateAccess(userId, artistId, 'write');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'stage_link_insights');

    return this.spotifyProvider.validateArtistReference(dto.artistInput);
  }

  async updateSpotifyConnection(
    artistId: string,
    dto: SpotifyInsightsConnectionDto,
    userId: string,
    ipAddress?: string,
  ): Promise<StageLinkInsightsConnection> {
    await this.membershipService.validateAccess(userId, artistId, 'write');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'stage_link_insights');

    const validation = await this.spotifyProvider.validateArtistReference(dto.artistInput);
    const existing = await this.prisma.artistPlatformInsightsConnection.findFirst({
      where: {
        artistId,
        platform: 'spotify',
      },
    });

    const accountChanged = existing?.externalAccountId !== validation.externalAccountId;
    const metadata = {
      imageUrl: validation.imageUrl,
      followersTotal: validation.followersTotal,
      popularity: validation.popularity,
      source: 'spotify-web-api',
    } satisfies Record<string, unknown>;

    const savedConnection = await this.prisma.$transaction(async (tx) => {
      if (existing && accountChanged) {
        await tx.artistPlatformInsightsSnapshot.deleteMany({
          where: { connectionId: existing.id },
        });
      }

      if (existing) {
        const recoveredSyncStatus =
          accountChanged || !existing.lastSyncedAt
            ? 'never'
            : existing.lastSyncStatus === 'error'
              ? 'success'
              : existing.lastSyncStatus;

        return tx.artistPlatformInsightsConnection.update({
          where: { id: existing.id },
          data: {
            connectionMethod: 'reference',
            status: 'connected',
            displayName: validation.displayName,
            externalAccountId: validation.externalAccountId,
            externalHandle: null,
            externalUrl: validation.externalUrl,
            accessToken: null,
            refreshToken: null,
            tokenExpiresAt: null,
            scopes: [],
            metadata: metadata as Prisma.InputJsonValue,
            lastSyncStartedAt: null,
            lastSyncedAt: accountChanged ? null : existing.lastSyncedAt,
            lastSyncStatus: recoveredSyncStatus,
            lastSyncError: null,
          },
        });
      }

      return tx.artistPlatformInsightsConnection.create({
        data: {
          artistId,
          platform: 'spotify',
          connectionMethod: 'reference',
          status: 'connected',
          displayName: validation.displayName,
          externalAccountId: validation.externalAccountId,
          externalHandle: null,
          externalUrl: validation.externalUrl,
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null,
          scopes: [],
          metadata: metadata as Prisma.InputJsonValue,
          lastSyncStatus: 'never',
        },
      });
    });

    this.auditService.log({
      actorId: userId,
      action: existing
        ? 'insights.spotify_connection.update'
        : 'insights.spotify_connection.create',
      entityType: 'artist_platform_insights_connection',
      entityId: savedConnection.id,
      metadata: {
        artistId,
        platform: 'spotify',
        externalAccountId: validation.externalAccountId,
        externalUrl: validation.externalUrl,
        accountChanged,
      },
      ipAddress,
    });

    return this.mapConnection(savedConnection as InsightsConnectionRecord)!;
  }

  async syncSpotifyConnection(
    artistId: string,
    userId: string,
    ipAddress?: string,
  ): Promise<SpotifyInsightsSyncResult> {
    await this.membershipService.validateAccess(userId, artistId, 'write');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'stage_link_insights');

    const connection = await this.prisma.artistPlatformInsightsConnection.findFirst({
      where: {
        artistId,
        platform: 'spotify',
      },
    });

    if (!connection || !connection.externalAccountId) {
      throw new BadRequestException('Connect a Spotify artist before syncing insights');
    }

    const startedAt = new Date();
    await this.prisma.artistPlatformInsightsConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncStartedAt: startedAt,
        lastSyncStatus: 'pending',
        lastSyncError: null,
      },
    });

    try {
      const snapshot = await this.spotifyProvider.syncLatestSnapshot({
        externalAccountId: connection.externalAccountId,
        externalHandle: connection.externalHandle,
        externalUrl: connection.externalUrl,
        metadata: this.readJsonObject(connection.metadata),
      });

      const capturedAt = new Date(snapshot.capturedAt);
      if (Number.isNaN(capturedAt.getTime())) {
        throw new ServiceUnavailableException('Spotify returned an invalid snapshot timestamp');
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const savedSnapshot = await tx.artistPlatformInsightsSnapshot.create({
          data: {
            artistId,
            connectionId: connection.id,
            platform: 'spotify',
            capturedAt,
            profile: snapshot.profile as Prisma.InputJsonValue,
            metrics: snapshot.metrics as Prisma.InputJsonValue,
            topContent: snapshot.topContent as unknown as Prisma.InputJsonValue,
            notes: [],
          },
        });

        const updatedConnection = await tx.artistPlatformInsightsConnection.update({
          where: { id: connection.id },
          data: {
            status: 'connected',
            displayName: snapshot.profile.displayName,
            externalUrl: snapshot.profile.externalUrl,
            lastSyncStartedAt: startedAt,
            lastSyncedAt: capturedAt,
            lastSyncStatus: 'success',
            lastSyncError: null,
            metadata: {
              ...(this.readJsonObject(connection.metadata) ?? {}),
              imageUrl: snapshot.profile.imageUrl,
            } as Prisma.InputJsonValue,
          },
        });

        return {
          connection: updatedConnection as InsightsConnectionRecord,
          snapshot: savedSnapshot as InsightsSnapshotRecord,
        };
      });

      this.auditService.log({
        actorId: userId,
        action: 'insights.spotify_connection.sync',
        entityType: 'artist_platform_insights_connection',
        entityId: connection.id,
        metadata: {
          artistId,
          platform: 'spotify',
          capturedAt: snapshot.capturedAt,
        },
        ipAddress,
      });

      return {
        ok: true,
        platform: 'spotify',
        message: 'Spotify Insights synced successfully',
        connection: this.mapConnection(result.connection)!,
        snapshot: this.mapSnapshot(result.snapshot)!,
      };
    } catch (error) {
      const normalizedError =
        error instanceof HttpException
          ? error
          : new ServiceUnavailableException('Could not sync Spotify insights right now');
      const message =
        normalizedError instanceof Error
          ? normalizedError.message
          : 'Could not sync Spotify insights right now';

      await this.prisma.artistPlatformInsightsConnection.update({
        where: { id: connection.id },
        data: {
          status: 'connected',
          lastSyncStartedAt: startedAt,
          lastSyncStatus: 'error',
          lastSyncError: message,
        },
      });

      this.auditService.log({
        actorId: userId,
        action: 'insights.spotify_connection.sync_failed',
        entityType: 'artist_platform_insights_connection',
        entityId: connection.id,
        metadata: {
          artistId,
          platform: 'spotify',
          message,
        },
        ipAddress,
      });

      throw normalizedError;
    }
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

  private mapHistoryPoint(snapshot: InsightsSnapshotRecord): StageLinkInsightsHistoryPoint {
    return {
      capturedAt: snapshot.capturedAt.toISOString(),
      metrics: this.readMetrics(snapshot.metrics),
    };
  }

  private readStringArray(value: Prisma.JsonValue): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === 'string');
  }

  private readJsonObject(value: Prisma.JsonValue): Record<string, unknown> | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
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

  private resolveDateRange(raw?: string): StageLinkInsightsDateRange {
    if (
      raw &&
      (STAGELINK_INSIGHTS_DATE_RANGES as readonly string[]).includes(
        raw as StageLinkInsightsDateRange,
      )
    ) {
      return raw as StageLinkInsightsDateRange;
    }

    return DEFAULT_INSIGHTS_RANGE;
  }

  private resolveRangeStart(range: StageLinkInsightsDateRange): Date | null {
    if (range === 'all') {
      return null;
    }

    const now = new Date();
    const start = new Date(now);

    if (range === '7d') {
      start.setDate(start.getDate() - 7);
      return start;
    }

    if (range === '30d') {
      start.setDate(start.getDate() - 30);
      return start;
    }

    start.setDate(start.getDate() - 90);
    return start;
  }
}
