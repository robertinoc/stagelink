/**
 * analytics-flags.ts
 *
 * Utilities to compute T4-4 quality flags for every analytics event.
 *
 * Design decisions:
 *  - We PERSIST every event. Dropping events loses debugging data and makes
 *    it impossible to retroactively improve metrics.
 *  - Flags are set at write time; clean dashboard metrics filter at query time.
 *  - Bot detection uses a lightweight UA regex. False-negative bots that slip
 *    through will be caught by PostHog's server-side bot filtering (belt and
 *    suspenders). The goal here is to flag obvious crawlers, not to be perfect.
 *  - "Internal" traffic = X-SL-Internal: 1 header. NOT YET IMPLEMENTED —
 *    nothing in the web tier sends this header. Planned for the artist dashboard
 *    "Preview page" feature.
 *  - "QA" traffic = X-SL-QA: 1 (set by web layer from `?sl_qa=1` cookie).
 */

import { AnalyticsEnvironment } from '@prisma/client';

// ─── Bot detection ────────────────────────────────────────────────────────────

/** Known bot / crawler / tool User-Agent patterns. */
const BOT_UA_RE =
  /bot|crawl|spider|slurp|mediapartners|feedfetcher|facebookexternalhit|whatsapp|twitterbot|linkedinbot|pinterest|shoebox|semrush|ahrefs|mj12|dotbot|baiduspider|yandex|sogou|exabot|ia_archiver|archive\.org|wget|curl|python-requests|go-http-client|okhttp|java\/|libwww|scrapy|mechanize|htmlunit|headlesschrome|phantomjs|puppeteer|playwright|selenium/i;

/**
 * Returns true if the User-Agent string looks like an automated client.
 *
 * Two detection rules, intentionally asymmetric:
 *
 * 1. Empty / missing UA → always bot.
 *    Real browsers always send a User-Agent. An absent or blank UA is a
 *    strong signal of an HTTP tool (curl, wget, health-check) or a
 *    misconfigured client. We flag aggressively here because there is
 *    almost no legitimate fan traffic with no UA.
 *
 * 2. Non-empty UA → pattern-matched against BOT_UA_RE.
 *    Here we are deliberately conservative (false-negative bias): if the
 *    UA doesn't match any known bot pattern, we assume it's a real visitor.
 *    Better to count a sneaky bot than to lose real fan engagement data.
 *    PostHog's server-side bot filtering provides a second independent layer.
 */
export function detectBotFromUserAgent(ua: string | undefined | null): boolean {
  if (!ua || ua.trim() === '') {
    return true;
  }
  return BOT_UA_RE.test(ua);
}

// ─── Traffic flag resolution ─────────────────────────────────────────────────

export interface TrafficFlagContext {
  /** Raw User-Agent header value. */
  userAgent?: string | null;
  /** X-SL-QA header value — '1' means QA mode was enabled client-side. */
  slQaHeader?: string | null;
  /**
   * X-SL-Internal header value — '1' marks dashboard-preview traffic.
   *
   * @todo NOT YET IMPLEMENTED on the web tier. Nothing in public-api.ts or
   * track.ts currently sets this header. The feature is planned for the artist
   * dashboard "Preview page". Until that ships, isInternal is always false and
   * is excluded from the analytics QUALITY_FILTER to avoid misleading no-ops.
   * When the preview feature is implemented, restore `isInternal: false` to
   * QUALITY_FILTER in analytics.service.ts.
   */
  slInternalHeader?: string | null;
  /** X-SL-AC header value — '1' = consent accepted, '0' = rejected. */
  slAcHeader?: string | null;
  /** NODE_ENV / app environment string. Defaults to 'production'. */
  appEnvironment?: string | null;
}

export interface TrafficFlags {
  isBotSuspected: boolean;
  isInternal: boolean;
  isQa: boolean;
  /** null = server-side event / cookie not present → consent unknown. */
  hasTrackingConsent: boolean | null;
  environment: AnalyticsEnvironment;
}

/**
 * Resolves all T4-4 quality flags from the HTTP context of a request.
 *
 * Call once per incoming event and spread the result into the Prisma
 * `analyticsEvents.create` data object.
 *
 * @example
 * ```ts
 * const flags = resolveTrafficFlags({
 *   userAgent: req.headers['user-agent'],
 *   slQaHeader: req.headers['x-sl-qa'],
 *   slInternalHeader: req.headers['x-sl-internal'],
 *   slAcHeader: req.headers['x-sl-ac'],
 *   appEnvironment: process.env.NODE_ENV,
 * });
 * await prisma.analyticsEvent.create({ data: { ...coreFields, ...flags } });
 * ```
 */
export function resolveTrafficFlags(ctx: TrafficFlagContext): TrafficFlags {
  const isBotSuspected = detectBotFromUserAgent(ctx.userAgent);
  const isQa = ctx.slQaHeader === '1';
  const isInternal = ctx.slInternalHeader === '1';

  // Consent: only meaningful when the client forwarded the cookie value.
  // null = we don't know (server-side origin, no cookie forwarded).
  let hasTrackingConsent: boolean | null = null;
  if (ctx.slAcHeader === '1') {
    hasTrackingConsent = true;
  } else if (ctx.slAcHeader === '0') {
    hasTrackingConsent = false;
  }

  // Map NODE_ENV / appEnvironment to the AnalyticsEnvironment enum.
  // Unrecognised values (e.g. 'test', 'ci') fall back to 'development' so they
  // are never confused with real production traffic.
  const rawEnv = ctx.appEnvironment ?? process.env.NODE_ENV ?? 'production';
  let environment: AnalyticsEnvironment;
  if (rawEnv === 'staging') {
    environment = AnalyticsEnvironment.staging;
  } else if (rawEnv === 'production') {
    environment = AnalyticsEnvironment.production;
  } else {
    // 'development', 'test', 'ci', or any unrecognised value → development
    environment = AnalyticsEnvironment.development;
  }

  return { isBotSuspected, isInternal, isQa, hasTrackingConsent, environment };
}
