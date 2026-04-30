import { InsightsService } from './insights.service';
import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';

describe('InsightsService', () => {
  const prisma = {
    artist: {
      findUniqueOrThrow: jest.fn(),
    },
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
      connectionMethod: 'reference',
      connectionFlowReady: true,
      requiresArtistOwnedAccount: false,
      profileBasics: 'full',
      audienceMetrics: 'partial',
      topContent: 'partial',
      historicalSnapshots: 'partial',
      scheduledSync: 'partial',
    })),
    validateChannelReference: jest.fn(),
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
    prisma.artist.findUniqueOrThrow.mockResolvedValue({
      youtubeUrl: 'https://www.youtube.com/@googledevelopers',
    });
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
    expect(result.selectedRange).toBe('30d');
    expect(result.platforms).toHaveLength(3);
    expect(result.platforms.every((platform) => platform.connection === null)).toBe(true);
    expect(result.platforms.every((platform) => platform.history.length === 0)).toBe(true);
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
    expect(spotify?.history).toEqual([
      {
        capturedAt: '2026-04-20T10:05:00.000Z',
        metrics: {
          followers_total: 1200,
          popularity: 47,
        },
      },
    ]);
  });

  it('filters snapshots by selected range', async () => {
    prisma.artistPlatformInsightsConnection.findMany.mockResolvedValue([]);
    prisma.artistPlatformInsightsSnapshot.findMany.mockResolvedValue([]);
    prisma.artistPlatformInsightsSnapshot.count.mockResolvedValue(0);

    await service.getDashboard('artist_123', '7d');

    expect(prisma.artistPlatformInsightsSnapshot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          artistId: 'artist_123',
          capturedAt: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
      }),
    );
    expect(prisma.artistPlatformInsightsSnapshot.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          artistId: 'artist_123',
          capturedAt: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
      }),
    );
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

  it('clears stale sync errors when spotify connection is updated successfully', async () => {
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
      lastSyncStatus: 'error',
      lastSyncError: 'Spotify API request failed (403)',
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
      externalAccountId: data.externalAccountId ?? 'spotify-artist-id',
      externalHandle: null,
      externalUrl: data.externalUrl ?? 'https://open.spotify.com/artist/spotify-artist-id',
      scopes: [],
      metadata: data.metadata ?? {},
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      lastSyncStartedAt: data.lastSyncStartedAt ?? null,
      lastSyncedAt: data.lastSyncedAt ?? null,
      lastSyncStatus: data.lastSyncStatus ?? 'never',
      lastSyncError: data.lastSyncError ?? null,
      createdAt: new Date('2026-04-19T10:00:00.000Z'),
      updatedAt: new Date('2026-04-20T10:00:00.000Z'),
    }));

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

    const result = await service.updateSpotifyConnection(
      'artist_123',
      { artistInput: 'https://open.spotify.com/artist/spotify-artist-id' },
      'user_123',
    );

    expect(result.lastSyncStatus).toBe('never');
    expect(result.lastSyncError).toBeNull();
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
          status: 'connected',
          lastSyncStatus: 'error',
          lastSyncError: 'Could not sync Spotify insights right now',
        }),
      }),
    );
  });

  it('validates youtube references through membership, billing, and provider validation', async () => {
    youTubeProvider.validateChannelReference.mockResolvedValue({
      ok: true,
      platform: 'youtube',
      externalAccountId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
      externalHandle: 'googledevelopers',
      displayName: 'Google for Developers',
      externalUrl: 'https://www.youtube.com/@googledevelopers',
      imageUrl: null,
      subscriberCount: 2890000,
      totalViews: 218000000,
      videoCount: 6200,
      subscribersHidden: false,
      message: 'Connected to Google for Developers on YouTube',
    });

    const result = await service.validateYouTubeConnection(
      'artist_123',
      { channelInput: 'https://www.youtube.com/@googledevelopers' },
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
    expect(prisma.artist.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'artist_123' },
      select: { youtubeUrl: true },
    });
    expect(youTubeProvider.validateChannelReference).toHaveBeenCalledWith(
      'https://www.youtube.com/@googledevelopers',
    );
    expect(youTubeProvider.validateChannelReference).toHaveBeenCalledWith(
      'https://www.youtube.com/@googledevelopers',
    );
    expect(result.displayName).toBe('Google for Developers');
  });

  it('rejects youtube validation when the requested channel does not match the artist profile', async () => {
    youTubeProvider.validateChannelReference
      .mockResolvedValueOnce({
        ok: true,
        platform: 'youtube',
        externalAccountId: 'UC_profile',
        externalHandle: 'robertinoc',
        displayName: 'RobertinoC',
        externalUrl: 'https://www.youtube.com/@robertinoc',
        imageUrl: null,
        subscriberCount: null,
        totalViews: null,
        videoCount: null,
        subscribersHidden: false,
        message: 'Connected to RobertinoC on YouTube',
      })
      .mockResolvedValueOnce({
        ok: true,
        platform: 'youtube',
        externalAccountId: 'UC_other',
        externalHandle: 'martincirio',
        displayName: 'Martin Cirio',
        externalUrl: 'https://www.youtube.com/@martincirio',
        imageUrl: null,
        subscriberCount: null,
        totalViews: null,
        videoCount: null,
        subscribersHidden: false,
        message: 'Connected to Martin Cirio on YouTube',
      });

    await expect(
      service.validateYouTubeConnection(
        'artist_123',
        { channelInput: 'https://www.youtube.com/@martincirio' },
        'user_123',
      ),
    ).rejects.toThrow(
      new BadRequestException(
        'YouTube Insights can only connect the same channel saved in your artist profile',
      ),
    );
  });

  it('updates youtube connections and resets stale sync errors', async () => {
    prisma.artistPlatformInsightsConnection.findFirst.mockResolvedValue({
      id: 'conn_youtube',
      artistId: 'artist_123',
      platform: 'youtube',
      connectionMethod: 'reference',
      status: 'connected',
      displayName: 'Google for Developers',
      externalAccountId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
      externalHandle: 'googledevelopers',
      externalUrl: 'https://www.youtube.com/@googledevelopers',
      scopes: [],
      metadata: {},
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      lastSyncStartedAt: null,
      lastSyncedAt: null,
      lastSyncStatus: 'error',
      lastSyncError: 'YouTube API request failed (403)',
      createdAt: new Date('2026-04-19T10:00:00.000Z'),
      updatedAt: new Date('2026-04-20T10:00:00.000Z'),
    });

    prisma.artistPlatformInsightsConnection.update.mockImplementation(async ({ data }) => ({
      id: 'conn_youtube',
      artistId: 'artist_123',
      platform: 'youtube',
      connectionMethod: 'reference',
      status: data.status ?? 'connected',
      displayName: data.displayName ?? 'Google for Developers',
      externalAccountId: data.externalAccountId ?? 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
      externalHandle: data.externalHandle ?? 'googledevelopers',
      externalUrl: data.externalUrl ?? 'https://www.youtube.com/@googledevelopers',
      scopes: [],
      metadata: data.metadata ?? {},
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      lastSyncStartedAt: data.lastSyncStartedAt ?? null,
      lastSyncedAt: data.lastSyncedAt ?? null,
      lastSyncStatus: data.lastSyncStatus ?? 'never',
      lastSyncError: data.lastSyncError ?? null,
      createdAt: new Date('2026-04-19T10:00:00.000Z'),
      updatedAt: new Date('2026-04-20T10:00:00.000Z'),
    }));

    youTubeProvider.validateChannelReference.mockResolvedValue({
      ok: true,
      platform: 'youtube',
      externalAccountId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
      externalHandle: 'googledevelopers',
      displayName: 'Google for Developers',
      externalUrl: 'https://www.youtube.com/@googledevelopers',
      imageUrl: null,
      subscriberCount: 2890000,
      totalViews: 218000000,
      videoCount: 6200,
      subscribersHidden: false,
      message: 'Connected to Google for Developers on YouTube',
    });

    const result = await service.updateYouTubeConnection(
      'artist_123',
      { channelInput: 'https://www.youtube.com/@googledevelopers' },
      'user_123',
    );

    expect(result.lastSyncStatus).toBe('never');
    expect(result.lastSyncError).toBeNull();
  });

  it('syncs youtube snapshots and updates connection sync metadata', async () => {
    prisma.artistPlatformInsightsConnection.findFirst.mockResolvedValue({
      id: 'conn_youtube',
      artistId: 'artist_123',
      platform: 'youtube',
      connectionMethod: 'reference',
      status: 'connected',
      displayName: 'Google for Developers',
      externalAccountId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
      externalHandle: 'googledevelopers',
      externalUrl: 'https://www.youtube.com/@googledevelopers',
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
      id: 'conn_youtube',
      artistId: 'artist_123',
      platform: 'youtube',
      connectionMethod: 'reference',
      status: data.status ?? 'connected',
      displayName: data.displayName ?? 'Google for Developers',
      externalAccountId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
      externalHandle: 'googledevelopers',
      externalUrl: data.externalUrl ?? 'https://www.youtube.com/@googledevelopers',
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

    youTubeProvider.syncLatestSnapshot.mockResolvedValue({
      platform: 'youtube',
      capturedAt: '2026-04-22T12:00:00.000Z',
      profile: {
        displayName: 'Google for Developers',
        imageUrl: 'https://img.youtube.com/channel.jpg',
        externalUrl: 'https://www.youtube.com/@googledevelopers',
      },
      metrics: {
        subscriber_count: 2890000,
        total_views: 218000000,
        video_count: 6200,
        recent_videos_count: 2,
      },
      topContent: [
        {
          platform: 'youtube',
          externalId: 'video-1',
          title: 'Recent upload 1',
          subtitle: '2026-04-22T12:00:00.000Z',
          metricLabel: 'Views',
          metricValue: '12000',
          imageUrl: null,
          externalUrl: 'https://www.youtube.com/watch?v=video-1',
        },
      ],
    });

    const result = await service.syncYouTubeConnection('artist_123', 'user_123');

    expect(membershipService.validateAccess).toHaveBeenCalledWith(
      'user_123',
      'artist_123',
      'write',
    );
    expect(result.ok).toBe(true);
    expect(result.connection.lastSyncStatus).toBe('success');
    expect(result.snapshot.metrics.subscriber_count).toBe(2890000);
    expect(auditService.log).toHaveBeenCalled();
  });

  it('rejects youtube sync when the saved connection no longer matches the artist profile', async () => {
    prisma.artistPlatformInsightsConnection.findFirst.mockResolvedValue({
      id: 'conn_youtube',
      artistId: 'artist_123',
      platform: 'youtube',
      connectionMethod: 'reference',
      status: 'connected',
      displayName: 'Martin Cirio',
      externalAccountId: 'UC_other',
      externalHandle: 'martincirio',
      externalUrl: 'https://www.youtube.com/@martincirio',
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

    youTubeProvider.validateChannelReference.mockResolvedValue({
      ok: true,
      platform: 'youtube',
      externalAccountId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
      externalHandle: 'googledevelopers',
      displayName: 'Google for Developers',
      externalUrl: 'https://www.youtube.com/@googledevelopers',
      imageUrl: null,
      subscriberCount: 2890000,
      totalViews: 218000000,
      videoCount: 6200,
      subscribersHidden: false,
      message: 'Connected to Google for Developers on YouTube',
    });

    await expect(service.syncYouTubeConnection('artist_123', 'user_123')).rejects.toThrow(
      new BadRequestException(
        'Your connected YouTube channel no longer matches the one saved in your artist profile. Update the connection from your profile link and try again.',
      ),
    );
  });

  // ===========================================================================
  // EPIC 4 — Sync engine hardening
  // ===========================================================================

  describe('concurrent sync guard', () => {
    it('throws ConflictException when a sync is already pending and started recently', async () => {
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
        // Simulate a pending sync started 30 seconds ago
        lastSyncStartedAt: new Date(Date.now() - 30_000),
        lastSyncedAt: null,
        lastSyncStatus: 'pending',
        lastSyncError: null,
        createdAt: new Date('2026-04-19T10:00:00.000Z'),
        updatedAt: new Date('2026-04-20T10:00:00.000Z'),
      });

      await expect(service.syncSpotifyConnection('artist_123', 'user_123')).rejects.toThrow(
        ConflictException,
      );

      // Should NOT have marked a new pending sync
      expect(prisma.artistPlatformInsightsConnection.update).not.toHaveBeenCalled();
    });

    it('allows a new sync when the pending guard window has expired', async () => {
      // lastSyncStartedAt is 10 minutes ago — beyond the 2-minute guard window
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
        lastSyncStartedAt: new Date(Date.now() - 10 * 60_000),
        lastSyncedAt: null,
        lastSyncStatus: 'pending', // still shows pending from the stale run
        lastSyncError: null,
        createdAt: new Date('2026-04-19T10:00:00.000Z'),
        updatedAt: new Date('2026-04-20T10:00:00.000Z'),
      });

      const mockSnapshot = {
        platform: 'spotify' as const,
        capturedAt: new Date().toISOString(),
        profile: {
          displayName: 'Robertino',
          imageUrl: null,
          externalUrl: 'https://open.spotify.com/artist/spotify-artist-id',
        },
        metrics: { followers_total: 10000, popularity: 60, genres_count: 2, top_tracks_count: 5 },
        topContent: [
          {
            platform: 'spotify',
            externalId: 't1',
            title: 'Track 1',
            subtitle: null,
            metricLabel: 'Popularity',
            metricValue: '80',
            imageUrl: null,
            externalUrl: null,
          },
        ],
      };
      spotifyProvider.syncLatestSnapshot.mockResolvedValue(mockSnapshot);

      const mockUpdatedConn = {
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
        lastSyncStartedAt: new Date(),
        lastSyncedAt: new Date(),
        lastSyncStatus: 'success',
        lastSyncError: null,
        createdAt: new Date('2026-04-19T10:00:00.000Z'),
        updatedAt: new Date(),
      };
      prisma.$transaction.mockImplementation(
        async (cb: (tx: typeof prisma) => Promise<unknown>) => {
          const tx = {
            artistPlatformInsightsSnapshot: {
              create: jest.fn().mockResolvedValue({
                platform: 'spotify',
                capturedAt: new Date(),
                profile: {},
                metrics: {},
                topContent: [],
              }),
            },
            artistPlatformInsightsConnection: {
              update: jest.fn().mockResolvedValue(mockUpdatedConn),
            },
          };
          return cb(tx as never);
        },
      );

      const result = await service.syncSpotifyConnection('artist_123', 'user_123');
      expect(result.ok).toBe(true);
    });
  });

  describe('partial sync status', () => {
    it('marks sync as partial when metrics are present but topContent is empty', async () => {
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

      // Provider returns snapshot with metrics but no topContent (best-effort failure)
      spotifyProvider.syncLatestSnapshot.mockResolvedValue({
        platform: 'spotify' as const,
        capturedAt: new Date().toISOString(),
        profile: {
          displayName: 'Robertino',
          imageUrl: null,
          externalUrl: 'https://open.spotify.com/artist/spotify-artist-id',
        },
        metrics: { followers_total: 10000, popularity: 60, genres_count: 2, top_tracks_count: 0 },
        topContent: [], // empty — best-effort failure
      });

      let capturedSyncStatus: string | undefined;
      prisma.$transaction.mockImplementation(
        async (cb: (tx: typeof prisma) => Promise<unknown>) => {
          const savedSnapshot = {
            platform: 'spotify',
            capturedAt: new Date(),
            profile: {},
            metrics: {},
            topContent: [],
          };
          const tx = {
            artistPlatformInsightsSnapshot: { create: jest.fn().mockResolvedValue(savedSnapshot) },
            artistPlatformInsightsConnection: {
              update: jest
                .fn()
                .mockImplementation((args: { data: { lastSyncStatus?: string } }) => {
                  capturedSyncStatus = args.data.lastSyncStatus;
                  return Promise.resolve({
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
                    lastSyncStartedAt: new Date(),
                    lastSyncedAt: new Date(),
                    lastSyncStatus: 'partial',
                    lastSyncError: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  });
                }),
            },
          };
          return cb(tx as never);
        },
      );

      const result = await service.syncSpotifyConnection('artist_123', 'user_123');

      expect(capturedSyncStatus).toBe('partial');
      expect(result.connection.lastSyncStatus).toBe('partial');
    });

    it('marks sync as success when both metrics and topContent are present', async () => {
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

      spotifyProvider.syncLatestSnapshot.mockResolvedValue({
        platform: 'spotify' as const,
        capturedAt: new Date().toISOString(),
        profile: {
          displayName: 'Robertino',
          imageUrl: null,
          externalUrl: 'https://open.spotify.com/artist/spotify-artist-id',
        },
        metrics: { followers_total: 10000 },
        topContent: [
          {
            platform: 'spotify',
            externalId: 't1',
            title: 'Track 1',
            subtitle: null,
            metricLabel: 'Popularity',
            metricValue: '80',
            imageUrl: null,
            externalUrl: null,
          },
        ],
      });

      let capturedSyncStatus: string | undefined;
      prisma.$transaction.mockImplementation(
        async (cb: (tx: typeof prisma) => Promise<unknown>) => {
          const savedSnapshot = {
            platform: 'spotify',
            capturedAt: new Date(),
            profile: {},
            metrics: {},
            topContent: [],
          };
          const tx = {
            artistPlatformInsightsSnapshot: { create: jest.fn().mockResolvedValue(savedSnapshot) },
            artistPlatformInsightsConnection: {
              update: jest
                .fn()
                .mockImplementation((args: { data: { lastSyncStatus?: string } }) => {
                  capturedSyncStatus = args.data.lastSyncStatus;
                  return Promise.resolve({
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
                    lastSyncStartedAt: new Date(),
                    lastSyncedAt: new Date(),
                    lastSyncStatus: 'success',
                    lastSyncError: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  });
                }),
            },
          };
          return cb(tx as never);
        },
      );

      await service.syncSpotifyConnection('artist_123', 'user_123');
      expect(capturedSyncStatus).toBe('success');
    });
  });

  describe('scheduled sync jobs', () => {
    it('finds connected stale connections for scheduled retry processing', async () => {
      const staleErroredConnection = {
        id: 'conn_error',
        artistId: 'artist_123',
        platform: 'spotify',
        status: 'connected',
        externalAccountId: 'spotify_artist_123',
        lastSyncedAt: new Date('2026-04-20T00:00:00.000Z'),
        lastSyncStatus: 'error',
        lastSyncError: 'Spotify API quota exceeded',
      };
      prisma.artistPlatformInsightsConnection.findMany.mockResolvedValue([staleErroredConnection]);

      const result = await service.findConnectionsDueForScheduledSync();

      expect(prisma.artistPlatformInsightsConnection.findMany).toHaveBeenCalledWith({
        where: {
          status: 'connected',
          externalAccountId: { not: null },
          OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: expect.any(Date) } }],
        },
        orderBy: [{ lastSyncedAt: 'asc' }],
      });
      expect(result).toEqual([staleErroredConnection]);
    });

    it('returns true when the scheduled job syncs a connection successfully', async () => {
      const connection = {
        id: 'conn_spotify',
        artistId: 'artist_123',
        platform: 'spotify',
        status: 'connected',
        connectionMethod: 'reference',
        displayName: 'Stage Artist',
        externalAccountId: 'spotify_artist_123',
        externalHandle: null,
        externalUrl: null,
        scopes: [],
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        metadata: {},
        lastSyncStartedAt: null,
        lastSyncedAt: null,
        lastSyncStatus: 'never',
        lastSyncError: null,
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
        updatedAt: new Date('2026-04-01T00:00:00.000Z'),
      };

      spotifyProvider.syncLatestSnapshot.mockResolvedValue({
        capturedAt: '2026-04-30T10:00:00.000Z',
        profile: {
          displayName: 'Stage Artist',
          externalUrl: 'https://open.spotify.com/artist/123',
          imageUrl: 'https://cdn.example.com/artist.jpg',
        },
        metrics: { followers: 1000 },
        topContent: [{ title: 'Lead Single' }],
      });

      prisma.artistPlatformInsightsSnapshot.create.mockResolvedValue({
        id: 'snapshot_123',
        artistId: 'artist_123',
        connectionId: 'conn_spotify',
        platform: 'spotify',
        capturedAt: new Date('2026-04-30T10:00:00.000Z'),
        profile: {},
        metrics: {},
        topContent: [],
        notes: [],
      });
      prisma.artistPlatformInsightsConnection.update
        .mockResolvedValueOnce({ ...connection, lastSyncStatus: 'pending' })
        .mockResolvedValueOnce({
          ...connection,
          displayName: 'Stage Artist',
          externalUrl: 'https://open.spotify.com/artist/123',
          lastSyncedAt: new Date('2026-04-30T10:00:00.000Z'),
          lastSyncStatus: 'success',
          updatedAt: new Date('2026-04-30T10:00:00.000Z'),
        });

      await expect(service.syncConnectionByRecord(connection as never)).resolves.toBe(true);

      expect(spotifyProvider.syncLatestSnapshot).toHaveBeenCalledWith({
        externalAccountId: 'spotify_artist_123',
        externalHandle: null,
        externalUrl: null,
        metadata: {},
      });
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('returns false and persists failure metadata when a scheduled provider sync fails', async () => {
      const connection = {
        id: 'conn_spotify',
        artistId: 'artist_123',
        platform: 'spotify',
        status: 'connected',
        externalAccountId: 'spotify_artist_123',
        externalHandle: null,
        externalUrl: null,
        metadata: {},
        lastSyncStartedAt: null,
        lastSyncedAt: new Date('2026-04-20T00:00:00.000Z'),
        lastSyncStatus: 'error',
        lastSyncError: 'previous failure',
      };

      spotifyProvider.syncLatestSnapshot.mockRejectedValue(new Error('provider unavailable'));

      await expect(service.syncConnectionByRecord(connection as never)).resolves.toBe(false);

      expect(prisma.artistPlatformInsightsConnection.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'conn_spotify' },
        data: {
          lastSyncStartedAt: expect.any(Date),
          lastSyncStatus: 'pending',
          lastSyncError: null,
        },
      });
      expect(prisma.artistPlatformInsightsConnection.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'conn_spotify' },
        data: {
          status: 'connected',
          lastSyncStartedAt: expect.any(Date),
          lastSyncStatus: 'error',
          lastSyncError: 'Could not sync Spotify insights right now',
        },
      });
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('returns false when a queued connection has no registered provider', async () => {
      await expect(
        service.syncConnectionByRecord({
          id: 'conn_unknown',
          artistId: 'artist_123',
          platform: 'unknown',
        } as never),
      ).resolves.toBe(false);

      expect(prisma.artistPlatformInsightsConnection.update).not.toHaveBeenCalled();
    });
  });

  describe('getSyncHealth()', () => {
    it('returns health items for all connected connections', async () => {
      billingEntitlementsService.assertFeatureAccess.mockResolvedValue(undefined);
      const recentDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago (fresh)
      const staleDate = new Date(Date.now() - 30 * 60 * 60 * 1000); // 30 hours ago (stale)

      prisma.artistPlatformInsightsConnection.findMany.mockResolvedValue([
        {
          id: 'conn_spotify',
          artistId: 'artist_123',
          platform: 'spotify',
          status: 'connected',
          lastSyncStatus: 'success',
          lastSyncedAt: recentDate,
          lastSyncError: null,
        },
        {
          id: 'conn_yt',
          artistId: 'artist_123',
          platform: 'youtube',
          status: 'connected',
          lastSyncStatus: 'error',
          lastSyncedAt: staleDate,
          lastSyncError: 'API quota exceeded',
        },
      ]);

      const health = await service.getSyncHealth('artist_123');

      expect(health.artistId).toBe('artist_123');
      expect(health.items).toHaveLength(2);

      const spotifyItem = health.items.find((i) => i.platform === 'spotify')!;
      expect(spotifyItem.isStale).toBe(false);
      expect(spotifyItem.lastSyncStatus).toBe('success');

      const ytItem = health.items.find((i) => i.platform === 'youtube')!;
      expect(ytItem.isStale).toBe(true);
      expect(ytItem.lastSyncStatus).toBe('error');
      expect(ytItem.lastSyncError).toBe('API quota exceeded');

      expect(health.staleCount).toBe(1);
      expect(health.errorCount).toBe(1);
    });

    it('marks connection with null lastSyncedAt as stale', async () => {
      billingEntitlementsService.assertFeatureAccess.mockResolvedValue(undefined);
      prisma.artistPlatformInsightsConnection.findMany.mockResolvedValue([
        {
          id: 'conn_spotify',
          artistId: 'artist_123',
          platform: 'spotify',
          status: 'connected',
          lastSyncStatus: 'never',
          lastSyncedAt: null,
          lastSyncError: null,
        },
      ]);

      const health = await service.getSyncHealth('artist_123');
      expect(health.items[0]!.isStale).toBe(true);
      expect(health.staleCount).toBe(1);
    });
  });
});
