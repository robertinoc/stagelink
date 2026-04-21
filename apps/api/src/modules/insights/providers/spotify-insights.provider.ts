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
  followers: {
    total: number;
  };
  popularity: number;
  genres: string[];
  images: SpotifyImage[];
  external_urls: {
    spotify?: string;
  };
}

interface SpotifyTrackResponse {
  id: string;
  name: string;
  popularity: number;
  external_urls: {
    spotify?: string;
  };
  album?: {
    name?: string;
    images?: SpotifyImage[];
  };
}

interface SpotifyTopTracksResponse {
  tracks: SpotifyTrackResponse[];
}

interface SpotifyConnectionSummary {
  artistId: string;
  displayName: string;
  externalUrl: string;
  imageUrl: string | null;
  followersTotal: number;
  popularity: number;
  genres: string[];
}

@Injectable()
export class SpotifyInsightsProvider implements PlatformInsightsProvider {
  readonly platform = 'spotify' as const;
  readonly connectionMethod = 'reference' as const;

  private appTokenCache: { accessToken: string; expiresAt: number } | null = null;

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
    const artist = await this.fetchArtist(artistId);

    return {
      ok: true,
      platform: 'spotify',
      externalAccountId: artist.id,
      displayName: artist.name,
      externalUrl: artist.external_urls.spotify ?? `https://open.spotify.com/artist/${artist.id}`,
      imageUrl: artist.images[0]?.url ?? null,
      followersTotal: artist.followers.total ?? null,
      popularity: typeof artist.popularity === 'number' ? artist.popularity : null,
      message: `Connected to ${artist.name} on Spotify`,
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
      this.fetchTopTracks(artistId),
    ]);

    return {
      platform: this.platform,
      capturedAt: new Date().toISOString(),
      profile: {
        displayName: artist.name,
        imageUrl: artist.images[0]?.url ?? null,
        externalUrl: artist.external_urls.spotify ?? `https://open.spotify.com/artist/${artist.id}`,
      },
      metrics: {
        followers_total: artist.followers.total ?? null,
        popularity: typeof artist.popularity === 'number' ? artist.popularity : null,
        genres_count: artist.genres.length,
        top_tracks_count: topTracks.tracks.length,
      },
      topContent: topTracks.tracks.slice(0, SPOTIFY_INSIGHTS_TOP_TRACKS_LIMIT).map((track) => ({
        platform: this.platform,
        externalId: track.id,
        title: track.name,
        subtitle: track.album?.name ?? null,
        metricLabel: 'Popularity',
        metricValue: String(track.popularity ?? ''),
        imageUrl: track.album?.images?.[0]?.url ?? null,
        externalUrl: track.external_urls.spotify ?? null,
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

  private async spotifyRequest<T>(path: string): Promise<T> {
    const accessToken = await this.getAppAccessToken();

    const response = await fetch(`https://api.spotify.com/v1${path}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 404) {
      throw new BadRequestException('Spotify artist could not be found');
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new ServiceUnavailableException(
        `Spotify API request failed (${response.status})${body ? `: ${body}` : ''}`,
      );
    }

    return (await response.json()) as T;
  }

  private async getAppAccessToken(): Promise<string> {
    const cachedToken = this.appTokenCache;
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
      return cachedToken.accessToken;
    }

    const clientId = process.env['SPOTIFY_CLIENT_ID']?.trim();
    const clientSecret = process.env['SPOTIFY_CLIENT_SECRET']?.trim();
    if (!clientId || !clientSecret) {
      throw new ServiceUnavailableException(
        'Spotify client credentials are missing on this deployment',
      );
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new ServiceUnavailableException(
        `Spotify auth token request failed (${response.status})${body ? `: ${body}` : ''}`,
      );
    }

    const payload = (await response.json()) as SpotifyAuthResponse;
    if (!payload.access_token) {
      throw new ServiceUnavailableException('Spotify auth token response was incomplete');
    }

    this.appTokenCache = {
      accessToken: payload.access_token,
      expiresAt: Date.now() + Math.max(payload.expires_in - 60, 60) * 1000,
    };

    return payload.access_token;
  }
}
