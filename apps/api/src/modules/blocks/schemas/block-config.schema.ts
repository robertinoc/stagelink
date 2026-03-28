import { BadRequestException } from '@nestjs/common';
import { type BlockType } from '@prisma/client';
import { LINK_ICONS as LINK_ICONS_SHARED } from '@stagelink/types';

// =============================================================
// Block Config Validation
//
// Per-type validation for the `config` JSON field on blocks.
// Pure TypeScript — no extra dependencies required.
//
// Security mitigations:
//   - Blocks javascript:, data:, vbscript:, blob: protocols (XSS)
//   - Allowlist for embed providers (prevents arbitrary iframes)
//   - Max length on all string fields (oversized payload protection)
//   - Max items on arrays (unbounded growth protection)
//   - Plain object assertion (prototype pollution protection)
//   - Exhaustive switch — TS error if new BlockType added without handler
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
// Single source of truth — imported from the shared types package.
// Adding a new icon: update LINK_ICONS in @stagelink/types; validation here
// and the frontend renderer will pick it up automatically.
const LINK_ICONS = LINK_ICONS_SHARED;

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

function validateMusicEmbedConfig(c: Record<string, unknown>): void {
  if (!MUSIC_PROVIDERS.includes(c['provider'] as (typeof MUSIC_PROVIDERS)[number])) {
    throw new BadRequestException(
      `music_embed config.provider must be one of: ${MUSIC_PROVIDERS.join(', ')}`,
    );
  }
  assertSafeUrl(c['embedUrl'], 'music_embed config.embedUrl');
}

function validateVideoEmbedConfig(c: Record<string, unknown>): void {
  if (!VIDEO_PROVIDERS.includes(c['provider'] as (typeof VIDEO_PROVIDERS)[number])) {
    throw new BadRequestException(
      `video_embed config.provider must be one of: ${VIDEO_PROVIDERS.join(', ')}`,
    );
  }
  assertSafeUrl(c['embedUrl'], 'video_embed config.embedUrl');
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

// ─── public API ───────────────────────────────────────────────────────────────

/**
 * Validates that `config` matches the expected shape for `type`.
 * Throws BadRequestException with a descriptive message on failure.
 * Call this in the service before any DB write.
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
 * Validates the optional title field shared by all block types.
 */
export function validateBlockTitle(title: unknown): void {
  if (title === undefined || title === null) return;
  assertNonEmptyString(title, 'title', MAX_TITLE_LENGTH);
}

/**
 * Returns a sanitized copy of `config` with URL fields trimmed of whitespace.
 * Call this after `validateBlockConfig` passes, before writing to the DB.
 * Only mutates string URL fields; all other values are passed through as-is.
 */
export function sanitizeBlockConfig(
  type: BlockType,
  config: Record<string, unknown>,
): Record<string, unknown> {
  switch (type) {
    case 'links': {
      const items = config['items'] as Array<Record<string, unknown>>;
      return {
        ...config,
        items: items.map((item) => ({
          ...item,
          url: typeof item['url'] === 'string' ? item['url'].trim() : item['url'],
        })),
      };
    }
    case 'music_embed':
    case 'video_embed':
      return {
        ...config,
        embedUrl:
          typeof config['embedUrl'] === 'string' ? config['embedUrl'].trim() : config['embedUrl'],
      };
    case 'email_capture':
      return config;
    default:
      return config;
  }
}

export { MUSIC_PROVIDERS, VIDEO_PROVIDERS, LINK_ICONS, MAX_LINK_ITEMS };
