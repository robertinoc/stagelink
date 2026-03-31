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
 *  - "Internal" traffic = Cloudflare/internal headers OR the special
 *    X-SL-Internal header forwarded by the web layer when the request
 *    originates from the artist's own dashboard preview.
 *  - "QA" traffic = X-SL-QA: 1 (set by web layer from `?sl_qa=1` cookie).
 */

// ─── Bot detection ────────────────────────────────────────────────────────────

/** Known bot / crawler / tool User-Agent patterns. */
const BOT_UA_RE =
  /bot|crawl|spider|slurp|mediapartners|feedfetcher|facebookexternalhit|whatsapp|twitterbot|linkedinbot|pinterest|shoebox|semrush|ahrefs|mj12|dotbot|baiduspider|yandex|sogou|exabot|ia_archiver|archive\.org|wget|curl|python-requests|go-http-client|okhttp|java\/|libwww|scrapy|mechanize|htmlunit|headlesschrome|phantomjs|puppeteer|playwright|selenium/i;

/**
 * Returns true if the User-Agent string looks like an automated client.
 *
 * Conservative on purpose: better to let a bot through (false-negative) and
 * keep the event with isBotSuspected=false than to flag a real fan.
 * Dashboard can always add stricter server-side filtering later.
 */
export function detectBotFromUserAgent(ua: string | undefined | null): boolean {
  if (!ua || ua.trim() === '') {
    // Empty / missing UA is suspicious but not conclusive.
    // We flag it as a potential bot.
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
  /** X-SL-Internal header value — '1' marks dashboard-preview traffic. */
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
  /** 'production' | 'staging' | 'development' */
  environment: string;
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

  // Normalise environment to one of the three known values.
  const rawEnv = ctx.appEnvironment ?? process.env.NODE_ENV ?? 'production';
  let environment = 'production';
  if (rawEnv === 'development' || rawEnv === 'test') {
    environment = 'development';
  } else if (rawEnv === 'staging') {
    environment = 'staging';
  }

  return { isBotSuspected, isInternal, isQa, hasTrackingConsent, environment };
}
