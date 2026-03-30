// ── Membership ────────────────────────────────────────────────

export type ArtistRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface ArtistMembership {
  id: string;
  artistId: string;
  userId: string;
  role: ArtistRole;
  createdAt: string;
  updatedAt: string;
}

// ── Tipos internos (autenticados) ────────────────────────────

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

/** Artista completo — solo para contexto autenticado (dashboard, API privada) */
export interface Artist {
  id: string;
  userId: string;
  username: string; // unique, resolves public URL — NOT editable after creation
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  category: ArtistCategory;
  // Social links (all optional)
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  spotifyUrl: string | null;
  soundcloudUrl: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
  // SEO metadata
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Tipos públicos (sin autenticación) ───────────────────────

import type { BlockType, BlockConfig } from './block';

/** Bloque visible públicamente en una página de artista */
export interface PublicBlock {
  id: string;
  type: BlockType;
  title: string | null;
  position: number;
  config: BlockConfig;
}

/** Datos públicos del artista — sin userId ni datos privados */
export interface PublicArtist {
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

/** Respuesta de GET /api/public/pages/by-username/:username */
export interface PublicPageResponse {
  /**
   * Stable internal UUID for the artist. Included here specifically to enable
   * client-side analytics events to use a consistent identifier that matches
   * the server-side events (public_page_view, smart_link_resolved).
   * This is NOT PII — it is a technical identifier with no user-facing exposure.
   */
  artistId: string;
  /** Stable internal UUID for the page. Required for per-page analytics joins. */
  pageId: string;
  artist: PublicArtist;
  blocks: PublicBlock[];
}

// ── Custom domains ────────────────────────────────────────────

export type CustomDomainStatus = 'pending' | 'active' | 'failed' | 'disabled';

/** Dominio personalizado vinculado a un artista */
export interface CustomDomain {
  id: string;
  artistId: string;
  domain: string;
  isPrimary: boolean;
  status: CustomDomainStatus;
  createdAt: Date;
  updatedAt: Date;
}
