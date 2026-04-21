import { InsightsService } from './insights.service';
import { ServiceUnavailableException } from '@nestjs/common';

describe('InsightsService', () => {
  const prisma = {
    artistPlatformInsightsConnection: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    artistPlatformInsightsSnapshot: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const membershipService = {
    validateAccess: jest.fn(),
  };

  const auditService = {
    log: jest.fn(),
  };

  const billingEntitlementsService = {
    assertFeatureAccess: jest.fn(),
  };

  const spotifyProvider = {
    getCapabilities: jest.fn(() => ({
      platform: 'spotify',
      connectionMethod: 'reference',
      connectionFlowReady: true,
      requiresArtistOwnedAccount: false,
      profileBasics: 'full',
      audienceMetrics: 'partial',
      topContent: 'full',
      historicalSnapshots: 'partial',
      scheduledSync: 'partial',
    })),
    validateArtistReference: jest.fn(),
    syncLatestSnapshot: jest.fn(),
  };

  const youTubeProvider = {
    getCapabilities: jest.fn(() => ({
      platform: 'youtube',
      connectionMethod: 'oauth',
      connectionFlowReady: false,
      requiresArtistOwnedAccount: true,
      profileBasics: 'full',
      audienceMetrics: 'full',
      topContent: 'full',
      historicalSnapshots: 'full',
      scheduledSync: 'full',
    })),
    syncLatestSnapshot: jest.fn(),
  };

  const soundCloudProvider = {
    getCapabilities: jest.fn(() => ({
      platform: 'soundcloud',
      connectionMethod: 'reference',
      connectionFlowReady: false,
      requiresArtistOwnedAccount: false,
      profileBasics: 'full',
      audienceMetrics: 'partial',
      topContent: 'partial',
      historicalSnapshots: 'partial',
      scheduledSync: 'partial',
    })),
    syncLatestSnapshot: jest.fn(),
  };

  let service: InsightsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (callback: (tx: typeof prisma) => unknown) =>
      callback(prisma as never),
    );

    service = new InsightsService(
      prisma as never,
      membershipService as never,
      auditService as never,
      billingEntitlementsService as never,
      spotifyProvider as never,
      youTubeProvider as never,
      soundCloudProvider as never,
    );
  });

  it('returns all supported platforms with disconnected state when no data exists', async () => {
    prisma.artistPlatformInsightsConnection.findMany.mockResolvedValue([]);
    prisma.artistPlatformInsightsSnapshot.findMany.mockResolvedValue([]);
    prisma.artistPlatformInsightsSnapshot.count.mockResolvedValue(0);

    const result = await service.getDashboard('artist_123');

    expect(billingEntitlementsService.assertFeatureAccess).toHaveBeenCalledWith(
      'artist_123',
      'stage_link_insights',
    );
    expect(result.summaryCards).toEqual([
      { id: 'connected_platforms', value: '0' },
      { id: 'synced_platforms', value: '0' },
      { id: 'stored_snapshots', value: '0' },
      { id: 'supported_platforms', value: '3' },
    ]);
    expect(result.platforms).toHaveLength(3);
    expect(result.platforms.every((platform) => platform.connection === null)).toBe(true);
    expect(result.lastUpdatedAt).toBeNull();
  });

  it('maps the latest snapshot per platform and counts connected providers', async () => {
    prisma.artistPlatformInsightsConnection.findMany.mockResolvedValue([
      {
        id: 'conn_spotify',
        artistId: 'artist_123',
        platform: 'spotify',
        connectionMethod: 'reference',
        status: 'connected',
        displayName: 'Robertino on Spotify',
        externalAccountId: 'spotify-artist-id',
        externalHandle: null,
        externalUrl: 'https://open.spotify.com/artist/1',
        scopes: [],
        metadata: {},
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        lastSyncStartedAt: null,
        lastSyncedAt: new Date('2026-04-20T10:00:00.000Z'),
        lastSyncStatus: 'success',
        lastSyncError: null,
        createdAt: new Date('2026-04-19T10:00:00.000Z'),
        updatedAt: new Date('2026-04-20T10:00:00.000Z'),
      },
    ]);
    prisma.artistPlatformInsightsSnapshot.findMany.mockResolvedValue([
      {
        platform: 'spotify',
        capturedAt: new Date('2026-04-20T10:05:00.000Z'),
        profile: {
          displayName: 'Robertino',
          imageUrl: 'https://cdn.example.com/avatar.jpg',
          externalUrl: 'https://open.spotify.com/artist/1',
        },
        metrics: {
          followers_total: 1200,
          popularity: 47,
        },
        topContent: [
          {
            externalId: 'track-1',
            title: 'Afterglow',
            metricLabel: 'Popularity',
            metricValue: '84',
          },
        ],
      },
    ]);
    prisma.artistPlatformInsightsSnapshot.count.mockResolvedValue(1);

    const result = await service.getDashboard('artist_123');

    expect(result.lastUpdatedAt).toBe('2026-04-20T10:05:00.000Z');
    expect(result.summaryCards).toEqual([
      { id: 'connected_platforms', value: '1' },
      { id: 'synced_platforms', value: '1' },
      { id: 'stored_snapshots', value: '1' },
      { id: 'supported_platforms', value: '3' },
    ]);

    const spotify = result.platforms.find((platform) => platform.platform === 'spotify');
    expect(spotify?.connection?.displayName).toBe('Robertino on Spotify');
    expect(spotify?.latestSnapshot?.metrics).toEqual({
      followers_total: 1200,
      popularity: 47,
    });
    expect(spotify?.latestSnapshot?.topContent).toHaveLength(1);
  });

  it('validates spotify references through membership, billing, and provider validation', async () => {
    spotifyProvider.validateArtistReference.mockResolvedValue({
      ok: true,
      platform: 'spotify',
      externalAccountId: 'spotify-artist-id',
      displayName: 'Robertino',
      externalUrl: 'https://open.spotify.com/artist/spotify-artist-id',
      imageUrl: null,
      followersTotal: 1234,
      popularity: 44,
      message: 'Connected to Robertino on Spotify',
    });

    const result = await service.validateSpotifyConnection(
      'artist_123',
      { artistInput: 'https://open.spotify.com/artist/spotify-artist-id' },
      'user_123',
    );

    expect(membershipService.validateAccess).toHaveBeenCalledWith(
      'user_123',
      'artist_123',
      'write',
    );
    expect(billingEntitlementsService.assertFeatureAccess).toHaveBeenCalledWith(
      'artist_123',
      'stage_link_insights',
    );
    expect(spotifyProvider.validateArtistReference).toHaveBeenCalledWith(
      'https://open.spotify.com/artist/spotify-artist-id',
    );
    expect(result.displayName).toBe('Robertino');
  });

  it('syncs spotify snapshots and updates connection sync metadata', async () => {
    prisma.artistPlatformInsightsConnection.findFirst.mockResolvedValue({
      id: 'conn_spotify',
      artistId: 'artist_123',
      platform: 'spotify',
      connectionMethod: 'reference',
      status: 'connected',
      displayName: 'Robertino',
      externalAccountId: 'spotify-artist-id',
      externalHandle: null,
      externalUrl: 'https://open.spotify.com/artist/spotify-artist-id',
      scopes: [],
      metadata: {},
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      lastSyncStartedAt: null,
      lastSyncedAt: null,
      lastSyncStatus: 'never',
      lastSyncError: null,
      createdAt: new Date('2026-04-19T10:00:00.000Z'),
      updatedAt: new Date('2026-04-20T10:00:00.000Z'),
    });

    prisma.artistPlatformInsightsConnection.update.mockImplementation(async ({ data }) => ({
      id: 'conn_spotify',
      artistId: 'artist_123',
      platform: 'spotify',
      connectionMethod: 'reference',
      status: data.status ?? 'connected',
      displayName: data.displayName ?? 'Robertino',
      externalAccountId: 'spotify-artist-id',
      externalHandle: null,
      externalUrl: data.externalUrl ?? 'https://open.spotify.com/artist/spotify-artist-id',
      scopes: [],
      metadata: data.metadata ?? {},
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      lastSyncStartedAt: data.lastSyncStartedAt ?? null,
      lastSyncedAt: data.lastSyncedAt ?? null,
      lastSyncStatus: data.lastSyncStatus ?? 'success',
      lastSyncError: data.lastSyncError ?? null,
      createdAt: new Date('2026-04-19T10:00:00.000Z'),
      updatedAt: new Date('2026-04-20T10:00:00.000Z'),
    }));

    prisma.artistPlatformInsightsSnapshot.create.mockImplementation(async ({ data }) => ({
      platform: data.platform,
      capturedAt: data.capturedAt,
      profile: data.profile,
      metrics: data.metrics,
      topContent: data.topContent,
    }));

    spotifyProvider.syncLatestSnapshot.mockResolvedValue({
      platform: 'spotify',
      capturedAt: '2026-04-20T12:00:00.000Z',
      profile: {
        displayName: 'Robertino',
        imageUrl: 'https://cdn.example.com/artist.jpg',
        externalUrl: 'https://open.spotify.com/artist/spotify-artist-id',
      },
      metrics: {
        followers_total: 6400,
        popularity: 52,
      },
      topContent: [
        {
          platform: 'spotify',
          externalId: 'track_1',
          title: 'Afterglow',
          subtitle: 'Single',
          metricLabel: 'Popularity',
          metricValue: '78',
          imageUrl: null,
          externalUrl: 'https://open.spotify.com/track/track_1',
        },
      ],
    });

    const result = await service.syncSpotifyConnection('artist_123', 'user_123');

    expect(membershipService.validateAccess).toHaveBeenCalledWith(
      'user_123',
      'artist_123',
      'write',
    );
    expect(result.ok).toBe(true);
    expect(result.connection.lastSyncStatus).toBe('success');
    expect(result.snapshot.metrics.followers_total).toBe(6400);
    expect(auditService.log).toHaveBeenCalled();
  });
  it('normalizes unexpected sync failures into a service error', async () => {
    prisma.artistPlatformInsightsConnection.findFirst.mockResolvedValue({
      id: 'conn_spotify',
      artistId: 'artist_123',
      platform: 'spotify',
      connectionMethod: 'reference',
      status: 'connected',
      displayName: 'Robertino',
      externalAccountId: 'spotify-artist-id',
      externalHandle: null,
      externalUrl: 'https://open.spotify.com/artist/spotify-artist-id',
      scopes: [],
      metadata: {},
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      lastSyncStartedAt: null,
      lastSyncedAt: null,
      lastSyncStatus: 'never',
      lastSyncError: null,
      createdAt: new Date('2026-04-19T10:00:00.000Z'),
      updatedAt: new Date('2026-04-20T10:00:00.000Z'),
    });

    prisma.artistPlatformInsightsConnection.update.mockImplementation(async ({ data }) => ({
      id: 'conn_spotify',
      artistId: 'artist_123',
      platform: 'spotify',
      connectionMethod: 'reference',
      status: data.status ?? 'connected',
      displayName: 'Robertino',
      externalAccountId: 'spotify-artist-id',
      externalHandle: null,
      externalUrl: 'https://open.spotify.com/artist/spotify-artist-id',
      scopes: [],
      metadata: data.metadata ?? {},
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      lastSyncStartedAt: data.lastSyncStartedAt ?? null,
      lastSyncedAt: data.lastSyncedAt ?? null,
      lastSyncStatus: data.lastSyncStatus ?? 'error',
      lastSyncError: data.lastSyncError ?? null,
      createdAt: new Date('2026-04-19T10:00:00.000Z'),
      updatedAt: new Date('2026-04-20T10:00:00.000Z'),
    }));

    spotifyProvider.syncLatestSnapshot.mockRejectedValue(new Error('unexpected boom'));

    await expect(service.syncSpotifyConnection('artist_123', 'user_123')).rejects.toThrow(
      new ServiceUnavailableException('Could not sync Spotify insights right now'),
    );

    expect(prisma.artistPlatformInsightsConnection.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'conn_spotify' },
        data: expect.objectContaining({
          lastSyncStatus: 'error',
          lastSyncError: 'Could not sync Spotify insights right now',
        }),
      }),
    );
  });
});
