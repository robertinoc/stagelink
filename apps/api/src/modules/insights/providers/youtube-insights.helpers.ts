import { BadRequestException } from '@nestjs/common';

const YOUTUBE_CHANNEL_ID_REGEX = /^UC[A-Za-z0-9_-]{22}$/;
const YOUTUBE_HANDLE_REGEX = /^@?[A-Za-z0-9._-]{3,30}$/;

export const YOUTUBE_INSIGHTS_RECENT_VIDEOS_LIMIT = 5;

export type NormalizedYouTubeChannelReference =
  | { kind: 'channel_id'; value: string }
  | { kind: 'handle'; value: string };

export function normalizeYouTubeChannelReference(input: string): NormalizedYouTubeChannelReference {
  const normalized = input.trim();
  if (!normalized) {
    throw new BadRequestException('YouTube channel URL, handle, or channel ID is required');
  }

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    let url: URL;
    try {
      url = new URL(normalized);
    } catch {
      throw new BadRequestException('Use a valid YouTube channel URL, handle, or channel ID');
    }

    const hostname = url.hostname.toLowerCase();
    if (!['www.youtube.com', 'youtube.com', 'm.youtube.com'].includes(hostname)) {
      throw new BadRequestException('Use a valid YouTube channel URL, handle, or channel ID');
    }

    const segments = url.pathname.split('/').filter(Boolean);
    if (segments[0] === 'channel' && segments[1] && YOUTUBE_CHANNEL_ID_REGEX.test(segments[1])) {
      return {
        kind: 'channel_id',
        value: segments[1],
      };
    }

    const firstSegment = segments[0];
    if (firstSegment && firstSegment.startsWith('@') && YOUTUBE_HANDLE_REGEX.test(firstSegment)) {
      return {
        kind: 'handle',
        value: firstSegment.replace(/^@/, ''),
      };
    }

    throw new BadRequestException(
      'Use a YouTube channel URL with /channel/<id> or /@handle, or paste a raw @handle / channel ID',
    );
  }

  if (YOUTUBE_CHANNEL_ID_REGEX.test(normalized)) {
    return {
      kind: 'channel_id',
      value: normalized,
    };
  }

  if (normalized.startsWith('@') && YOUTUBE_HANDLE_REGEX.test(normalized)) {
    return {
      kind: 'handle',
      value: normalized.replace(/^@/, ''),
    };
  }

  throw new BadRequestException(
    'Use a YouTube channel URL with /channel/<id> or /@handle, or paste a raw @handle / channel ID',
  );
}

export function buildYouTubeChannelUrl(channelId: string, handle?: string | null): string {
  if (handle?.trim()) {
    return `https://www.youtube.com/@${handle.replace(/^@/, '')}`;
  }

  return `https://www.youtube.com/channel/${channelId}`;
}
