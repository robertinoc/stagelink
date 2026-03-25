export type ArtistCategory =
  | 'musician'
  | 'dj'
  | 'actor'
  | 'comedian'
  | 'dancer'
  | 'producer'
  | 'other';

export interface Artist {
  id: string;
  userId: string;
  username: string; // unique, resolves public URL
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  category: ArtistCategory;
  customDomain?: string; // future support
  createdAt: Date;
  updatedAt: Date;
}
