/**
 * Centralized asset type configuration.
 * Add new kinds here as the platform grows (epk-photo, press-photo, etc.).
 */

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export interface AssetTypeConfig {
  allowedMimeTypes: readonly AllowedMimeType[];
  maxSizeBytes: number;
}

export const ASSET_CONFIG: Record<string, AssetTypeConfig> = {
  avatar: {
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
  },
  cover: {
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    maxSizeBytes: 8 * 1024 * 1024, // 8 MB
  },
  epk_image: {
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    maxSizeBytes: 8 * 1024 * 1024, // 8 MB
  },
} as const;

export const PRESIGNED_URL_TTL_SECONDS = 300; // 5 minutes
