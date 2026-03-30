// ─── Range ────────────────────────────────────────────────────────────────────

export const ANALYTICS_RANGES = ['7d', '30d', '90d'] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

/** Days covered by each preset range. */
export const RANGE_DAYS: Record<AnalyticsRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

// ─── Top links ────────────────────────────────────────────────────────────────

export interface TopLinkDto {
  /** Stable identifier for this link item inside the block config. */
  linkItemId: string;
  /** Human-readable label as configured by the artist. */
  label: string | null;
  /** Block this link belongs to. */
  blockId: string | null;
  /** Total clicks in the requested range. */
  clicks: number;
  /** True when this link routes through a Smart Link. */
  isSmartLink: boolean;
  /** Smart Link ID — only set when isSmartLink = true. */
  smartLinkId: string | null;
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export interface AnalyticsSummaryDto {
  /** Total public page loads in the range (includes bots filtered at ingestion). */
  pageViews: number;
  /**
   * Total link/CTA clicks in the range.
   * Includes both regular links and smart links — each click = one event.
   */
  linkClicks: number;
  /**
   * Click-through rate: linkClicks / pageViews.
   * Returns 0 when pageViews = 0 to avoid division-by-zero.
   * Formula: round(linkClicks / pageViews, 4) — expressed as a decimal (e.g. 0.17 = 17 %).
   */
  ctr: number;
  /** Total Smart Link resolutions in the range (independent from link_click events). */
  smartLinkResolutions: number;
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export interface AnalyticsNotesDto {
  /**
   * Quality tier of this data.
   * - 'basic': raw counts, basic bot filtering at ingestion, no deduplication.
   * Future: 'standard' (deduped), 'advanced' (enriched with geo/device, T4-4).
   */
  dataQuality: 'basic';
  /**
   * Whether IP-based bot filtering was applied at ingestion.
   * Basic UA-pattern filtering is applied in public-pages.service (isBotUserAgent).
   * Full bot filtering (IP reputation, headless browser detection) ships in T4-4.
   */
  botFilteringApplied: boolean;
  /**
   * Whether IP-hash-based unique visitor deduplication is applied on reads.
   * Currently false — all events are counted, including repeat visits from the same IP.
   * Proper deduplication ships in T4-4.
   */
  deduplicationApplied: boolean;
}

// ─── Full response ────────────────────────────────────────────────────────────

export interface AnalyticsOverviewDto {
  artistId: string;
  /** Requested range preset, e.g. '30d'. */
  range: AnalyticsRange;
  summary: AnalyticsSummaryDto;
  /** Top 10 link items by click count, descending. */
  topLinks: TopLinkDto[];
  notes: AnalyticsNotesDto;
}
