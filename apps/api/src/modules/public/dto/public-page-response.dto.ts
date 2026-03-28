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
  seoTitle: string | null;
  seoDescription: string | null;
}

// ── Respuesta completa de página pública ──────────────────────

export interface PublicPageResponseDto {
  /** Página de artista visible públicamente */
  artist: PublicArtistDto;
  blocks: PublicBlockDto[];
}
