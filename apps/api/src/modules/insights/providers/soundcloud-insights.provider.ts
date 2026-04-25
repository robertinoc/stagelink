import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  SoundCloudInsightsConnectionValidationResult,
  StageLinkInsightsPlatformCapabilities,
  StageLinkInsightsSnapshot,
} from '@stagelink/types';
import type {
  PlatformInsightsConnectionContext,
  PlatformInsightsProvider,
} from './insights-provider.interface';
import {
  buildSoundCloudProfileUrl,
  normalizeSoundCloudProfileInput,
  SOUNDCLOUD_INSIGHTS_TOP_TRACKS_LIMIT,
} from './soundcloud-insights.helpers';

// ---------------------------------------------------------------------------
// SoundCloud public API v2 response shapes
// NOTE: SoundCloud's public API is undocumented for third-party use and may
// change without notice. We use only safe public-summary fields here.
// ---------------------------------------------------------------------------

interface SoundCloudUserResponse {
  id: number;
  permalink: string;
  username: string;
  permalink_url: string;
  avatar_url: string | null;
  followers_count: number | null;
  followings_count: number | null;
  track_count: number | null;
  likes_count: number | null;
  description: string | null;
  city: string | null;
  country_code: string | null;
}

interface SoundCloudTrackResponse {
  id: number;
  title: string;
  permalink_url: string | null;
  playback_count: number | null;
  likes_count: number | null;
  artwork_url: string | null;
  genre: string | null;
}

interface SoundCloudTracksCollection {
  collection?: SoundCloudTrackResponse[];
}

interface SoundCloudUserSummary {
  accountId: string;
  permalink: string;
  displayName: string;
  externalUrl: string;
  imageUrl: string | null;
  followersCount: number | null;
  trackCount: number | null;
}

/**
 * Headers that mimic a browser request to SoundCloud.
 * SoundCloud's API v2 is undocumented and may reject server-side requests
 * that lack these headers, returning an empty body or silent 401.
 */
const SOUNDCLOUD_BROWSER_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Origin: 'https://soundcloud.com',
  Referer: 'https://soundcloud.com/',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

@Injectable()
export class SoundCloudInsightsProvider implements PlatformInsightsProvider {
  private readonly logger = new Logger(SoundCloudInsightsProvider.name);

  readonly platform = 'soundcloud' as const;
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

  async validateProfileReference(
    profileInput: string,
  ): Promise<SoundCloudInsightsConnectionValidationResult> {
    this.assertConfigured();
    const profileUrl = normalizeSoundCloudProfileInput(profileInput);
    const user = this.buildUserSummary(await this.resolveProfile(profileUrl));

    return {
      ok: true,
      platform: 'soundcloud',
      externalAccountId: user.accountId,
      externalHandle: user.permalink,
      displayName: user.displayName,
      externalUrl: user.externalUrl,
      imageUrl: user.imageUrl,
      followersCount: user.followersCount,
      trackCount: user.trackCount,
      message: `Connected to ${user.displayName} on SoundCloud`,
    };
  }

  async syncLatestSnapshot(
    context: PlatformInsightsConnectionContext,
  ): Promise<StageLinkInsightsSnapshot> {
    this.assertConfigured();

    const accountId = context.externalAccountId?.trim();
    if (!accountId) {
      throw new BadRequestException('SoundCloud connection is missing an account ID');
    }

    const [user, tracks] = await Promise.all([
      this.fetchUserById(accountId),
      this.fetchTracksSafe(accountId),
    ]);
    const summary = this.buildUserSummary(user);
    const resolvedTracks = this.readTracks(tracks);

    return {
      platform: this.platform,
      capturedAt: new Date().toISOString(),
      profile: {
        displayName: summary.displayName,
        imageUrl: summary.imageUrl,
        externalUrl: summary.externalUrl,
      },
      metrics: {
        followers_count: summary.followersCount,
        track_count: summary.trackCount,
        top_tracks_count: resolvedTracks.length,
      },
      topContent: resolvedTracks.slice(0, SOUNDCLOUD_INSIGHTS_TOP_TRACKS_LIMIT).map((track) => ({
        platform: this.platform,
        externalId: String(track.id),
        title: track.title,
        subtitle: track.genre ?? null,
        metricLabel: 'Plays',
        metricValue: String(this.readCount(track.playback_count) ?? ''),
        imageUrl: this.normalizeArtworkUrl(track.artwork_url),
        externalUrl: track.permalink_url ?? null,
      })),
    };
  }

  private isConfigured(): boolean {
    return Boolean(process.env['SOUNDCLOUD_CLIENT_ID']?.trim());
  }

  private assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'SoundCloud Insights is not configured on this deployment yet',
      );
    }
  }

  /**
   * Centralized fetch helper for all SoundCloud API v2 requests.
   * Includes browser-like headers required to avoid silent rejections,
   * and handles the empty-body case (SoundCloud's way of refusing bad client_ids).
   */
  private async scFetch(url: string): Promise<unknown> {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: SOUNDCLOUD_BROWSER_HEADERS,
      });
    } catch (err) {
      this.logger.error(`SoundCloud fetch network error: ${String(err)}`);
      throw new ServiceUnavailableException('Could not reach SoundCloud right now');
    }

    // Read body as text first so we can inspect it before parsing
    let text: string;
    try {
      text = await response.text();
    } catch {
      throw new ServiceUnavailableException('Could not read SoundCloud response');
    }

    this.logger.debug(
      `SoundCloud ${response.status} ${url.replace(/client_id=[^&]+/, 'client_id=***')} — body length: ${text.length}`,
    );

    // An empty body with any status code means the client_id is rejected.
    // SoundCloud returns HTTP 200 + empty body for invalid/cloud-blocked client_ids
    // instead of a proper 401, so we must check before response.ok.
    if (!text.trim()) {
      throw new ServiceUnavailableException(
        'SoundCloud rejected the request (empty response). ' +
          'The SOUNDCLOUD_CLIENT_ID may be invalid, revoked, or blocked for server-side use. ' +
          'Extract a fresh client_id from soundcloud.com and update the env var.',
      );
    }

    if (response.status === 404) {
      throw new BadRequestException('SoundCloud profile could not be found');
    }

    if (response.status === 401 || response.status === 403) {
      throw new ServiceUnavailableException(
        'SoundCloud API credentials are invalid or expired on this deployment',
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `SoundCloud API request failed (${response.status}): ${text.slice(0, 200)}`,
      );
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new ServiceUnavailableException(
        `SoundCloud returned an unreadable response: ${text.slice(0, 100)}`,
      );
    }
  }

  /**
   * Resolves a SoundCloud profile URL via the /resolve endpoint.
   * This is the preferred lookup method as it handles any valid permalink URL.
   */
  private async resolveProfile(profileUrl: string): Promise<SoundCloudUserResponse> {
    const clientId = this.getClientId();
    const resolveUrl = `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(profileUrl)}&client_id=${encodeURIComponent(clientId)}`;

    const data = await this.scFetch(resolveUrl);

    if (!this.isUserResponse(data)) {
      throw new BadRequestException(
        'The URL points to a track or set, not an artist profile. Use https://soundcloud.com/artist-username',
      );
    }

    return data;
  }

  private async fetchUserById(accountId: string): Promise<SoundCloudUserResponse> {
    const clientId = this.getClientId();
    const url = `https://api-v2.soundcloud.com/users/${encodeURIComponent(accountId)}?client_id=${encodeURIComponent(clientId)}`;

    const data = await this.scFetch(url);
    return data as SoundCloudUserResponse;
  }

  private async fetchTracks(accountId: string): Promise<SoundCloudTracksCollection> {
    const clientId = this.getClientId();
    const url = `https://api-v2.soundcloud.com/users/${encodeURIComponent(accountId)}/tracks?client_id=${encodeURIComponent(clientId)}&limit=${SOUNDCLOUD_INSIGHTS_TOP_TRACKS_LIMIT}&linked_partitioning=1`;

    const data = await this.scFetch(url);
    return data as SoundCloudTracksCollection;
  }

  private async fetchTracksSafe(accountId: string): Promise<SoundCloudTracksCollection> {
    try {
      return await this.fetchTracks(accountId);
    } catch {
      // Tracks are best-effort; don't fail the full sync if they're unavailable
      return { collection: [] };
    }
  }

  private getClientId(): string {
    const clientId = process.env['SOUNDCLOUD_CLIENT_ID']?.trim();
    if (!clientId) {
      throw new ServiceUnavailableException('SOUNDCLOUD_CLIENT_ID is missing on this deployment');
    }
    return clientId;
  }

  private isUserResponse(data: unknown): data is SoundCloudUserResponse {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return false;
    }
    const candidate = data as Record<string, unknown>;
    // SoundCloud returns a "kind" field to distinguish resource types
    const kind = candidate['kind'];
    if (typeof kind === 'string' && kind !== 'user') {
      return false;
    }
    return typeof candidate['id'] === 'number' && typeof candidate['permalink'] === 'string';
  }

  private buildUserSummary(user: SoundCloudUserResponse): SoundCloudUserSummary {
    const permalink = user.permalink;
    return {
      accountId: String(user.id),
      permalink,
      displayName: user.username || permalink,
      externalUrl: user.permalink_url || buildSoundCloudProfileUrl(permalink),
      imageUrl: this.normalizeAvatarUrl(user.avatar_url),
      followersCount: this.readCount(user.followers_count),
      trackCount: this.readCount(user.track_count),
    };
  }

  private readCount(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  /**
   * SoundCloud avatar URLs use "large" (100x100) by default.
   * Replace with "t500x500" for a higher-resolution version.
   */
  private normalizeAvatarUrl(url: string | null | undefined): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }
    return url.replace('-large.', '-t500x500.');
  }

  /**
   * SoundCloud artwork URLs use "large" (100x100) by default.
   * Replace with "t300x300" for a reasonable thumbnail size.
   */
  private normalizeArtworkUrl(url: string | null | undefined): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }
    return url.replace('-large.', '-t300x300.');
  }

  private readTracks(payload: SoundCloudTracksCollection): SoundCloudTrackResponse[] {
    if (!Array.isArray(payload.collection)) {
      return [];
    }

    return payload.collection.filter(
      (track): track is SoundCloudTrackResponse =>
        typeof track === 'object' &&
        track !== null &&
        typeof track.id === 'number' &&
        typeof track.title === 'string',
    );
  }
}
