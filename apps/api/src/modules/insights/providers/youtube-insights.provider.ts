import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import type {
  StageLinkInsightsPlatformCapabilities,
  StageLinkInsightsSnapshot,
  YouTubeInsightsConnectionValidationResult,
} from '@stagelink/types';
import type {
  PlatformInsightsConnectionContext,
  PlatformInsightsProvider,
} from './insights-provider.interface';
import {
  buildYouTubeChannelUrl,
  normalizeYouTubeChannelReference,
  YOUTUBE_INSIGHTS_RECENT_VIDEOS_LIMIT,
} from './youtube-insights.helpers';

interface YouTubeApiListResponse<T> {
  items?: T[];
}

interface YouTubeChannelResponse {
  id: string;
  snippet?: {
    title?: string;
    customUrl?: string;
    thumbnails?: {
      default?: { url?: string };
      medium?: { url?: string };
      high?: { url?: string };
    };
  };
  statistics?: {
    subscriberCount?: string;
    hiddenSubscriberCount?: boolean;
    viewCount?: string;
    videoCount?: string;
  };
  contentDetails?: {
    relatedPlaylists?: {
      uploads?: string;
    };
  };
}

interface YouTubePlaylistItemResponse {
  snippet?: {
    title?: string;
    publishedAt?: string;
    thumbnails?: {
      default?: { url?: string };
      medium?: { url?: string };
      high?: { url?: string };
    };
    resourceId?: {
      videoId?: string;
    };
  };
  contentDetails?: {
    videoId?: string;
    videoPublishedAt?: string;
  };
}

interface YouTubeVideoResponse {
  id: string;
  snippet?: {
    title?: string;
    publishedAt?: string;
    thumbnails?: {
      default?: { url?: string };
      medium?: { url?: string };
      high?: { url?: string };
    };
  };
  statistics?: {
    viewCount?: string;
  };
}

interface YouTubeChannelSummary {
  channelId: string;
  displayName: string;
  externalHandle: string | null;
  externalUrl: string;
  imageUrl: string | null;
  subscriberCount: number | null;
  totalViews: number | null;
  videoCount: number | null;
  subscribersHidden: boolean;
  uploadsPlaylistId: string | null;
}

@Injectable()
export class YouTubeInsightsProvider implements PlatformInsightsProvider {
  readonly platform = 'youtube' as const;
  readonly connectionMethod = 'reference' as const;

  getCapabilities(): StageLinkInsightsPlatformCapabilities {
    const configured = this.isConfigured();

    return {
      platform: this.platform,
      connectionMethod: this.connectionMethod,
      connectionFlowReady: configured,
      requiresArtistOwnedAccount: false,
      profileBasics: 'full',
      audienceMetrics: 'partial',
      topContent: 'partial',
      historicalSnapshots: 'partial',
      scheduledSync: 'partial',
    };
  }

  async validateChannelReference(
    channelInput: string,
  ): Promise<YouTubeInsightsConnectionValidationResult> {
    this.assertConfigured();
    const reference = normalizeYouTubeChannelReference(channelInput);
    const channel =
      reference.kind === 'channel_id'
        ? await this.fetchChannelById(reference.value)
        : await this.fetchChannelByHandle(reference.value);
    const summary = this.buildChannelSummary(
      channel,
      reference.kind === 'handle' ? reference.value : null,
    );

    return {
      ok: true,
      platform: 'youtube',
      externalAccountId: summary.channelId,
      externalHandle: summary.externalHandle,
      displayName: summary.displayName,
      externalUrl: summary.externalUrl,
      imageUrl: summary.imageUrl,
      subscriberCount: summary.subscriberCount,
      totalViews: summary.totalViews,
      videoCount: summary.videoCount,
      subscribersHidden: summary.subscribersHidden,
      message: `Connected to ${summary.displayName} on YouTube`,
    };
  }

  async syncLatestSnapshot(
    context: PlatformInsightsConnectionContext,
  ): Promise<StageLinkInsightsSnapshot> {
    this.assertConfigured();

    const channelId = context.externalAccountId?.trim();
    if (!channelId) {
      throw new BadRequestException('YouTube connection is missing a channel ID');
    }

    const channel = await this.fetchChannelById(channelId);
    const summary = this.buildChannelSummary(channel, context.externalHandle);
    const recentVideos = await this.fetchRecentVideosSafe(summary.uploadsPlaylistId);

    return {
      platform: this.platform,
      capturedAt: new Date().toISOString(),
      profile: {
        displayName: summary.displayName,
        imageUrl: summary.imageUrl,
        externalUrl: summary.externalUrl,
      },
      metrics: {
        subscriber_count: summary.subscriberCount,
        total_views: summary.totalViews,
        video_count: summary.videoCount,
        recent_videos_count: recentVideos.length,
        subscribers_hidden: summary.subscribersHidden,
      },
      topContent: recentVideos.map((video) => ({
        platform: this.platform,
        externalId: video.id,
        title: video.snippet?.title ?? 'Untitled video',
        subtitle: video.snippet?.publishedAt ?? null,
        metricLabel: 'Views',
        metricValue: this.readCount(video.statistics?.viewCount),
        imageUrl: this.readThumbnail(video.snippet?.thumbnails),
        externalUrl: `https://www.youtube.com/watch?v=${video.id}`,
      })),
    };
  }

  private isConfigured(): boolean {
    return Boolean(process.env['YOUTUBE_DATA_API_KEY']?.trim());
  }

  private assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'YouTube Insights is not configured on this deployment yet',
      );
    }
  }

  private async fetchChannelById(channelId: string): Promise<YouTubeChannelResponse> {
    const response = await this.youtubeRequest<YouTubeApiListResponse<YouTubeChannelResponse>>(
      '/channels',
      new URLSearchParams({
        part: 'snippet,statistics,contentDetails',
        id: channelId,
      }),
    );

    const channel = response.items?.[0];
    if (!channel) {
      throw new BadRequestException('YouTube channel could not be found');
    }

    return channel;
  }

  private async fetchChannelByHandle(handle: string): Promise<YouTubeChannelResponse> {
    const response = await this.youtubeRequest<YouTubeApiListResponse<YouTubeChannelResponse>>(
      '/channels',
      new URLSearchParams({
        part: 'snippet,statistics,contentDetails',
        forHandle: handle,
      }),
    );

    const channel = response.items?.[0];
    if (!channel) {
      throw new BadRequestException('YouTube channel could not be found');
    }

    return channel;
  }

  private async fetchRecentVideosSafe(
    uploadsPlaylistId: string | null,
  ): Promise<YouTubeVideoResponse[]> {
    if (!uploadsPlaylistId) {
      return [];
    }

    try {
      return await this.fetchRecentVideos(uploadsPlaylistId);
    } catch (error) {
      if (error instanceof ServiceUnavailableException || error instanceof BadRequestException) {
        return [];
      }

      throw error;
    }
  }

  private async fetchRecentVideos(uploadsPlaylistId: string): Promise<YouTubeVideoResponse[]> {
    const playlistResponse = await this.youtubeRequest<
      YouTubeApiListResponse<YouTubePlaylistItemResponse>
    >(
      '/playlistItems',
      new URLSearchParams({
        part: 'snippet,contentDetails',
        playlistId: uploadsPlaylistId,
        maxResults: String(YOUTUBE_INSIGHTS_RECENT_VIDEOS_LIMIT),
      }),
    );

    const playlistItems = Array.isArray(playlistResponse.items) ? playlistResponse.items : [];
    const videoIds = playlistItems
      .map((item) => item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId ?? null)
      .filter((videoId): videoId is string => typeof videoId === 'string' && videoId.length > 0);

    if (videoIds.length === 0) {
      return [];
    }

    const videosResponse = await this.youtubeRequest<YouTubeApiListResponse<YouTubeVideoResponse>>(
      '/videos',
      new URLSearchParams({
        part: 'snippet,statistics',
        id: videoIds.join(','),
        maxResults: String(videoIds.length),
      }),
    );

    const videos = Array.isArray(videosResponse.items) ? videosResponse.items : [];
    const videosById = new Map(videos.map((video) => [video.id, video]));

    return videoIds
      .map((videoId) => videosById.get(videoId) ?? null)
      .filter((video): video is YouTubeVideoResponse => Boolean(video));
  }

  private async youtubeRequest<T>(path: string, params: URLSearchParams): Promise<T> {
    const apiKey = process.env['YOUTUBE_DATA_API_KEY']?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException('YouTube Data API key is missing on this deployment');
    }

    params.set('key', apiKey);

    let response: Response;
    try {
      response = await fetch(`https://www.googleapis.com/youtube/v3${path}?${params.toString()}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
    } catch {
      throw new ServiceUnavailableException('Could not reach YouTube right now');
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new ServiceUnavailableException(
        `YouTube API request failed (${response.status})${body ? `: ${body}` : ''}`,
      );
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new ServiceUnavailableException('YouTube returned an unreadable response');
    }
  }

  private buildChannelSummary(
    channel: YouTubeChannelResponse,
    fallbackHandle?: string | null,
  ): YouTubeChannelSummary {
    const externalHandle = this.readHandle(channel.snippet?.customUrl, fallbackHandle);

    return {
      channelId: channel.id,
      displayName: channel.snippet?.title ?? 'YouTube channel',
      externalHandle,
      externalUrl: buildYouTubeChannelUrl(channel.id, externalHandle),
      imageUrl: this.readThumbnail(channel.snippet?.thumbnails),
      subscriberCount: channel.statistics?.hiddenSubscriberCount
        ? null
        : this.readCountAsNumber(channel.statistics?.subscriberCount),
      totalViews: this.readCountAsNumber(channel.statistics?.viewCount),
      videoCount: this.readCountAsNumber(channel.statistics?.videoCount),
      subscribersHidden: Boolean(channel.statistics?.hiddenSubscriberCount),
      uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads ?? null,
    };
  }

  private readHandle(value?: string | null, fallbackHandle?: string | null): string | null {
    const fallback = fallbackHandle?.trim().replace(/^@/, '');
    if (fallback) {
      return fallback;
    }

    const candidate = value?.trim() ?? '';
    if (!candidate.startsWith('@')) {
      return null;
    }

    return candidate.replace(/^@/, '');
  }

  private readThumbnail(
    thumbnails?: {
      default?: { url?: string };
      medium?: { url?: string };
      high?: { url?: string };
    } | null,
  ): string | null {
    return thumbnails?.high?.url ?? thumbnails?.medium?.url ?? thumbnails?.default?.url ?? null;
  }

  private readCountAsNumber(value?: string | null): number | null {
    if (!value) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private readCount(value?: string | null): string {
    return value && value.trim() ? value : '—';
  }
}
