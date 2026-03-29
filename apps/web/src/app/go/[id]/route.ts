import { notFound } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import type { SmartLinkPlatform, ResolveSmartLinkResponse } from '@stagelink/types';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * GET /go/[id]
 *
 * Smart Link redirect handler.
 *
 * Reads the visitor's User-Agent (and Sec-CH-UA-Platform when available),
 * detects their platform (ios/android/desktop), calls the backend resolution
 * endpoint, and returns a 302 redirect to the resolved destination URL.
 *
 * Returns 404 (via not-found.tsx) when the smart link is not found, inactive,
 * or has no destination for the visitor's platform and no 'all' catch-all.
 *
 * ─── Platform detection order (most- → least-specific) ───────────────────────
 *
 *   0. Sec-CH-UA-Platform client hint (Chromium only, authoritative).
 *      Present for Chrome/Edge — eliminates the macOS-vs-iPadOS ambiguity for
 *      those browsers. Safari does not send this header.
 *   1. iPhone / iPod       — unambiguous iOS UA token
 *   2. Classic iPad        — explicit "iPad" token (iPadOS < 13)
 *   3. iPadOS 13+          — disguises as desktop Safari:
 *                            "Mozilla/5.0 (Macintosh; …) AppleWebKit/… Safari/…"
 *                            Heuristic: Macintosh + AppleWebKit + no Chrome.
 *                            ⚠️  Also matches macOS Safari on MacBooks (Intel).
 *                            Biased toward 'ios' intentionally: App Store / deep
 *                            links work on Apple Silicon Macs too.
 *   4. Android
 *   5. desktop             — default fallback
 *
 *   Known limitation: iPadOS 13+ and macOS Safari (Intel) share the same UA
 *   fingerprint. Sec-CH-UA-Platform only helps for Chromium browsers.
 *   True disambiguation for Safari requires client-side JS (maxTouchPoints).
 *
 * ─── Bot detection ────────────────────────────────────────────────────────────
 *
 *   Known bot UAs are excluded from the rate limit counter so crawlers sharing
 *   an IP with real users don't consume their quota.
 *
 * ─── Analytics attribution ────────────────────────────────────────────────────
 *
 *   Optional `?from=<blockId>:<itemId>` query param lets LinksBlockRenderer
 *   pass block/item context for per-item click attribution. Forwarded to the
 *   backend resolve endpoint (further validated there: max length + format).
 *
 * ─── Rate limiting ────────────────────────────────────────────────────────────
 *
 *   In-memory per-IP fixed window (30 req / 60 s). Bots excluded.
 *   ⚠️  Resets on cold starts. Upgrade to Upstash Redis / Vercel KV for
 *   production multi-instance deployments — see src/lib/rate-limit.ts.
 *
 * ─── Security ─────────────────────────────────────────────────────────────────
 *
 *   - smartLinkId is path-encoded via encodeURIComponent.
 *   - Resolved URL is validated with the URL constructor (protocol check) before
 *     issuing the redirect — defense-in-depth; backend also validates at write time.
 *   - 302 response carries Cache-Control: no-store to prevent stale redirects.
 *
 * ─── TODO (P3) ────────────────────────────────────────────────────────────────
 *
 *   - OG meta tag preview page for social scrapers (return HTML instead of 302).
 *   - Artist preview mode: `?preview=1` + artist auth to test inactive links.
 */

export const dynamic = 'force-dynamic';

/** Bot UA pattern — excludes crawlers from rate limit counters. */
const BOT_UA_PATTERN =
  /bot|crawler|spider|crawling|slurp|googlebot|bingbot|yandexbot|duckduckbot|facebot|ia_archiver|semrushbot|ahrefsbot|applebot/i;

function isBot(userAgent: string): boolean {
  return BOT_UA_PATTERN.test(userAgent);
}

/**
 * Detects the visitor's device platform from request headers.
 *
 * Prioritises the authoritative Sec-CH-UA-Platform client hint (Chromium only),
 * then falls back to User-Agent string parsing.
 */
function detectPlatform(userAgent: string, secChUaPlatform?: string | null): SmartLinkPlatform {
  // Step 0: Sec-CH-UA-Platform (Chrome/Edge only).
  // Value is a quoted string e.g. `"macOS"`, `"Android"`, `"iOS"`.
  if (secChUaPlatform) {
    const p = secChUaPlatform.replace(/"/g, '').toLowerCase();
    if (p === 'ios' || p === 'ipados') return 'ios';
    if (p === 'android') return 'android';
    if (p === 'macos' || p === 'windows' || p === 'linux' || p === 'chromeos') return 'desktop';
    // Unknown value — fall through to UA parsing.
  }

  if (/iPhone|iPod/i.test(userAgent)) return 'ios';
  if (/iPad/i.test(userAgent)) return 'ios'; // iPadOS < 13

  // iPadOS 13+ disguises as desktop Safari — Macintosh + AppleWebKit, no Chrome.
  // ⚠️  Also matches macOS Safari on Intel Macs (no reliable server-side fix for Safari).
  if (
    /Macintosh/i.test(userAgent) &&
    /AppleWebKit/i.test(userAgent) &&
    !/Chrome/i.test(userAgent)
  ) {
    return 'ios';
  }

  if (/Android/i.test(userAgent)) return 'android';
  return 'desktop';
}

/**
 * Extract the original client IP from a potentially comma-separated
 * X-Forwarded-For header (format: client, proxy1, proxy2).
 * Falls back to X-Real-IP, then 'unknown'.
 *
 * Ensure your reverse proxy strips untrusted client-supplied XFF values so
 * the leftmost entry is always the real client (not attacker-controlled).
 */
function extractIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for') ?? '';
  return xff.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = extractIp(request);
  const userAgent = request.headers.get('user-agent') ?? '';

  // Bots are excluded from rate limiting — they must not consume quota that
  // belongs to real users sharing the same IP (corporate/school networks).
  if (!isBot(userAgent)) {
    if (!checkRateLimit('go', ip, { windowMs: 60_000, max: 30 })) {
      return new NextResponse('Too many requests', {
        status: 429,
        headers: { 'Retry-After': '60' },
      });
    }
  }

  const { id } = await params;
  const secChUaPlatform = request.headers.get('sec-ch-ua-platform');
  const platform = detectPlatform(userAgent, secChUaPlatform);

  // Optional attribution context set by LinksBlockRenderer.
  // Format: encodeURIComponent(`${blockId}:${itemId}`)
  // Further validated server-side (length + format regex) before reaching the audit log.
  const from = request.nextUrl.searchParams.get('from') ?? undefined;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  const resolveUrl = new URL(`/api/public/smart-links/${encodeURIComponent(id)}/resolve`, apiUrl);
  resolveUrl.searchParams.set('platform', platform);
  if (from) resolveUrl.searchParams.set('from', from);

  let resolveResponse: Response;
  try {
    resolveResponse = await fetch(resolveUrl.toString(), { cache: 'no-store' });
  } catch {
    return new NextResponse('Service unavailable', { status: 503 });
  }

  if (resolveResponse.status === 404) {
    // Renders apps/web/src/app/go/[id]/not-found.tsx with HTTP 404.
    notFound();
  }

  if (!resolveResponse.ok) {
    return new NextResponse('Unexpected error', { status: 502 });
  }

  const body = (await resolveResponse.json()) as ResolveSmartLinkResponse;

  // Defense-in-depth: backend validates URLs at write time, but the redirect
  // handler must not trust the API response unconditionally. Use the URL
  // constructor for robust protocol extraction (handles encoding edge cases).
  const resolvedUrl = body.url;
  try {
    const parsed = new URL(resolvedUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return new NextResponse('Invalid redirect target', { status: 502 });
    }
  } catch {
    return new NextResponse('Invalid redirect target', { status: 502 });
  }

  // Cache-Control: no-store — platform detection is per-request and destinations
  // can change (or be deactivated) at any time. Cached redirects would be stale.
  return NextResponse.redirect(resolvedUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
