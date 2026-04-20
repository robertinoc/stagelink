import { InsightsService } from './insights.service';

describe('InsightsService', () => {
  const prisma = {
    artistPlatformInsightsConnection: {
      findMany: jest.fn(),
    },
    artistPlatformInsightsSnapshot: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const billingEntitlementsService = {
    assertFeatureAccess: jest.fn(),
  };

  const spotifyProvider = {
    getCapabilities: jest.fn(() => ({
      platform: 'spotify',
      connectionMethod: 'reference',
      connectionFlowReady: false,
      requiresArtistOwnedAccount: false,
      profileBasics: 'full',
      audienceMetrics: 'partial',
      topContent: 'full',
      historicalSnapshots: 'partial',
      scheduledSync: 'partial',
    })),
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
  };

  let service: InsightsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InsightsService(
      prisma as never,
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
        artistId: 'artist_123',
        platform: 'spotify',
        connectionMethod: 'reference',
        status: 'connected',
        displayName: 'Robertino on Spotify',
        externalAccountId: 'spotify:artist:1',
        externalHandle: 'robertino',
        externalUrl: 'https://open.spotify.com/artist/1',
        scopes: [],
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
          followers: 1200,
          popularity: 47,
        },
        topContent: [
          {
            externalId: 'track-1',
            title: 'Afterglow',
            metricLabel: 'Streams',
            metricValue: '84,200',
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
      followers: 1200,
      popularity: 47,
    });
    expect(spotify?.latestSnapshot?.topContent).toHaveLength(1);
  });
});
