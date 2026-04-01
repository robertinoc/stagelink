// =============================================================
// StageLink Analytics — event catalog and property types.
//
// This is the single source of truth for event names and
// property shapes used by both the web and API tiers.
//
// Naming convention: snake_case, past participle for all events
// (describes a completed action: page_viewed, link_clicked, etc.)
// =============================================================

// ─── Event names ──────────────────────────────────────────────────────────────

/**
 * All event names emitted by StageLink.
 * Use these constants instead of raw strings — prevents typos and enables
 * find-all-references across the codebase.
 */
export const ANALYTICS_EVENTS = {
  // ── Public / visitor ──────────────────────────────────────
  /** A visitor loaded a public artist page. Emitted server-side. */
  PUBLIC_PAGE_VIEWED: 'public_page_viewed',
  /** A visitor clicked a link/CTA item on a public page. Emitted client-side. */
  PUBLIC_LINK_CLICKED: 'public_link_clicked',
  /** A Smart Link was resolved to a platform-specific destination. Emitted server-side. */
  SMART_LINK_RESOLVED: 'smart_link_resolved',
  /** A visitor submitted their email on a fan capture block. Emitted server-side. */
  FAN_CAPTURE_SUBMITTED: 'fan_capture_submitted',

  // ── Product / dashboard ───────────────────────────────────
  /** An artist completed the onboarding wizard. */
  ONBOARDING_COMPLETED: 'onboarding_completed',
  /** An artist updated their profile (bio, avatar, social links, SEO). */
  ARTIST_PROFILE_UPDATED: 'artist_profile_updated',
  /** A block was created. */
  BLOCK_CREATED: 'block_created',
  /** A block's config or title was updated. */
  BLOCK_UPDATED: 'block_updated',
  /** A block was deleted. */
  BLOCK_DELETED: 'block_deleted',
  /** A block was published (made visible on the public page). */
  BLOCK_PUBLISHED: 'block_published',
  /** A block was unpublished (hidden from the public page). */
  BLOCK_UNPUBLISHED: 'block_unpublished',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

// ─── Shared base properties ───────────────────────────────────────────────────

interface BasePublicProps {
  /** Internal artist ID (stable UUID). Never expose usernames alone. */
  artist_id: string;
  /** Artist username — human-readable context for PostHog dashboards. */
  username: string;
  /** App environment: production | staging | development. */
  environment: string;
}

interface BaseDashboardProps {
  /** Internal user ID of the authenticated actor. */
  actor_user_id: string;
  /** Internal artist ID the action is scoped to. */
  artist_id: string;
  /** App environment. */
  environment: string;
}

// ─── Public event properties ──────────────────────────────────────────────────

export interface PublicPageViewProps extends BasePublicProps {
  page_id: string;
  /** Locale detected from Accept-Language. */
  locale: string;
  /** Referrer domain only — not the full URL (privacy). */
  referrer_domain?: string;
  /** Platform inferred from Sec-CH-UA-Platform or User-Agent. */
  platform_detected?: string;
}

export interface PublicLinkClickProps extends BasePublicProps {
  page_id: string;
  block_id: string;
  /** Always 'links' for now. Extensible for future block types. */
  block_type: string;
  link_item_id: string;
  label: string;
  /** Destination domain only — not the full URL (privacy). */
  destination_domain?: string;
  is_smart_link: boolean;
  smart_link_id?: string;
}

export interface SmartLinkResolvedProps {
  smart_link_id: string;
  artist_id: string;
  /** Platform detected server-side (ios | android | desktop). */
  platform_detected: string;
  /** The platform of the destination that was chosen. */
  resolved_platform: string;
  /** True if the 'all' catch-all was used instead of an exact match. */
  fallback_used: boolean;
  environment: string;
}

export interface FanCaptureSubmitProps extends BasePublicProps {
  page_id: string;
  block_id: string;
  /** Whether the DB write succeeded. */
  success: boolean;
}

// ─── Dashboard event properties ───────────────────────────────────────────────

export interface OnboardingCompletedProps extends BaseDashboardProps {
  username: string;
}

export interface ArtistProfileUpdatedProps extends BaseDashboardProps {
  /** Fields that were changed, e.g. ['bio', 'avatar_url']. */
  updated_fields: string[];
}

export interface BlockLifecycleProps extends BaseDashboardProps {
  block_id: string;
  block_type: string;
  page_id: string;
  /** Fields changed — only present on block_updated events. */
  updated_fields?: string[];
}
