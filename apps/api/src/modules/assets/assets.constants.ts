/**
 * Centralized asset type configuration.
 * Add new kinds here as the platform grows (epk-photo, press-photo, etc.).
 */

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MIME_TYPE_EXTENSIONS: Record<AllowedMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface AssetTypeConfig {
  allowedMimeTypes: readonly AllowedMimeType[];
  minSizeBytes: number;
  maxSizeBytes: number;
}

export const ASSET_CONFIG: Record<string, AssetTypeConfig> = {
  avatar: {
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    minSizeBytes: 1,
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
  },
  cover: {
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    minSizeBytes: 1,
    maxSizeBytes: 8 * 1024 * 1024, // 8 MB
  },
  epk_image: {
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    minSizeBytes: 1,
    maxSizeBytes: 8 * 1024 * 1024, // 8 MB
  },
  profile_gallery: {
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    minSizeBytes: 1,
    maxSizeBytes: 8 * 1024 * 1024, // 8 MB
  },
} as const;

export const PRESIGNED_URL_TTL_SECONDS = 300; // 5 minutes

export function buildCanonicalAssetFilename(mimeType: AllowedMimeType): string {
  return `upload.${MIME_TYPE_EXTENSIONS[mimeType]}`;
}
