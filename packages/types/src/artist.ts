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
  avatarUrl: string | null;
  coverUrl: string | null;
  category: ArtistCategory;
  secondaryCategories: ArtistCategory[];
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  spotifyUrl: string | null;
  soundcloudUrl: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

import type { BlockType, BlockConfig } from './block';

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
  avatarUrl: string | null;
  coverUrl: string | null;
  category: ArtistCategory;
  secondaryCategories: ArtistCategory[];
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  spotifyUrl: string | null;
  soundcloudUrl: string | null;
  websiteUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
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
