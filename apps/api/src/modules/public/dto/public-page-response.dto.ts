import type {
  ArtistCategory,
  ArtistRelease,
  BlockType,
  PublicPromoSlotKind,
  SupportedLocale,
} from '@stagelink/types';

/**
 * DTOs de respuesta para endpoints públicos de páginas de artistas.
 *
 * Estos tipos definen exactamente qué datos son públicos.
 * Cualquier campo no incluido aquí NO se expone en la API pública.
 */

// ── Bloques ────────────────────────────────────────────────────

export type PublicBlockType = BlockType;

export interface PublicBlockDto {
  id: string;
  type: PublicBlockType;
  title: string | null;
  position: number;
  config: Record<string, unknown>;
}

// ── Artista (campos públicos) ──────────────────────────────────

export interface PublicArtistDto {
  username: string;
  displayName: string;
  bio: string | null;
  fullBio: string | null;
  baseLocale: SupportedLocale;
  avatarUrl: string | null;
  coverUrl: string | null;
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
  // Streaming platforms (REQ-06)
  appleMusicUrl: string | null;
  amazonMusicUrl: string | null;
  deezerUrl: string | null;
  tidalUrl: string | null;
  // Music stores (REQ-07)
  beatportUrl: string | null;
  traxsourceUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  locale: SupportedLocale;
  // REQ-10 — releases visible on the public landing page.
  // Always returned (possibly empty); the FE hides the section when length === 0.
  releases: ArtistRelease[];
  // REQ-11 — public counters.
  // `recordLabelsCount` is server-derived from `recordLabels.length` so the
  // artist's curated list and the public number can never drift.
  // `epsReleasedCount` and `externalCollabsCount` are manual; `null` means "hide".
  epsReleasedCount: number | null;
  externalCollabsCount: number | null;
  recordLabelsCount: number;
}

// ── Respuesta completa de página pública ──────────────────────

export interface PublicPageResponseDto {
  /**
   * Stable internal UUID for the artist.
   * Included for client-side analytics joins — NOT PII.
   * Matches the artistId used in server-side analytics events.
   */
  artistId: string;
  /** Stable internal UUID for the page — needed for per-page click analytics. */
  pageId: string;
  /** Página de artista visible públicamente */
  artist: PublicArtistDto;
  blocks: PublicBlockDto[];
  publicEpkAvailable: boolean;
  epkRiderInfo: string | null;
  epkTechRequirements: string | null;
  locale: SupportedLocale;
  contentLocale: SupportedLocale;
  /** Slot público reservado para branding/promo según el plan efectivo. */
  promoSlot: {
    kind: PublicPromoSlotKind;
  };
  /** Visual theme selected by the artist — e.g. { name: 'aurora' } */
  theme?: Record<string, string>;
}
