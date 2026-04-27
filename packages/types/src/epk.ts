import type { LocalizedTextMap, SupportedLocale } from './i18n';

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

export interface EpkPublishReadinessInput {
  headline?: string | null;
  shortBio?: string | null;
  fullBio?: string | null;
  featuredMedia?: Pick<EpkFeaturedMediaItem, 'title' | 'url'>[];
  galleryImageUrls?: string[];
  bookingEmail?: string | null;
  managementContact?: string | null;
  pressContact?: string | null;
}

export interface EpkPublishReadiness {
  ready: boolean;
  missing: string[];
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export function getEpkPublishReadiness(input: EpkPublishReadinessInput): EpkPublishReadiness {
  const missing: string[] = [];

  if (!hasText(input.headline)) missing.push('Headline');
  if (!hasText(input.shortBio)) missing.push('Short bio');
  if (!hasText(input.fullBio)) missing.push('Full bio');

  const hasFeaturedVisualContent =
    (input.featuredMedia ?? []).some((item) => hasText(item.title) && hasText(item.url)) ||
    (input.galleryImageUrls ?? []).length > 0;
  if (!hasFeaturedVisualContent) missing.push('Featured media or gallery image');

  const hasPublicContact =
    hasText(input.bookingEmail) || hasText(input.managementContact) || hasText(input.pressContact);
  if (!hasPublicContact) missing.push('At least one public contact');

  return {
    ready: missing.length === 0,
    missing,
  };
}

export interface Epk {
  id: string;
  artistId: string;
  isPublished: boolean;
  baseLocale: SupportedLocale;
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
  recordLabels: string | null;
  translations: EpkTranslations;
  createdAt: string;
  updatedAt: string;
}

export interface EpkTranslations {
  headline?: LocalizedTextMap;
  shortBio?: LocalizedTextMap;
  fullBio?: LocalizedTextMap;
  pressQuote?: LocalizedTextMap;
  riderInfo?: LocalizedTextMap;
  techRequirements?: LocalizedTextMap;
  availabilityNotes?: LocalizedTextMap;
}

export interface UpdateEpkPayload {
  baseLocale?: SupportedLocale;
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
  recordLabels?: string | null;
  translations?: EpkTranslations;
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
  /** Images uploaded to the artist's profile gallery — surfaced here so the
   *  EPK editor can offer them as a pick-from-gallery source without a
   *  separate API call. Up to 6 items, same limit as ProfileGallerySection. */
  profileGalleryUrls: string[];
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
  baseLocale: SupportedLocale;
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
  recordLabels: string | null;
  locale?: SupportedLocale;
  contentLocale?: SupportedLocale;
}

// ---------------------------------------------------------------------------
// AI Bio Generation
// ---------------------------------------------------------------------------

export const EPK_AI_TONES = ['professional', 'casual', 'creative'] as const;
export type EpkAiTone = (typeof EPK_AI_TONES)[number];

export interface EpkGenerateBioRequest {
  /** Artist genre or style, e.g. "Indie pop / dream pop" */
  genre: string;
  /** Optional: comma-separated key influences or similar artists */
  influences?: string;
  /** Optional: notable career moments, releases, venues */
  highlights?: string[];
  /** Tone for the generated copy */
  tone: EpkAiTone;
}

export interface EpkGenerateBioResponse {
  headline: string;
  shortBio: string;
  fullBio: string;
  pressQuote: string;
}
