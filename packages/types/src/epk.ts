export interface EpkFeaturedMediaItem {
  id: string;
  title: string;
  url: string;
  provider: 'spotify' | 'soundcloud' | 'youtube' | 'other';
}

export interface EpkFeaturedLinkItem {
  id: string;
  label: string;
  url: string;
}

export interface Epk {
  id: string;
  artistId: string;
  isPublished: boolean;
  headline: string | null;
  shortBio: string | null;
  fullBio: string | null;
  pressQuote: string | null;
  bookingEmail: string | null;
  managementContact: string | null;
  pressContact: string | null;
  heroImageUrl: string | null;
  galleryImageUrls: string[];
  featuredMedia: EpkFeaturedMediaItem[];
  featuredLinks: EpkFeaturedLinkItem[];
  highlights: string[];
  riderInfo: string | null;
  techRequirements: string | null;
  location: string | null;
  availabilityNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateEpkPayload {
  headline?: string | null;
  shortBio?: string | null;
  fullBio?: string | null;
  pressQuote?: string | null;
  bookingEmail?: string | null;
  managementContact?: string | null;
  pressContact?: string | null;
  heroImageUrl?: string | null;
  galleryImageUrls?: string[];
  featuredMedia?: EpkFeaturedMediaItem[];
  featuredLinks?: EpkFeaturedLinkItem[];
  highlights?: string[];
  riderInfo?: string | null;
  techRequirements?: string | null;
  location?: string | null;
  availabilityNotes?: string | null;
}

export interface EpkInheritedArtistSnapshot {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  spotifyUrl: string | null;
  soundcloudUrl: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
  category: string;
  secondaryCategories: string[];
}

export interface EpkEditorResponse {
  epk: Epk;
  inherited: EpkInheritedArtistSnapshot;
}

export interface PublicEpkArtist {
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  spotifyUrl: string | null;
  soundcloudUrl: string | null;
}

export interface PublicEpkResponse {
  artistId: string;
  epkId: string;
  isPublished: boolean;
  artist: PublicEpkArtist;
  headline: string | null;
  shortBio: string | null;
  fullBio: string | null;
  pressQuote: string | null;
  bookingEmail: string | null;
  managementContact: string | null;
  pressContact: string | null;
  heroImageUrl: string | null;
  galleryImageUrls: string[];
  featuredMedia: EpkFeaturedMediaItem[];
  featuredLinks: EpkFeaturedLinkItem[];
  highlights: string[];
  riderInfo: string | null;
  techRequirements: string | null;
  location: string | null;
  availabilityNotes: string | null;
}
