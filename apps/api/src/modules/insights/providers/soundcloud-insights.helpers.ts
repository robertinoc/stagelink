import { BadRequestException } from '@nestjs/common';

// SoundCloud permalink: lowercase letters, digits, hyphens, underscores (2–50 chars)
const SOUNDCLOUD_PERMALINK_REGEX = /^[a-zA-Z0-9_-]{2,50}$/;

export const SOUNDCLOUD_INSIGHTS_TOP_TRACKS_LIMIT = 5;

/**
 * Accepts any of:
 *  - https://soundcloud.com/permalink
 *  - http://soundcloud.com/permalink
 *  - soundcloud.com/permalink        (no protocol)
 *  - permalink                       (bare username/slug)
 *
 * Returns the canonical profile URL: https://soundcloud.com/<permalink>
 */
export function normalizeSoundCloudProfileInput(input: string): string {
  const normalized = input.trim();
  if (!normalized) {
    throw new BadRequestException('SoundCloud profile URL or username is required');
  }

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return extractPermalinkFromUrl(normalized);
  }

  // Allow "soundcloud.com/permalink" without protocol
  if (normalized.toLowerCase().startsWith('soundcloud.com/')) {
    return extractPermalinkFromUrl(`https://${normalized}`);
  }

  // Bare username/permalink
  if (SOUNDCLOUD_PERMALINK_REGEX.test(normalized)) {
    return buildSoundCloudProfileUrl(normalized.toLowerCase());
  }

  throw new BadRequestException(
    'Use a valid SoundCloud profile URL (https://soundcloud.com/artist) or username',
  );
}

function extractPermalinkFromUrl(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new BadRequestException(
      'Use a valid SoundCloud profile URL (https://soundcloud.com/artist) or username',
    );
  }

  const hostname = url.hostname.toLowerCase();
  if (!['soundcloud.com', 'www.soundcloud.com', 'm.soundcloud.com'].includes(hostname)) {
    throw new BadRequestException(
      'Use a valid SoundCloud profile URL (https://soundcloud.com/artist) or username',
    );
  }

  const segments = url.pathname.split('/').filter(Boolean);
  const permalink = segments[0];

  if (!permalink || segments.length > 1) {
    // More than one segment likely means it's a track/set URL, not a profile
    throw new BadRequestException(
      'Use a SoundCloud profile URL (https://soundcloud.com/artist), not a track or set URL',
    );
  }

  if (!SOUNDCLOUD_PERMALINK_REGEX.test(permalink)) {
    throw new BadRequestException(
      'Use a valid SoundCloud profile URL (https://soundcloud.com/artist) or username',
    );
  }

  return buildSoundCloudProfileUrl(permalink.toLowerCase());
}

export function buildSoundCloudProfileUrl(permalink: string): string {
  return `https://soundcloud.com/${permalink}`;
}
