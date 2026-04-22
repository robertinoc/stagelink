import { ServiceUnavailableException } from '@nestjs/common';
import { YouTubeInsightsProvider } from './youtube-insights.provider';

describe('YouTubeInsightsProvider', () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env['YOUTUBE_DATA_API_KEY'];

  beforeEach(() => {
    process.env['YOUTUBE_DATA_API_KEY'] = 'youtube-api-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env['YOUTUBE_DATA_API_KEY'] = originalApiKey;
  });

  it('validates youtube channels by handle', async () => {
    const provider = new YouTubeInsightsProvider();
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
              snippet: {
                title: 'Google for Developers',
                customUrl: '@googledevelopers',
                thumbnails: {
                  high: { url: 'https://img.youtube.com/channel.jpg' },
                },
              },
              statistics: {
                subscriberCount: '2890000',
                viewCount: '218000000',
                videoCount: '6200',
                hiddenSubscriberCount: false,
              },
              contentDetails: {
                relatedPlaylists: {
                  uploads: 'UUX5XG1OV2P6uZZ5FSM9Ttw',
                },
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    ) as typeof fetch;

    await expect(
      provider.validateChannelReference('https://www.youtube.com/@googledevelopers'),
    ).resolves.toMatchObject({
      ok: true,
      platform: 'youtube',
      externalAccountId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
      externalHandle: 'googledevelopers',
      displayName: 'Google for Developers',
      externalUrl: 'https://www.youtube.com/@googledevelopers',
      subscriberCount: 2890000,
      totalViews: 218000000,
      videoCount: 6200,
      subscribersHidden: false,
    });
  });

  it('syncs channel metrics and recent videos', async () => {
    const provider = new YouTubeInsightsProvider();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
                snippet: {
                  title: 'Google for Developers',
                  customUrl: '@googledevelopers',
                  thumbnails: {
                    high: { url: 'https://img.youtube.com/channel.jpg' },
                  },
                },
                statistics: {
                  subscriberCount: '2890000',
                  viewCount: '218000000',
                  videoCount: '6200',
                  hiddenSubscriberCount: false,
                },
                contentDetails: {
                  relatedPlaylists: {
                    uploads: 'UUX5XG1OV2P6uZZ5FSM9Ttw',
                  },
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                contentDetails: { videoId: 'video-1' },
              },
              {
                contentDetails: { videoId: 'video-2' },
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                id: 'video-1',
                snippet: {
                  title: 'Recent upload 1',
                  publishedAt: '2026-04-22T12:00:00.000Z',
                  thumbnails: {
                    medium: { url: 'https://img.youtube.com/video-1.jpg' },
                  },
                },
                statistics: {
                  viewCount: '12000',
                },
              },
              {
                id: 'video-2',
                snippet: {
                  title: 'Recent upload 2',
                  publishedAt: '2026-04-21T12:00:00.000Z',
                  thumbnails: {
                    medium: { url: 'https://img.youtube.com/video-2.jpg' },
                  },
                },
                statistics: {
                  viewCount: '5400',
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ) as typeof fetch;

    await expect(
      provider.syncLatestSnapshot({
        externalAccountId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
        externalHandle: 'googledevelopers',
        externalUrl: null,
        metadata: null,
      }),
    ).resolves.toMatchObject({
      platform: 'youtube',
      metrics: {
        subscriber_count: 2890000,
        total_views: 218000000,
        video_count: 6200,
        recent_videos_count: 2,
        subscribers_hidden: false,
      },
      topContent: [
        expect.objectContaining({
          externalId: 'video-1',
          title: 'Recent upload 1',
          metricLabel: 'Views',
          metricValue: '12000',
        }),
        expect.objectContaining({
          externalId: 'video-2',
          title: 'Recent upload 2',
          metricLabel: 'Views',
          metricValue: '5400',
        }),
      ],
    });
  });

  it('degrades recent videos gracefully when the secondary request fails', async () => {
    const provider = new YouTubeInsightsProvider();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
                snippet: {
                  title: 'Google for Developers',
                },
                statistics: {
                  subscriberCount: '2890000',
                  viewCount: '218000000',
                  videoCount: '6200',
                  hiddenSubscriberCount: false,
                },
                contentDetails: {
                  relatedPlaylists: {
                    uploads: 'UUX5XG1OV2P6uZZ5FSM9Ttw',
                  },
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              code: 403,
              message: 'Quota exceeded',
            },
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ) as typeof fetch;

    await expect(
      provider.syncLatestSnapshot({
        externalAccountId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
        externalHandle: null,
        externalUrl: null,
        metadata: null,
      }),
    ).resolves.toMatchObject({
      platform: 'youtube',
      metrics: expect.objectContaining({
        recent_videos_count: 0,
      }),
      topContent: [],
    });
  });

  it('returns a useful service error when youtube cannot be reached', async () => {
    const provider = new YouTubeInsightsProvider();
    global.fetch = jest.fn().mockRejectedValue(new Error('socket hang up')) as typeof fetch;

    await expect(
      provider.validateChannelReference('https://www.youtube.com/@googledevelopers'),
    ).rejects.toThrow(new ServiceUnavailableException('Could not reach YouTube right now'));
  });
});
