import { BadRequestException } from '@nestjs/common';

const SPOTIFY_ARTIST_ID_REGEX = /^[A-Za-z0-9]{22}$/;
const SPOTIFY_ARTIST_URL_REGEX =
  /^https?:\/\/open\.spotify\.com\/artist\/([A-Za-z0-9]{22})(?:[/?].*)?$/i;
const SPOTIFY_ARTIST_URI_REGEX = /^spotify:artist:([A-Za-z0-9]{22})$/i;

export const SPOTIFY_INSIGHTS_TOP_TRACKS_LIMIT = 5;
export const SPOTIFY_DEFAULT_MARKET = 'US';

export function normalizeSpotifyArtistId(input: string): string {
  const normalized = input.trim();
  if (!normalized) {
    throw new BadRequestException('Spotify artist URL, URI, or ID is required');
  }

  const urlMatch = normalized.match(SPOTIFY_ARTIST_URL_REGEX);
  if (urlMatch?.[1]) {
    return urlMatch[1];
  }

  const uriMatch = normalized.match(SPOTIFY_ARTIST_URI_REGEX);
  if (uriMatch?.[1]) {
    return uriMatch[1];
  }

  if (SPOTIFY_ARTIST_ID_REGEX.test(normalized)) {
    return normalized;
  }

  throw new BadRequestException('Use a valid Spotify artist URL, URI, or artist ID');
}

export function resolveSpotifyInsightsMarket(rawMarket?: string | null): string {
  const normalized = rawMarket?.trim().toUpperCase();
  if (!normalized) {
    return SPOTIFY_DEFAULT_MARKET;
  }

  if (!/^[A-Z]{2}$/.test(normalized)) {
    throw new BadRequestException('SPOTIFY_TOP_TRACKS_MARKET must be a 2-letter market code');
  }

  return normalized;
}
