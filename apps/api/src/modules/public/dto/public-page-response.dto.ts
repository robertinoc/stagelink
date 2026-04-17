import type {
  ArtistCategory,
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
  seoTitle: string | null;
  seoDescription: string | null;
  locale: SupportedLocale;
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
  locale: SupportedLocale;
  contentLocale: SupportedLocale;
  /** Slot público reservado para branding/promo según el plan efectivo. */
  promoSlot: {
    kind: PublicPromoSlotKind;
  };
}
