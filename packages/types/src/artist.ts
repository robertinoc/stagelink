import type { LocalizedTextMap, SupportedLocale } from './i18n';
import type { RecordLabel } from './epk';

// ── Releases / EPs / Albums (REQ-10) ───────────────────────────

/**
 * Release types supported by the manual releases editor.
 * Mirrors common Spotify/Apple Music classifications so future automation
 * (`/v1/artists/{id}/albums`) can map cleanly into this union.
 */
export const ARTIST_RELEASE_TYPES = [
  'single',
  'ep',
  'album',
  'remix',
  'compilation',
  'other',
] as const;

export type ArtistReleaseType = (typeof ARTIST_RELEASE_TYPES)[number];

/**
 * A single release (EP / album / single / remix / etc.) owned by an artist.
 * Stored as JSONB on the `artists.releases` column — same persistence pattern
 * as `recordLabels`. `releaseDate` is a string (either `YYYY` or `YYYY-MM-DD`)
 * so we can keep validation cheap and avoid timezone bugs.
 */
export interface ArtistRelease {
  id: string;
  title: string;
  type: ArtistReleaseType;
  releaseDate: string | null;
  coverUrl: string | null;
  spotifyUrl: string | null;
  label: string | null;
  description: string | null;
}

export type ArtistRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface ArtistMembership {
  id: string;
  artistId: string;
  userId: string;
  role: ArtistRole;
  createdAt: string;
  updatedAt: string;
}

export type ArtistCategory =
  | 'musician'
  | 'dj'
  | 'actor'
  | 'painter'
  | 'visual_artist'
  | 'performer'
  | 'creator'
  | 'band'
  | 'producer'
  | 'other';

export interface Artist {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio: string | null;
  fullBio: string | null;
  baseLocale: SupportedLocale;
  avatarUrl: string | null;
  coverUrl: string | null;
  galleryImageUrls: string[];
  category: ArtistCategory;
  secondaryCategories: ArtistCategory[];
  tags: string[];
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  spotifyUrl: string | null;
  soundcloudUrl: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
  appleMusicUrl: string | null;
  amazonMusicUrl: string | null;
  deezerUrl: string | null;
  tidalUrl: string | null;
  beatportUrl: string | null;
  traxsourceUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  recordLabels: RecordLabel[];
  // REQ-10
  releases: ArtistRelease[];
  // REQ-11 — null/0 means "hide on public page"
  epsReleasedCount: number | null;
  externalCollabsCount: number | null;
  translations: ArtistTranslations;
  createdAt: string;
  updatedAt: string;
}

import type { BlockType, BlockConfig } from './block';

export interface ArtistTranslations {
  displayName?: LocalizedTextMap;
  bio?: LocalizedTextMap;
  fullBio?: LocalizedTextMap;
  seoTitle?: LocalizedTextMap;
  seoDescription?: LocalizedTextMap;
}

export interface LocalizedArtistContent {
  locale: SupportedLocale;
  displayName: string;
  bio: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface PublicBlock {
  id: string;
  type: BlockType;
  title: string | null;
  position: number;
  config: BlockConfig;
}

export interface PublicArtist {
  username: string;
  displayName: string;
  bio: string | null;
  fullBio: string | null;
  locale: SupportedLocale;
  baseLocale: SupportedLocale;
  avatarUrl: string | null;
  coverUrl: string | null;
  galleryImageUrls: string[];
  category: ArtistCategory;
  secondaryCategories: ArtistCategory[];
  tags: string[];
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  spotifyUrl: string | null;
  soundcloudUrl: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
  appleMusicUrl: string | null;
  amazonMusicUrl: string | null;
  deezerUrl: string | null;
  tidalUrl: string | null;
  beatportUrl: string | null;
  traxsourceUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  // REQ-10 — releases visible on the public landing page (always returned; FE hides when empty).
  releases: ArtistRelease[];
  // REQ-11 — public counters. `recordLabelsCount` is server-derived from
  // `recordLabels.length` so the artist's curated list and the public number can never drift.
  // `epsReleasedCount` and `externalCollabsCount` are manual; `null` means "hide".
  epsReleasedCount: number | null;
  externalCollabsCount: number | null;
  recordLabelsCount: number;
  // Curated record labels — surfaced on the public page only through the
  // `record_labels` block (always returned; FE hides when no block uses them).
  recordLabels: RecordLabel[];
}

export type PublicPromoSlotKind = 'none' | 'free_branding';

export interface PublicPromoSlot {
  kind: PublicPromoSlotKind;
}

export interface PublicPageResponse {
  artistId: string;
  pageId: string;
  artist: PublicArtist;
  blocks: PublicBlock[];
  promoSlot: PublicPromoSlot;
  publicEpkAvailable: boolean;
  epkRiderInfo: string | null;
  epkTechRequirements: string | null;
  locale: SupportedLocale;
  contentLocale: SupportedLocale;
  /** Visual theme selected by the artist — e.g. { name: 'aurora' } */
  theme?: Record<string, string>;
}

export type CustomDomainStatus = 'pending' | 'active' | 'failed' | 'disabled';

export interface CustomDomain {
  id: string;
  artistId: string;
  domain: string;
  isPrimary: boolean;
  status: CustomDomainStatus;
  createdAt: Date;
  updatedAt: Date;
}
