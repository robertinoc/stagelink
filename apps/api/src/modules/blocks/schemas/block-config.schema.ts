import { BadRequestException } from '@nestjs/common';
import { type BlockType } from '@prisma/client';
import { LINK_ICONS } from '@stagelink/types';

// =============================================================
// Block Config Validation + Enrichment
//
// Per-type validation for the `config` JSON field on blocks.
// Pure TypeScript — no extra dependencies required.
//
// Security mitigations:
//   - Blocks javascript:, data:, vbscript:, blob: protocols (XSS)
//   - Allowlist for embed providers (prevents arbitrary iframes)
//   - Backend derives embedUrl from sourceUrl — client never sends raw embed URLs
//   - Max length on all string fields (oversized payload protection)
//   - Max items on arrays (unbounded growth protection)
//   - Plain object assertion (prototype pollution protection)
//   - Exhaustive switch — TS error if new BlockType added without handler
//
// Embed flow for music_embed / video_embed:
//   Client sends: { provider, sourceUrl }
//   validateBlockConfig: checks provider in allowlist, assertSafeUrl(sourceUrl)
//   enrichBlockConfig:   parses sourceUrl → derives embedUrl + resourceType
//   DB write:            full enriched config { provider, sourceUrl, embedUrl, resourceType }
// =============================================================

const MAX_TITLE_LENGTH = 200;
const MAX_LABEL_LENGTH = 100;
const MAX_URL_LENGTH = 2048;
const MAX_HEADLINE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 300;
const MAX_BUTTON_LABEL_LENGTH = 50;
const MAX_PLACEHOLDER_LENGTH = 100;
const MAX_LINK_ITEMS = 20;

const BLOCKED_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'blob:'];
const MUSIC_PROVIDERS = ['spotify', 'apple_music', 'soundcloud', 'youtube'] as const;
const VIDEO_PROVIDERS = ['youtube', 'vimeo', 'tiktok'] as const;

// ─── helpers ─────────────────────────────────────────────────────────────────

function assertSafeUrl(url: unknown, field: string): void {
  if (typeof url !== 'string') {
    throw new BadRequestException(`${field} must be a string`);
  }
  const trimmed = url.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_URL_LENGTH) {
    throw new BadRequestException(`${field} must be between 1 and ${MAX_URL_LENGTH} characters`);
  }
  const lower = trimmed.toLowerCase();
  for (const proto of BLOCKED_PROTOCOLS) {
    if (lower.startsWith(proto)) {
      throw new BadRequestException(`${field}: protocol "${proto}" is not allowed`);
    }
  }
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    throw new BadRequestException(`${field} must be a valid http:// or https:// URL`);
  }
}

function assertNonEmptyString(value: unknown, field: string, maxLength: number): void {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${field} must be a string`);
  }
  if (value.trim().length === 0) {
    throw new BadRequestException(`${field} must not be empty`);
  }
  if (value.length > maxLength) {
    throw new BadRequestException(`${field} must be ${maxLength} characters or fewer`);
  }
}

function assertOptionalString(value: unknown, field: string, maxLength: number): void {
  if (value === undefined || value === null) return;
  if (typeof value !== 'string') {
    throw new BadRequestException(`${field} must be a string`);
  }
  if (value.length > maxLength) {
    throw new BadRequestException(`${field} must be ${maxLength} characters or fewer`);
  }
}

function assertPlainObject(config: unknown): asserts config is Record<string, unknown> {
  if (
    typeof config !== 'object' ||
    config === null ||
    Array.isArray(config) ||
    Object.getPrototypeOf(config) !== Object.prototype
  ) {
    throw new BadRequestException('config must be a plain object');
  }
}

// ─── per-type validators ──────────────────────────────────────────────────────

function validateLinksConfig(c: Record<string, unknown>): void {
  if (!Array.isArray(c['items'])) {
    throw new BadRequestException('links config.items must be an array');
  }
  const items = c['items'] as unknown[];
  if (items.length === 0) {
    throw new BadRequestException('links config.items must have at least 1 item');
  }
  if (items.length > MAX_LINK_ITEMS) {
    throw new BadRequestException(`links config.items must have at most ${MAX_LINK_ITEMS} items`);
  }

  const seenIds = new Set<string>();
  const seenSortOrders = new Set<number>();

  for (const [i, item] of items.entries()) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      throw new BadRequestException(`links config.items[${i}] must be an object`);
    }
    const it = item as Record<string, unknown>;

    // id — stable identifier, used for analytics
    if (typeof it['id'] !== 'string' || it['id'].trim().length === 0) {
      throw new BadRequestException(`links config.items[${i}].id must be a non-empty string`);
    }
    if (seenIds.has(it['id'] as string)) {
      throw new BadRequestException(`links config.items[${i}].id must be unique within the block`);
    }
    seenIds.add(it['id'] as string);

    assertNonEmptyString(it['label'], `links config.items[${i}].label`, MAX_LABEL_LENGTH);
    assertSafeUrl(it['url'], `links config.items[${i}].url`);

    // icon — optional, must be a known key if present
    if (it['icon'] !== undefined && it['icon'] !== null) {
      if (!LINK_ICONS.includes(it['icon'] as (typeof LINK_ICONS)[number])) {
        throw new BadRequestException(
          `links config.items[${i}].icon must be one of: ${LINK_ICONS.join(', ')}`,
        );
      }
    }

    // sortOrder — required, non-negative integer, unique within block
    if (!Number.isInteger(it['sortOrder']) || (it['sortOrder'] as number) < 0) {
      throw new BadRequestException(
        `links config.items[${i}].sortOrder must be a non-negative integer`,
      );
    }
    if (seenSortOrders.has(it['sortOrder'] as number)) {
      throw new BadRequestException(
        `links config.items[${i}].sortOrder must be unique within the block`,
      );
    }
    seenSortOrders.add(it['sortOrder'] as number);

    // openInNewTab — optional boolean
    if (it['openInNewTab'] !== undefined && typeof it['openInNewTab'] !== 'boolean') {
      throw new BadRequestException(`links config.items[${i}].openInNewTab must be a boolean`);
    }
  }
}

/**
 * Validates music_embed config: checks provider allowlist and sourceUrl safety.
 * Does NOT derive embedUrl — that happens in enrichBlockConfig.
 */
function validateMusicEmbedConfig(c: Record<string, unknown>): void {
  if (!MUSIC_PROVIDERS.includes(c['provider'] as (typeof MUSIC_PROVIDERS)[number])) {
    throw new BadRequestException(
      `music_embed config.provider must be one of: ${MUSIC_PROVIDERS.join(', ')}`,
    );
  }
  assertSafeUrl(c['sourceUrl'], 'music_embed config.sourceUrl');
}

/**
 * Validates video_embed config: checks provider allowlist and sourceUrl safety.
 * Does NOT derive embedUrl — that happens in enrichBlockConfig.
 */
function validateVideoEmbedConfig(c: Record<string, unknown>): void {
  if (!VIDEO_PROVIDERS.includes(c['provider'] as (typeof VIDEO_PROVIDERS)[number])) {
    throw new BadRequestException(
      `video_embed config.provider must be one of: ${VIDEO_PROVIDERS.join(', ')}`,
    );
  }
  assertSafeUrl(c['sourceUrl'], 'video_embed config.sourceUrl');
}

function validateEmailCaptureConfig(c: Record<string, unknown>): void {
  assertNonEmptyString(c['headline'], 'email_capture config.headline', MAX_HEADLINE_LENGTH);
  assertNonEmptyString(
    c['buttonLabel'],
    'email_capture config.buttonLabel',
    MAX_BUTTON_LABEL_LENGTH,
  );
  assertOptionalString(
    c['description'],
    'email_capture config.description',
    MAX_DESCRIPTION_LENGTH,
  );
  assertOptionalString(
    c['placeholder'],
    'email_capture config.placeholder',
    MAX_PLACEHOLDER_LENGTH,
  );
}

// ─── URL parsing + embed derivation ──────────────────────────────────────────
//
// Each function parses a user-supplied sourceUrl for the given provider,
// derives a safe embedUrl, and infers a resourceType string.
// Throws BadRequestException if the URL cannot be resolved.
//
// Provider notes:
//   Spotify      — open.spotify.com/{type}/{id}        → embed/{type}/{id}
//   Apple Music  — music.apple.com/…                   → embed.music.apple.com/…
//   SoundCloud   — soundcloud.com/…                    → w.soundcloud.com/player/ widget
//   YouTube      — youtu.be/ID, /watch?v=ID, /shorts/ID → youtube.com/embed/ID
//   Vimeo        — vimeo.com/{id}[/{hash}]             → player.vimeo.com/video/{id}
//   TikTok       — tiktok.com/@user/video/{id}         → tiktok.com/embed/v2/{id}

interface EmbedResult {
  embedUrl: string;
  resourceType: string;
}

// ─── Hostname allowlists ──────────────────────────────────────────────────────
//
// Explicit Sets prevent subdomain bypass attacks.
// 'evil-soundcloud.com.attacker.com'.includes('soundcloud.com') === true
// but a Set check on the full hostname rejects it.

const YOUTUBE_HOSTNAMES = new Set(['www.youtube.com', 'youtube.com', 'm.youtube.com', 'youtu.be']);
const SOUNDCLOUD_HOSTNAMES = new Set(['soundcloud.com', 'www.soundcloud.com', 'm.soundcloud.com']);
const VIMEO_HOSTNAMES = new Set(['vimeo.com', 'www.vimeo.com']);
const TIKTOK_HOSTNAMES = new Set(['www.tiktok.com', 'tiktok.com', 'vm.tiktok.com']);

// Accepted Spotify path types — unknown types are rejected, not silently passed through.
const SPOTIFY_RESOURCE_TYPES = new Set(['track', 'album', 'playlist', 'artist', 'episode', 'show']);

function parseMusicUrl(provider: (typeof MUSIC_PROVIDERS)[number], sourceUrl: string): EmbedResult {
  let url: URL;
  try {
    url = new URL(sourceUrl.trim());
  } catch {
    throw new BadRequestException(`music_embed config.sourceUrl is not a valid URL`);
  }

  switch (provider) {
    case 'spotify': {
      if (url.hostname !== 'open.spotify.com') {
        throw new BadRequestException(
          `music_embed: Spotify URLs must start with https://open.spotify.com/`,
        );
      }
      // pathname: /{type}/{id} — strip query params from embed URL
      const parts = url.pathname.split('/').filter(Boolean);
      const [type, id] = parts;
      if (!type || !id) {
        throw new BadRequestException(
          `music_embed: Could not extract track/album/playlist from Spotify URL`,
        );
      }
      if (!SPOTIFY_RESOURCE_TYPES.has(type)) {
        throw new BadRequestException(
          `music_embed: Unrecognized Spotify resource type "${type}". Expected: track, album, playlist, artist, episode`,
        );
      }
      // Normalize 'show' → 'episode' for resourceType; the embed path keeps 'show'
      const resourceType = type === 'show' ? 'episode' : type;
      return {
        embedUrl: `https://open.spotify.com/embed/${type}/${id}`,
        resourceType,
      };
    }

    case 'apple_music': {
      // Exact match — endsWith('music.apple.com') would accept 'evil-music.apple.com'
      if (url.hostname !== 'music.apple.com') {
        throw new BadRequestException(
          `music_embed: Apple Music URLs must start with https://music.apple.com/`,
        );
      }
      // Infer resourceType from path segments
      const pathLower = url.pathname.toLowerCase();
      let resourceType = 'album';
      if (pathLower.includes('/playlist/')) resourceType = 'playlist';
      else if (pathLower.includes('/album/')) resourceType = 'album';
      else if (pathLower.includes('/song/')) resourceType = 'track';
      else if (pathLower.includes('/artist/')) resourceType = 'artist';
      return {
        embedUrl: `https://embed.music.apple.com${url.pathname}`,
        resourceType,
      };
    }

    case 'soundcloud': {
      if (!SOUNDCLOUD_HOSTNAMES.has(url.hostname)) {
        throw new BadRequestException(
          `music_embed: SoundCloud URLs must start with https://soundcloud.com/`,
        );
      }
      const pathParts = url.pathname.split('/').filter(Boolean);
      // /user/track → track, /user/sets/… → playlist, /user → artist
      let resourceType = 'track';
      if (pathParts.includes('sets')) resourceType = 'playlist';
      else if (pathParts.length === 1) resourceType = 'artist';
      const params = new URLSearchParams({
        url: sourceUrl.trim(),
        visual: 'true',
        hide_related: 'true',
        show_comments: 'false',
        show_user: 'true',
        show_reposts: 'false',
        auto_play: 'false',
      });
      return {
        embedUrl: `https://w.soundcloud.com/player/?${params.toString()}`,
        resourceType,
      };
    }

    case 'youtube': {
      // Handles: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID
      if (!YOUTUBE_HOSTNAMES.has(url.hostname)) {
        throw new BadRequestException(`music_embed: YouTube URLs must use youtube.com or youtu.be`);
      }
      let videoId: string | null = null;
      if (url.hostname === 'youtu.be') {
        videoId = url.pathname.slice(1).split('/')[0] ?? null;
      } else {
        videoId = url.searchParams.get('v');
        if (!videoId && url.pathname.startsWith('/shorts/')) {
          videoId = url.pathname.replace('/shorts/', '').split('/')[0] ?? null;
        }
      }
      if (!videoId) {
        throw new BadRequestException(`music_embed: Could not extract video ID from YouTube URL`);
      }
      return {
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        resourceType: 'track',
      };
    }
  }
}

function parseVideoUrl(provider: (typeof VIDEO_PROVIDERS)[number], sourceUrl: string): EmbedResult {
  let url: URL;
  try {
    url = new URL(sourceUrl.trim());
  } catch {
    throw new BadRequestException(`video_embed config.sourceUrl is not a valid URL`);
  }

  switch (provider) {
    case 'youtube': {
      if (!YOUTUBE_HOSTNAMES.has(url.hostname)) {
        throw new BadRequestException(`video_embed: YouTube URLs must use youtube.com or youtu.be`);
      }
      let videoId: string | null = null;
      let resourceType = 'video';
      if (url.hostname === 'youtu.be') {
        videoId = url.pathname.slice(1).split('/')[0] ?? null;
      } else {
        if (url.pathname.startsWith('/shorts/')) {
          videoId = url.pathname.replace('/shorts/', '').split('/')[0] ?? null;
          resourceType = 'short';
        } else {
          videoId = url.searchParams.get('v');
        }
      }
      if (!videoId) {
        throw new BadRequestException(`video_embed: Could not extract video ID from YouTube URL`);
      }
      return {
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        resourceType,
      };
    }

    case 'vimeo': {
      if (!VIMEO_HOSTNAMES.has(url.hostname)) {
        throw new BadRequestException(`video_embed: Vimeo URLs must start with https://vimeo.com/`);
      }
      const parts = url.pathname.split('/').filter(Boolean);
      const videoId = parts[0];
      if (!videoId || !/^\d+$/.test(videoId)) {
        throw new BadRequestException(
          `video_embed: Could not extract numeric video ID from Vimeo URL`,
        );
      }
      // Preserve private hash if present (vimeo.com/{id}/{hash})
      const hash = parts[1] && /^[a-f0-9]+$/i.test(parts[1]) ? parts[1] : undefined;
      const hashParam = hash ? `?h=${hash}` : '';
      return {
        embedUrl: `https://player.vimeo.com/video/${videoId}${hashParam}`,
        resourceType: 'video',
      };
    }

    case 'tiktok': {
      if (!TIKTOK_HOSTNAMES.has(url.hostname)) {
        throw new BadRequestException(
          `video_embed: TikTok URLs must start with https://www.tiktok.com/`,
        );
      }
      const match = url.pathname.match(/\/video\/(\d+)/);
      const videoId = match?.[1];
      if (!videoId) {
        throw new BadRequestException(`video_embed: Could not extract video ID from TikTok URL`);
      }
      return {
        embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
        resourceType: 'video',
      };
    }
  }
}

// ─── public API ───────────────────────────────────────────────────────────────

/**
 * Validates that `config` matches the expected shape for `type`.
 * Throws BadRequestException with a descriptive message on failure.
 * Call this in the service before any DB write.
 *
 * For music_embed / video_embed, validates that:
 *   - provider is in the allowlist
 *   - sourceUrl is a safe http(s) URL
 * Does NOT derive embedUrl — call enrichBlockConfig after validate.
 */
export function validateBlockConfig(type: BlockType, config: unknown): void {
  assertPlainObject(config);

  switch (type) {
    case 'links':
      validateLinksConfig(config);
      break;
    case 'music_embed':
      validateMusicEmbedConfig(config);
      break;
    case 'video_embed':
      validateVideoEmbedConfig(config);
      break;
    case 'email_capture':
      validateEmailCaptureConfig(config);
      break;
    default: {
      // Exhaustive guard — TypeScript will error here if a new BlockType
      // is added to the enum without a corresponding case above.
      const _exhaustive: never = type;
      throw new BadRequestException(`Unknown block type: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Post-validation enrichment for embed blocks.
 *
 * Parses sourceUrl and derives embedUrl + resourceType server-side.
 * Returns the enriched config object (a new object — does not mutate).
 * For non-embed block types, returns the config unchanged.
 *
 * Call order: validateBlockConfig → enrichBlockConfig → DB write.
 */
export function enrichBlockConfig(
  type: BlockType,
  config: Record<string, unknown>,
): Record<string, unknown> {
  if (type === 'music_embed') {
    const provider = config['provider'] as (typeof MUSIC_PROVIDERS)[number];
    const sourceUrl = config['sourceUrl'] as string;
    const result = parseMusicUrl(provider, sourceUrl);
    return { ...config, embedUrl: result.embedUrl, resourceType: result.resourceType };
  }

  if (type === 'video_embed') {
    const provider = config['provider'] as (typeof VIDEO_PROVIDERS)[number];
    const sourceUrl = config['sourceUrl'] as string;
    const result = parseVideoUrl(provider, sourceUrl);
    return { ...config, embedUrl: result.embedUrl, resourceType: result.resourceType };
  }

  return config;
}

/**
 * Trims URL whitespace from link item URLs before DB write.
 * Returns a new config object — does not mutate the input.
 * Safe to call for any block type; only touches links blocks.
 */
export function sanitizeBlockConfig(
  type: BlockType,
  config: Record<string, unknown>,
): Record<string, unknown> {
  if (type !== 'links') return config;
  if (!Array.isArray(config['items'])) return config;

  return {
    ...config,
    items: (config['items'] as Record<string, unknown>[]).map((item) => ({
      ...item,
      url: typeof item['url'] === 'string' ? item['url'].trim() : item['url'],
    })),
  };
}

/**
 * Validates the optional title field shared by all block types.
 */
export function validateBlockTitle(title: unknown): void {
  if (title === undefined || title === null) return;
  assertNonEmptyString(title, 'title', MAX_TITLE_LENGTH);
}

export { MUSIC_PROVIDERS, VIDEO_PROVIDERS, LINK_ICONS, MAX_LINK_ITEMS };
