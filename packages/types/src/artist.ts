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
  | 'actress'
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
  username: string; // unique, resolves public URL
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  category: ArtistCategory;
  createdAt: Date;
  updatedAt: Date;
}

// ── Tipos públicos (sin autenticación) ───────────────────────

export type PublicBlockType = 'link' | 'music' | 'video' | 'fan_capture';

/** Bloque visible públicamente en una página de artista */
export interface PublicBlock {
  id: string;
  type: PublicBlockType;
  title: string | null;
  url: string | null;
  position: number;
  metadata: Record<string, unknown> | null;
}

/** Datos públicos del artista — sin userId ni datos privados */
export interface PublicArtist {
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
}

/** Respuesta de GET /api/public/pages/by-username/:username */
export interface PublicPageResponse {
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
