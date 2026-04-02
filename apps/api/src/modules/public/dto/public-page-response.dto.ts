/**
 * DTOs de respuesta para endpoints públicos de páginas de artistas.
 *
 * Estos tipos definen exactamente qué datos son públicos.
 * Cualquier campo no incluido aquí NO se expone en la API pública.
 */

// ── Bloques ────────────────────────────────────────────────────

export type PublicBlockType = 'links' | 'music_embed' | 'video_embed' | 'email_capture';

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
  avatarUrl: string | null;
  coverUrl: string | null;
  category: ArtistCategory;
  secondaryCategories: ArtistCategory[];
  seoTitle: string | null;
  seoDescription: string | null;
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
}
import type { ArtistCategory } from '@stagelink/types';
