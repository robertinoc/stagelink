import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import type {
  SpotifyInsightsConnectionValidationResult,
  StageLinkInsightsPlatformCapabilities,
  StageLinkInsightsSnapshot,
} from '@stagelink/types';
import type {
  PlatformInsightsConnectionContext,
  PlatformInsightsProvider,
} from './insights-provider.interface';
import {
  normalizeSpotifyArtistId,
  resolveSpotifyInsightsMarket,
  SPOTIFY_INSIGHTS_TOP_TRACKS_LIMIT,
} from './spotify-insights.helpers';

interface SpotifyAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyImage {
  url: string;
}

interface SpotifyArtistResponse {
  id: string;
  name: string;
  followers?: {
    total?: number;
  };
  popularity?: number;
  genres?: string[];
  images?: SpotifyImage[];
  external_urls?: {
    spotify?: string;
  };
}

interface SpotifyTrackResponse {
  id: string;
  name: string;
  popularity?: number;
  external_urls?: {
    spotify?: string;
  };
  album?: {
    name?: string;
    images?: SpotifyImage[];
  };
}

interface SpotifyTopTracksResponse {
  tracks?: SpotifyTrackResponse[];
}

interface SpotifyConnectionSummary {
  artistId: string;
  displayName: string;
  externalUrl: string;
  imageUrl: string | null;
  followersTotal: number | null;
  popularity: number | null;
  genres: string[];
}

@Injectable()
export class SpotifyInsightsProvider implements PlatformInsightsProvider {
  readonly platform = 'spotify' as const;
  readonly connectionMethod = 'reference' as const;

  private appTokenCache: { accessToken: string; expiresAt: number } | null = null;
  private pendingAppTokenRequest: Promise<string> | null = null;

  getCapabilities(): StageLinkInsightsPlatformCapabilities {
    const configured = this.isConfigured();

    return {
      platform: this.platform,
      connectionMethod: this.connectionMethod,
      connectionFlowReady: configured,
      requiresArtistOwnedAccount: false,
      profileBasics: 'full',
      audienceMetrics: 'partial',
      topContent: 'full',
      historicalSnapshots: 'partial',
      scheduledSync: 'partial',
    };
  }

  async validateArtistReference(
    artistInput: string,
  ): Promise<SpotifyInsightsConnectionValidationResult> {
    this.assertConfigured();
    const artistId = normalizeSpotifyArtistId(artistInput);
    const artist = this.buildArtistSummary(await this.fetchArtist(artistId));

    return {
      ok: true,
      platform: 'spotify',
      externalAccountId: artist.artistId,
      displayName: artist.displayName,
      externalUrl: artist.externalUrl,
      imageUrl: artist.imageUrl,
      followersTotal: artist.followersTotal,
      popularity: artist.popularity,
      message: `Connected to ${artist.displayName} on Spotify`,
    };
  }

  async syncLatestSnapshot(
    context: PlatformInsightsConnectionContext,
  ): Promise<StageLinkInsightsSnapshot> {
    this.assertConfigured();

    const artistId = context.externalAccountId?.trim();
    if (!artistId) {
      throw new BadRequestException('Spotify connection is missing an artist ID');
    }

    const [artist, topTracks] = await Promise.all([
      this.fetchArtist(artistId),
      this.fetchTopTracksSafe(artistId),
    ]);
    const summary = this.buildArtistSummary(artist);
    const genres = summary.genres;
    const tracks = this.readTracks(topTracks);

    return {
      platform: this.platform,
      capturedAt: new Date().toISOString(),
      profile: {
        displayName: summary.displayName,
        imageUrl: summary.imageUrl,
        externalUrl: summary.externalUrl,
      },
      metrics: {
        followers_total: summary.followersTotal,
        popularity: summary.popularity,
        genres_count: genres.length,
        top_tracks_count: tracks.length,
      },
      topContent: tracks.slice(0, SPOTIFY_INSIGHTS_TOP_TRACKS_LIMIT).map((track) => ({
        platform: this.platform,
        externalId: track.id,
        title: track.name,
        subtitle: track.album?.name ?? null,
        metricLabel: 'Popularity',
        metricValue: String(this.readPopularity(track.popularity) ?? ''),
        imageUrl: track.album?.images?.[0]?.url ?? null,
        externalUrl: track.external_urls?.spotify ?? null,
      })),
    };
  }

  private isConfigured(): boolean {
    return Boolean(
      process.env['SPOTIFY_CLIENT_ID']?.trim() && process.env['SPOTIFY_CLIENT_SECRET']?.trim(),
    );
  }

  private assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Spotify Insights is not configured on this deployment yet',
      );
    }
  }

  private async fetchArtist(artistId: string): Promise<SpotifyArtistResponse> {
    return this.spotifyRequest<SpotifyArtistResponse>(`/artists/${artistId}`);
  }

  private async fetchTopTracks(artistId: string): Promise<SpotifyTopTracksResponse> {
    const market = resolveSpotifyInsightsMarket(process.env['SPOTIFY_TOP_TRACKS_MARKET']);
    return this.spotifyRequest<SpotifyTopTracksResponse>(
      `/artists/${artistId}/top-tracks?market=${market}`,
    );
  }

  private async fetchTopTracksSafe(artistId: string): Promise<SpotifyTopTracksResponse> {
    try {
      return await this.fetchTopTracks(artistId);
    } catch (error) {
      if (
        error instanceof ServiceUnavailableException &&
        error.message.includes('Spotify API request failed (403)')
      ) {
        return { tracks: [] };
      }

      throw error;
    }
  }

  private async spotifyRequest<T>(path: string): Promise<T> {
    const accessToken = await this.getAppAccessToken();

    let response: Response;
    try {
      response = await fetch(`https://api.spotify.com/v1${path}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      throw new ServiceUnavailableException('Could not reach Spotify right now');
    }

    if (response.status === 404) {
      throw new BadRequestException('Spotify artist could not be found');
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new ServiceUnavailableException(
        `Spotify API request failed (${response.status})${body ? `: ${body}` : ''}`,
      );
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new ServiceUnavailableException('Spotify returned an unreadable response');
    }
  }

  private async getAppAccessToken(): Promise<string> {
    const cachedToken = this.appTokenCache;
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
      return cachedToken.accessToken;
    }

    if (this.pendingAppTokenRequest) {
      return this.pendingAppTokenRequest;
    }
    const clientId = process.env['SPOTIFY_CLIENT_ID']?.trim();
    const clientSecret = process.env['SPOTIFY_CLIENT_SECRET']?.trim();
    if (!clientId || !clientSecret) {
      throw new ServiceUnavailableException(
        'Spotify client credentials are missing on this deployment',
      );
    }

    this.pendingAppTokenRequest = (async () => {
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      let response: Response;
      try {
        response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
        });
      } catch {
        throw new ServiceUnavailableException('Could not reach Spotify auth right now');
      }

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new ServiceUnavailableException(
          `Spotify auth token request failed (${response.status})${body ? `: ${body}` : ''}`,
        );
      }

      let payload: SpotifyAuthResponse;
      try {
        payload = (await response.json()) as SpotifyAuthResponse;
      } catch {
        throw new ServiceUnavailableException('Spotify auth token response was unreadable');
      }

      if (!payload.access_token) {
        throw new ServiceUnavailableException('Spotify auth token response was incomplete');
      }

      this.appTokenCache = {
        accessToken: payload.access_token,
        expiresAt: Date.now() + Math.max(payload.expires_in - 60, 60) * 1000,
      };

      return payload.access_token;
    })();

    try {
      return await this.pendingAppTokenRequest;
    } finally {
      this.pendingAppTokenRequest = null;
    }
  }

  private buildArtistSummary(artist: SpotifyArtistResponse): SpotifyConnectionSummary {
    return {
      artistId: artist.id,
      displayName: artist.name,
      externalUrl: artist.external_urls?.spotify ?? `https://open.spotify.com/artist/${artist.id}`,
      imageUrl: Array.isArray(artist.images) ? (artist.images[0]?.url ?? null) : null,
      followersTotal: typeof artist.followers?.total === 'number' ? artist.followers.total : null,
      popularity: this.readPopularity(artist.popularity),
      genres: Array.isArray(artist.genres) ? artist.genres : [],
    };
  }

  private readPopularity(value: unknown): number | null {
    return typeof value === 'number' ? value : null;
  }

  private readTracks(payload: SpotifyTopTracksResponse): SpotifyTrackResponse[] {
    if (!Array.isArray(payload.tracks)) {
      return [];
    }

    return payload.tracks.filter(
      (track): track is SpotifyTrackResponse =>
        typeof track === 'object' &&
        track !== null &&
        typeof track.id === 'string' &&
        typeof track.name === 'string',
    );
  }
}
