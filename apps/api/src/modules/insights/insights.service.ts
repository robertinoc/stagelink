import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type {
  InsightsSyncHealth,
  InsightsSyncHealthItem,
  SoundCloudInsightsConnectionValidationResult,
  SoundCloudInsightsSyncResult,
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
  YouTubeInsightsConnectionValidationResult,
  YouTubeInsightsSyncResult,
} from '@stagelink/types';
import { STAGELINK_INSIGHTS_DATE_RANGES, STAGELINK_INSIGHTS_PLATFORMS } from '@stagelink/types';
import { PrismaService } from '../../lib/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BillingEntitlementsService } from '../billing/billing-entitlements.service';
import { MembershipService } from '../membership/membership.service';
import {
  SoundCloudInsightsConnectionDto,
  SpotifyInsightsConnectionDto,
  YouTubeInsightsConnectionDto,
} from './dto';
import {
  SYNC_BATCH_STAGGER_MS,
  SYNC_CONCURRENT_GUARD_MS,
  SYNC_PROVIDER_TIMEOUT_MS,
  SYNC_SCHEDULED_MIN_INTERVAL_MS,
  SYNC_STALE_THRESHOLD_MS,
} from './insights-metrics.constants';
import type { PlatformInsightsProvider } from './providers/insights-provider.interface';
import { SoundCloudInsightsProvider } from './providers/soundcloud-insights.provider';
import { SpotifyInsightsProvider } from './providers/spotify-insights.provider';
import { YouTubeInsightsProvider } from './providers/youtube-insights.provider';

// ---------------------------------------------------------------------------
// Internal record types (shape coming out of Prisma)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Module-level constants
// ---------------------------------------------------------------------------

const DEFAULT_INSIGHTS_RANGE: StageLinkInsightsDateRange = '30d';
const MAX_INSIGHTS_HISTORY_POINTS = 180;

// STALE_THRESHOLD_MS is imported as SYNC_STALE_THRESHOLD_MS from insights-metrics.constants

// Re-export for use by scheduler (avoids importing constants directly)
export { SYNC_BATCH_STAGGER_MS, SYNC_SCHEDULED_MIN_INTERVAL_MS };

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);
  private readonly providers: Record<StageLinkInsightsPlatform, PlatformInsightsProvider>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
    private readonly auditService: AuditService,
    private readonly billingEntitlementsService: BillingEntitlementsService,
    private readonly spotifyProvider: SpotifyInsightsProvider,
    private readonly youTubeProvider: YouTubeInsightsProvider,
    private readonly soundCloudProvider: SoundCloudInsightsProvider,
  ) {
    this.providers = {
      spotify: this.spotifyProvider,
      youtube: this.youTubeProvider,
      soundcloud: this.soundCloudProvider,
    };
  }

  // =========================================================================
  // Dashboard
  // =========================================================================

  async getDashboard(artistId: string, rangeInput?: string): Promise<StageLinkInsightsDashboard> {
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'stage_link_insights');
    const selectedRange = this.resolveDateRange(rangeInput);
    const rangeStart = this.resolveRangeStart(selectedRange);
    const snapshotWhere: Prisma.ArtistPlatformInsightsSnapshotWhereInput = rangeStart
      ? { artistId, capturedAt: { gte: rangeStart } }
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
      this.prisma.artistPlatformInsightsSnapshot.count({ where: snapshotWhere }),
    ]);

    const connectionsByPlatform = new Map<StageLinkInsightsPlatform, InsightsConnectionRecord>();
    connections.forEach((c) =>
      connectionsByPlatform.set(
        c.platform as StageLinkInsightsPlatform,
        c as InsightsConnectionRecord,
      ),
    );

    const latestSnapshots = new Map<StageLinkInsightsPlatform, InsightsSnapshotRecord>();
    snapshots.forEach((s) => {
      const platform = s.platform as StageLinkInsightsPlatform;
      if (!latestSnapshots.has(platform)) {
        latestSnapshots.set(platform, s as InsightsSnapshotRecord);
      }
    });

    const historyByPlatform = new Map<StageLinkInsightsPlatform, StageLinkInsightsHistoryPoint[]>();
    [...snapshots].reverse().forEach((s) => {
      const platform = s.platform as StageLinkInsightsPlatform;
      const current = historyByPlatform.get(platform) ?? [];
      current.push(this.mapHistoryPoint(s as InsightsSnapshotRecord));
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
      (p) => p.connection?.status === 'connected',
    ).length;
    const syncedPlatforms = platformSummaries.filter(
      (p) =>
        p.connection?.lastSyncStatus === 'success' || p.connection?.lastSyncStatus === 'partial',
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

  // =========================================================================
  // Sync health (admin / dev utility)
  // =========================================================================

  async getSyncHealth(artistId: string): Promise<InsightsSyncHealth> {
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'stage_link_insights');

    const connections = await this.prisma.artistPlatformInsightsConnection.findMany({
      where: { artistId, status: 'connected' },
      orderBy: [{ platform: 'asc' }],
    });

    const now = Date.now();
    const items: InsightsSyncHealthItem[] = connections.map((conn) => {
      const lastSyncedMs = conn.lastSyncedAt ? conn.lastSyncedAt.getTime() : null;
      const isStale = lastSyncedMs === null || now - lastSyncedMs > SYNC_STALE_THRESHOLD_MS;
      return {
        artistId: conn.artistId,
        connectionId: conn.id,
        platform: conn.platform as StageLinkInsightsPlatform,
        connectionStatus: conn.status as InsightsSyncHealthItem['connectionStatus'],
        lastSyncStatus: conn.lastSyncStatus as InsightsSyncHealthItem['lastSyncStatus'],
        lastSyncedAt: conn.lastSyncedAt?.toISOString() ?? null,
        lastSyncError: conn.lastSyncError,
        isStale,
      };
    });

    return {
      artistId,
      checkedAt: new Date().toISOString(),
      items,
      staleCount: items.filter((i) => i.isStale).length,
      errorCount: items.filter((i) => i.lastSyncStatus === 'error').length,
    };
  }

  // =========================================================================
  // Spotify
  // =========================================================================

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
      where: { artistId, platform: 'spotify' },
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
            lastSyncStatus: this.recoverSyncStatus(
              accountChanged,
              existing.lastSyncedAt,
              existing.lastSyncStatus as InsightsConnectionRecord['lastSyncStatus'],
            ),
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

    const connection = await this.findConnectedConnection(artistId, 'spotify');
    const { connection: conn, snapshot } = await this.syncConnectionCore(
      connection,
      this.spotifyProvider,
      userId,
      ipAddress,
    );
    return {
      ok: true,
      platform: 'spotify',
      message: 'Spotify Insights synced successfully',
      connection: conn,
      snapshot,
    };
  }

  // =========================================================================
  // YouTube
  // =========================================================================

  async validateYouTubeConnection(
    artistId: string,
    dto: YouTubeInsightsConnectionDto,
    userId: string,
  ): Promise<YouTubeInsightsConnectionValidationResult> {
    await this.membershipService.validateAccess(userId, artistId, 'write');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'stage_link_insights');

    const expectedChannel = await this.resolveProfileYouTubeChannel(artistId);
    const validation = await this.youTubeProvider.validateChannelReference(dto.channelInput);
    this.assertMatchingYouTubeChannel(expectedChannel, validation);
    return validation;
  }

  async updateYouTubeConnection(
    artistId: string,
    dto: YouTubeInsightsConnectionDto,
    userId: string,
    ipAddress?: string,
  ): Promise<StageLinkInsightsConnection> {
    await this.membershipService.validateAccess(userId, artistId, 'write');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'stage_link_insights');

    const expectedChannel = await this.resolveProfileYouTubeChannel(artistId);
    const validation = await this.youTubeProvider.validateChannelReference(dto.channelInput);
    this.assertMatchingYouTubeChannel(expectedChannel, validation);

    const existing = await this.prisma.artistPlatformInsightsConnection.findFirst({
      where: { artistId, platform: 'youtube' },
    });
    const accountChanged = existing?.externalAccountId !== validation.externalAccountId;
    const metadata = {
      imageUrl: validation.imageUrl,
      subscriberCount: validation.subscriberCount,
      totalViews: validation.totalViews,
      videoCount: validation.videoCount,
      subscribersHidden: validation.subscribersHidden,
      source: 'youtube-data-api',
    } satisfies Record<string, unknown>;

    const savedConnection = await this.prisma.$transaction(async (tx) => {
      if (existing && accountChanged) {
        await tx.artistPlatformInsightsSnapshot.deleteMany({
          where: { connectionId: existing.id },
        });
      }
      if (existing) {
        return tx.artistPlatformInsightsConnection.update({
          where: { id: existing.id },
          data: {
            connectionMethod: 'reference',
            status: 'connected',
            displayName: validation.displayName,
            externalAccountId: validation.externalAccountId,
            externalHandle: validation.externalHandle,
            externalUrl: validation.externalUrl,
            accessToken: null,
            refreshToken: null,
            tokenExpiresAt: null,
            scopes: [],
            metadata: metadata as Prisma.InputJsonValue,
            lastSyncStartedAt: null,
            lastSyncedAt: accountChanged ? null : existing.lastSyncedAt,
            lastSyncStatus: this.recoverSyncStatus(
              accountChanged,
              existing.lastSyncedAt,
              existing.lastSyncStatus as InsightsConnectionRecord['lastSyncStatus'],
            ),
            lastSyncError: null,
          },
        });
      }
      return tx.artistPlatformInsightsConnection.create({
        data: {
          artistId,
          platform: 'youtube',
          connectionMethod: 'reference',
          status: 'connected',
          displayName: validation.displayName,
          externalAccountId: validation.externalAccountId,
          externalHandle: validation.externalHandle,
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
        ? 'insights.youtube_connection.update'
        : 'insights.youtube_connection.create',
      entityType: 'artist_platform_insights_connection',
      entityId: savedConnection.id,
      metadata: {
        artistId,
        platform: 'youtube',
        externalAccountId: validation.externalAccountId,
        externalHandle: validation.externalHandle,
        accountChanged,
      },
      ipAddress,
    });
    return this.mapConnection(savedConnection as InsightsConnectionRecord)!;
  }

  async syncYouTubeConnection(
    artistId: string,
    userId: string,
    ipAddress?: string,
  ): Promise<YouTubeInsightsSyncResult> {
    await this.membershipService.validateAccess(userId, artistId, 'write');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'stage_link_insights');

    const connection = await this.findConnectedConnection(artistId, 'youtube');
    const expectedChannel = await this.resolveProfileYouTubeChannel(artistId);
    this.assertMatchingConnectedYouTubeChannel(connection, expectedChannel);

    const { connection: conn, snapshot } = await this.syncConnectionCore(
      connection,
      this.youTubeProvider,
      userId,
      ipAddress,
    );
    return {
      ok: true,
      platform: 'youtube',
      message: 'YouTube Insights synced successfully',
      connection: conn,
      snapshot,
    };
  }

  // =========================================================================
  // SoundCloud
  // =========================================================================

  async validateSoundCloudConnection(
    artistId: string,
    dto: SoundCloudInsightsConnectionDto,
    userId: string,
  ): Promise<SoundCloudInsightsConnectionValidationResult> {
    await this.membershipService.validateAccess(userId, artistId, 'write');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'stage_link_insights');
    return this.soundCloudProvider.validateProfileReference(dto.profileInput);
  }

  async updateSoundCloudConnection(
    artistId: string,
    dto: SoundCloudInsightsConnectionDto,
    userId: string,
    ipAddress?: string,
  ): Promise<StageLinkInsightsConnection> {
    await this.membershipService.validateAccess(userId, artistId, 'write');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'stage_link_insights');

    const validation = await this.soundCloudProvider.validateProfileReference(dto.profileInput);
    const existing = await this.prisma.artistPlatformInsightsConnection.findFirst({
      where: { artistId, platform: 'soundcloud' },
    });
    const accountChanged = existing?.externalAccountId !== validation.externalAccountId;
    const metadata = {
      imageUrl: validation.imageUrl,
      followersCount: validation.followersCount,
      trackCount: validation.trackCount,
      source: 'soundcloud-public-api-v2',
    } satisfies Record<string, unknown>;

    const savedConnection = await this.prisma.$transaction(async (tx) => {
      if (existing && accountChanged) {
        await tx.artistPlatformInsightsSnapshot.deleteMany({
          where: { connectionId: existing.id },
        });
      }
      if (existing) {
        return tx.artistPlatformInsightsConnection.update({
          where: { id: existing.id },
          data: {
            connectionMethod: 'reference',
            status: 'connected',
            displayName: validation.displayName,
            externalAccountId: validation.externalAccountId,
            externalHandle: validation.externalHandle,
            externalUrl: validation.externalUrl,
            accessToken: null,
            refreshToken: null,
            tokenExpiresAt: null,
            scopes: [],
            metadata: metadata as Prisma.InputJsonValue,
            lastSyncStartedAt: null,
            lastSyncedAt: accountChanged ? null : existing.lastSyncedAt,
            lastSyncStatus: this.recoverSyncStatus(
              accountChanged,
              existing.lastSyncedAt,
              existing.lastSyncStatus as InsightsConnectionRecord['lastSyncStatus'],
            ),
            lastSyncError: null,
          },
        });
      }
      return tx.artistPlatformInsightsConnection.create({
        data: {
          artistId,
          platform: 'soundcloud',
          connectionMethod: 'reference',
          status: 'connected',
          displayName: validation.displayName,
          externalAccountId: validation.externalAccountId,
          externalHandle: validation.externalHandle,
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
        ? 'insights.soundcloud_connection.update'
        : 'insights.soundcloud_connection.create',
      entityType: 'artist_platform_insights_connection',
      entityId: savedConnection.id,
      metadata: {
        artistId,
        platform: 'soundcloud',
        externalAccountId: validation.externalAccountId,
        externalHandle: validation.externalHandle,
        accountChanged,
      },
      ipAddress,
    });
    return this.mapConnection(savedConnection as InsightsConnectionRecord)!;
  }

  async syncSoundCloudConnection(
    artistId: string,
    userId: string,
    ipAddress?: string,
  ): Promise<SoundCloudInsightsSyncResult> {
    await this.membershipService.validateAccess(userId, artistId, 'write');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'stage_link_insights');

    const connection = await this.findConnectedConnection(artistId, 'soundcloud');
    const { connection: conn, snapshot } = await this.syncConnectionCore(
      connection,
      this.soundCloudProvider,
      userId,
      ipAddress,
    );
    return {
      ok: true,
      platform: 'soundcloud',
      message: 'SoundCloud Insights synced successfully',
      connection: conn,
      snapshot,
    };
  }

  // =========================================================================
  // Scheduled-sync entry points (called by InsightsSyncScheduler)
  // =========================================================================

  /**
   * Returns all connected insights connections across all artists that are due
   * for a scheduled sync (lastSyncedAt is null or older than SYNC_SCHEDULED_MIN_INTERVAL_MS).
   */
  async findConnectionsDueForScheduledSync(): Promise<InsightsConnectionRecord[]> {
    const threshold = new Date(Date.now() - SYNC_SCHEDULED_MIN_INTERVAL_MS);
    const connections = await this.prisma.artistPlatformInsightsConnection.findMany({
      where: {
        status: 'connected',
        externalAccountId: { not: null },
        OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: threshold } }],
      },
      orderBy: [{ lastSyncedAt: 'asc' }],
    });
    return connections as InsightsConnectionRecord[];
  }

  /**
   * Sync a single connection by its record — used by the scheduler.
   * Bypasses membership + billing checks (system-level operation).
   * Errors are swallowed and logged so the scheduler continues the batch.
   */
  async syncConnectionByRecord(connection: InsightsConnectionRecord): Promise<boolean> {
    const provider = this.providers[connection.platform];
    if (!provider) {
      this.logger.warn(`[scheduler] No provider for platform ${connection.platform} — skipping`);
      return false;
    }
    try {
      await this.syncConnectionCore(connection, provider, null, undefined);
      this.logger.log(
        `[scheduler] Synced ${connection.platform} for artist ${connection.artistId}`,
      );
      return true;
    } catch (error) {
      // Errors are already persisted to DB inside syncConnectionCore.
      this.logger.warn(
        `[scheduler] Sync failed for ${connection.platform}/${connection.artistId}: ${String(error)}`,
      );
      return false;
    }
  }

  // =========================================================================
  // Core sync engine
  // =========================================================================

  /**
   * Single source of truth for all sync operations across all platforms.
   *
   * Guards:
   *   - Concurrent sync: blocks if lastSyncStatus='pending' within SYNC_CONCURRENT_GUARD_MS
   *   - Timeout: cancels provider call after SYNC_PROVIDER_TIMEOUT_MS
   *
   * Status logic:
   *   - 'success'  → metrics OK AND topContent present
   *   - 'partial'  → metrics OK BUT topContent empty (provider best-effort failed)
   *   - 'error'    → exception thrown (snapshot NOT stored, error written to connection)
   *
   * @param actorId  User ID for audit logging; null for scheduled syncs
   */
  private async syncConnectionCore(
    connection: InsightsConnectionRecord,
    provider: PlatformInsightsProvider,
    actorId: string | null,
    ipAddress?: string,
  ): Promise<{ connection: StageLinkInsightsConnection; snapshot: StageLinkInsightsSnapshot }> {
    const platformLabel = connection.platform;
    // Human-readable name for user-facing messages (e.g. 'Spotify' not 'spotify')
    const platformDisplayName: Record<StageLinkInsightsPlatform, string> = {
      spotify: 'Spotify',
      youtube: 'YouTube',
      soundcloud: 'SoundCloud',
    };
    const platformName = platformDisplayName[platformLabel] ?? platformLabel;

    // 1. Concurrent sync guard
    if (connection.lastSyncStatus === 'pending' && connection.lastSyncStartedAt) {
      const msSinceStart = Date.now() - connection.lastSyncStartedAt.getTime();
      if (msSinceStart < SYNC_CONCURRENT_GUARD_MS) {
        throw new ConflictException(
          `A sync is already in progress for this ${platformName} connection. ` +
            `Wait a moment before trying again.`,
        );
      }
    }

    // 2. Mark pending
    const startedAt = new Date();
    await this.prisma.artistPlatformInsightsConnection.update({
      where: { id: connection.id },
      data: { lastSyncStartedAt: startedAt, lastSyncStatus: 'pending', lastSyncError: null },
    });

    try {
      // 3. Provider call with hard timeout
      const snapshot = await this.fetchWithTimeout(
        provider.syncLatestSnapshot({
          externalAccountId: connection.externalAccountId,
          externalHandle: connection.externalHandle,
          externalUrl: connection.externalUrl,
          metadata: this.readJsonObject(connection.metadata),
        }),
        SYNC_PROVIDER_TIMEOUT_MS,
        `${platformName} sync timed out after ${SYNC_PROVIDER_TIMEOUT_MS / 1000}s`,
      );

      const capturedAt = new Date(snapshot.capturedAt);
      if (Number.isNaN(capturedAt.getTime())) {
        throw new ServiceUnavailableException(
          `${platformName} returned an invalid snapshot timestamp`,
        );
      }

      // 4. Partial-sync detection
      // All providers silently degrade topContent to [] on fetch errors.
      // An empty topContent with valid metrics → 'partial' (best-effort failure).
      const hasMetrics = Object.keys(snapshot.metrics).length > 0;
      const hasTopContent = snapshot.topContent.length > 0;
      const syncStatus: 'success' | 'partial' =
        hasMetrics && !hasTopContent ? 'partial' : 'success';

      if (syncStatus === 'partial') {
        this.logger.warn(
          `[sync] Partial sync for ${platformLabel}/${connection.artistId}: metrics OK, topContent empty`,
        );
      }

      // 5. Atomic persist
      const result = await this.prisma.$transaction(async (tx) => {
        const savedSnapshot = await tx.artistPlatformInsightsSnapshot.create({
          data: {
            artistId: connection.artistId,
            connectionId: connection.id,
            platform: connection.platform,
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
            lastSyncStatus: syncStatus,
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

      // 6. Audit (skipped for scheduled syncs to avoid log noise)
      if (actorId) {
        this.auditService.log({
          actorId,
          action: `insights.${platformLabel}_connection.sync`,
          entityType: 'artist_platform_insights_connection',
          entityId: connection.id,
          metadata: {
            artistId: connection.artistId,
            platform: platformLabel,
            capturedAt: snapshot.capturedAt,
            syncStatus,
          },
          ipAddress,
        });
      }

      return {
        connection: this.mapConnection(result.connection)!,
        snapshot: this.mapSnapshot(result.snapshot)!,
      };
    } catch (error) {
      // 7. Error path — persist failure, re-throw
      const normalizedError =
        error instanceof HttpException
          ? error
          : new ServiceUnavailableException(`Could not sync ${platformName} insights right now`);
      const message =
        normalizedError instanceof Error
          ? normalizedError.message
          : `Could not sync ${platformLabel} insights right now`;
      // Truncate before DB storage to prevent large stack traces from bloating
      // the connection record. The full error is already captured by the NestJS
      // logger above and is available in the server log stream for debugging.
      const storedMessage = message.slice(0, 500);

      await this.prisma.artistPlatformInsightsConnection.update({
        where: { id: connection.id },
        data: {
          status: 'connected',
          lastSyncStartedAt: startedAt,
          lastSyncStatus: 'error',
          lastSyncError: storedMessage,
        },
      });

      if (actorId) {
        this.auditService.log({
          actorId,
          action: `insights.${platformLabel}_connection.sync_failed`,
          entityType: 'artist_platform_insights_connection',
          entityId: connection.id,
          metadata: {
            artistId: connection.artistId,
            platform: platformLabel,
            message: storedMessage,
          },
          ipAddress,
        });
      }

      throw normalizedError;
    }
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  private async findConnectedConnection(
    artistId: string,
    platform: StageLinkInsightsPlatform,
  ): Promise<InsightsConnectionRecord> {
    const connection = await this.prisma.artistPlatformInsightsConnection.findFirst({
      where: { artistId, platform },
    });
    if (!connection || !connection.externalAccountId) {
      const displayNames: Record<StageLinkInsightsPlatform, string> = {
        spotify: 'Spotify',
        youtube: 'YouTube',
        soundcloud: 'SoundCloud',
      };
      throw new BadRequestException(
        `Connect a ${displayNames[platform] ?? platform} account before syncing insights`,
      );
    }
    return connection as InsightsConnectionRecord;
  }

  private fetchWithTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        // .unref() prevents this timer from keeping the Node.js event loop alive
        // during tests and graceful shutdowns.
        const timer = setTimeout(() => reject(new ServiceUnavailableException(message)), ms);
        timer.unref();
      }),
    ]);
  }

  private recoverSyncStatus(
    accountChanged: boolean,
    lastSyncedAt: Date | null,
    currentSyncStatus: InsightsConnectionRecord['lastSyncStatus'],
  ): InsightsConnectionRecord['lastSyncStatus'] {
    if (accountChanged || !lastSyncedAt) return 'never';
    if (currentSyncStatus === 'error') return 'success';
    return currentSyncStatus;
  }

  private async resolveProfileYouTubeChannel(
    artistId: string,
  ): Promise<YouTubeInsightsConnectionValidationResult> {
    const artist = await this.prisma.artist.findUniqueOrThrow({
      where: { id: artistId },
      select: { youtubeUrl: true },
    });
    if (!artist.youtubeUrl) {
      throw new BadRequestException(
        'Add your YouTube channel to your artist profile before using YouTube Insights',
      );
    }
    try {
      return await this.youTubeProvider.validateChannelReference(artist.youtubeUrl);
    } catch (error) {
      if (error instanceof HttpException) {
        throw new BadRequestException(
          'Update the YouTube URL in your artist profile before using YouTube Insights',
        );
      }
      throw error;
    }
  }

  private assertMatchingYouTubeChannel(
    expected: YouTubeInsightsConnectionValidationResult,
    actual: YouTubeInsightsConnectionValidationResult,
  ) {
    if (expected.externalAccountId !== actual.externalAccountId) {
      throw new BadRequestException(
        'YouTube Insights can only connect the same channel saved in your artist profile',
      );
    }
  }

  private assertMatchingConnectedYouTubeChannel(
    connection: InsightsConnectionRecord,
    expected: YouTubeInsightsConnectionValidationResult,
  ) {
    if (connection.externalAccountId !== expected.externalAccountId) {
      throw new BadRequestException(
        'Your connected YouTube channel no longer matches the one saved in your artist profile. ' +
          'Update the connection from your profile link and try again.',
      );
    }
  }

  // =========================================================================
  // Mapping helpers
  // =========================================================================

  private mapConnection(
    connection: InsightsConnectionRecord | null,
  ): StageLinkInsightsConnection | null {
    if (!connection) return null;
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
    if (!snapshot) return null;
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
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
  }

  private readJsonObject(value: Prisma.JsonValue): Record<string, unknown> | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
  }

  private readProfile(value: Prisma.JsonValue): StageLinkInsightsSnapshot['profile'] {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return { displayName: null, imageUrl: null, externalUrl: null };
    }
    const p = value as Record<string, unknown>;
    return {
      displayName: typeof p['displayName'] === 'string' ? p['displayName'] : null,
      imageUrl: typeof p['imageUrl'] === 'string' ? p['imageUrl'] : null,
      externalUrl: typeof p['externalUrl'] === 'string' ? p['externalUrl'] : null,
    };
  }

  private readMetrics(value: Prisma.JsonValue): Record<string, string | number | boolean | null> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
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
    if (!Array.isArray(value)) return [];
    return value.reduce<StageLinkInsightsTopContentItem[]>((acc, item) => {
      if (typeof item !== 'object' || item === null || Array.isArray(item)) return acc;
      const c = item as Record<string, unknown>;
      if (typeof c['externalId'] !== 'string' || typeof c['title'] !== 'string') return acc;
      acc.push({
        platform,
        externalId: c['externalId'],
        title: c['title'],
        subtitle: typeof c['subtitle'] === 'string' ? c['subtitle'] : null,
        metricLabel: typeof c['metricLabel'] === 'string' ? c['metricLabel'] : 'Metric',
        metricValue:
          typeof c['metricValue'] === 'string' ? c['metricValue'] : String(c['metricValue'] ?? ''),
        imageUrl: typeof c['imageUrl'] === 'string' ? c['imageUrl'] : null,
        externalUrl: typeof c['externalUrl'] === 'string' ? c['externalUrl'] : null,
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
    if (range === 'all') return null;
    const start = new Date();
    if (range === '7d') start.setDate(start.getDate() - 7);
    else if (range === '30d') start.setDate(start.getDate() - 30);
    else start.setDate(start.getDate() - 90);
    return start;
  }
}
