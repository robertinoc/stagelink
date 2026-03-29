// =============================================================
// Smart Link types — shared between API and web.
// A SmartLink is a single short URL that redirects visitors to
// different destinations based on their device platform.
//
// Resolution priority (evaluated top to bottom):
//   1. Destination with platform matching the visitor's device
//   2. Destination with platform === 'all' (catch-all)
//   3. 404 (no fallback found)
// =============================================================

export const SMART_LINK_PLATFORMS = ['ios', 'android', 'desktop', 'all'] as const;
export type SmartLinkPlatform = (typeof SMART_LINK_PLATFORMS)[number];

/**
 * Maximum URL length for SmartLink destinations and link items.
 * Single source of truth — used by the API service, block-config schema, and form inputs.
 * RFC 9110 has no hard limit; 2048 chars is a safe practical limit that avoids
 * issues with older browsers and proxies.
 */
export const MAX_URL_LENGTH = 2_048;

/**
 * A single redirect target within a SmartLink.
 * Stored as a JSON array on the SmartLink model.
 */
export interface SmartLinkDestination {
  /** Stable client-generated UUID. Used to identify the destination on updates. */
  id: string;
  /** Platform this destination targets. 'all' is the catch-all fallback. */
  platform: SmartLinkPlatform;
  /** The URL visitors are redirected to. Must be https:// or http://. */
  url: string;
  /**
   * Optional internal label for the artist's dashboard only, e.g. "App Store".
   * Not shown to visitors — not part of the redirect or public page rendering.
   */
  label?: string;
}

/** Full SmartLink entity as returned by the API. */
export interface SmartLink {
  id: string;
  artistId: string;
  /** Internal label for the artist's dashboard, e.g. "New Album". */
  label: string;
  destinations: SmartLinkDestination[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── API payloads ─────────────────────────────────────────────────────────────

export interface CreateSmartLinkPayload {
  label: string;
  destinations: Omit<SmartLinkDestination, 'id'>[];
}

export interface UpdateSmartLinkPayload {
  label?: string;
  destinations?: SmartLinkDestination[];
  isActive?: boolean;
}

/** Response from the public resolution endpoint. */
export interface ResolveSmartLinkResponse {
  url: string;
}
