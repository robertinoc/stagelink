import type { LocalizedTextMap, SupportedLocale } from './i18n';

// ---------------------------------------------------------------------------
// Template & Brand
// ---------------------------------------------------------------------------

export const EPK_TEMPLATE_IDS = ['studio', 'cinematic', 'brutalist'] as const;
export type EpkTemplateId = (typeof EPK_TEMPLATE_IDS)[number];

/** Per-plan template access gate. */
export const EPK_TEMPLATE_ACCESS: Record<string, readonly EpkTemplateId[]> = {
  free: ['studio'],
  pro: ['studio', 'cinematic'],
  pro_plus: ['studio', 'cinematic', 'brutalist'],
};

/** Returns true when userPlan can access the given template. */
export function canAccessEpkTemplate(userPlan: string, templateId: EpkTemplateId): boolean {
  const allowed = EPK_TEMPLATE_ACCESS[userPlan] ?? EPK_TEMPLATE_ACCESS['free'];
  return (allowed as readonly string[]).includes(templateId);
}

/** Minimum plan required to unlock a template. */
export const EPK_TEMPLATE_MIN_PLAN: Record<EpkTemplateId, string> = {
  studio: 'free',
  cinematic: 'pro',
  brutalist: 'pro_plus',
};

export interface EpkBrand {
  /** Preset id ('default' | 'blood' | 'neon' | 'glacial' | 'inverted' | 'rust' | 'custom') */
  id?: string;
  /** Human label shown in the badge */
  name?: string;
  primary: string;
  secondary: string;
  bg: string;
  ink: string;
}

export interface RecordLabel {
  id: string;
  name: string;
  websiteUrl: string | null;
  /** Explicit logo URL. Falls back to Clearbit (logo.clearbit.com) from websiteUrl. */
  logoUrl: string | null;
}

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
  translations: EpkTranslations;
  templateId: EpkTemplateId;
  brand: EpkBrand | null;
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
  translations?: EpkTranslations;
}

export interface EpkInheritedArtistSnapshot {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  /** Full (long-form) bio from the artist profile — used as fallback in EPK editor when epk.fullBio is not yet set. */
  fullBio: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  spotifyUrl: string | null;
  soundcloudUrl: string | null;
  websiteUrl: string | null;
  appleMusicUrl: string | null;
  amazonMusicUrl: string | null;
  deezerUrl: string | null;
  tidalUrl: string | null;
  beatportUrl: string | null;
  traxsourceUrl: string | null;
  contactEmail: string | null;
  category: string;
  secondaryCategories: string[];
  /** Images uploaded to the artist's profile gallery — surfaced here so the
   *  EPK editor can offer them as a pick-from-gallery source without a
   *  separate API call. Up to 6 items, same limit as ProfileGallerySection. */
  profileGalleryUrls: string[];
  /** Record labels from the artist profile — passed through so the EPK editor
   *  can show an inherited preview without a separate API call. */
  recordLabels: RecordLabel[];
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
  appleMusicUrl: string | null;
  amazonMusicUrl: string | null;
  deezerUrl: string | null;
  tidalUrl: string | null;
  beatportUrl: string | null;
  traxsourceUrl: string | null;
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
  recordLabels: RecordLabel[];
  // REQ-11 counters surfaced on the EPK
  epsReleasedCount: number | null;
  externalCollabsCount: number | null;
  recordLabelsCount: number;
  locale?: SupportedLocale;
  contentLocale?: SupportedLocale;
  /** Which visual template to render. Defaults to 'studio' when not set. */
  templateId: EpkTemplateId;
  /** Brand palette for the 'brutalist' template (Pro+ only). */
  brand: EpkBrand | null;
}

// ---------------------------------------------------------------------------
// EPK visible-link limits per billing plan
// ---------------------------------------------------------------------------

/** Maximum number of links a user can mark as visible in their EPK, by plan. */
export const EPK_VISIBLE_LINKS_LIMITS: Record<string, number> = {
  free: 3,
  pro: 6,
  pro_plus: 1000,
};

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
