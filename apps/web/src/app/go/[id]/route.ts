import { notFound } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import type { SmartLinkPlatform, ResolveSmartLinkResponse } from '@stagelink/types';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * GET /go/[id]
 *
 * Smart Link redirect handler.
 *
 * Reads the visitor's User-Agent, detects their platform (ios/android/desktop),
 * calls the backend resolution endpoint, and returns a 302 redirect to the
 * resolved destination URL.
 *
 * Returns 404 (via not-found.tsx) when the smart link is not found, inactive,
 * or has no destination for the visitor's platform and no 'all' catch-all.
 *
 * ─── Platform detection order (most- → least-specific) ───────────────────────
 *
 *   1. iPhone / iPod       — unambiguous iOS UA token
 *   2. Classic iPad        — explicit "iPad" token (iPadOS < 13)
 *   3. iPadOS 13+          — disguises as desktop Safari:
 *                            "Mozilla/5.0 (Macintosh; …) AppleWebKit/… Safari/…"
 *                            Heuristic: Macintosh + AppleWebKit + no Chrome.
 *                            Also matches macOS Safari on MacBooks — biased toward
 *                            'ios' intentionally: App Store / deep links work on
 *                            Apple Silicon Macs too.
 *   4. Android
 *   5. desktop             — default fallback
 *
 *   Known limitation: iPadOS 13+ and macOS Safari share the same UA fingerprint.
 *   The only reliable disambiguator is Sec-CH-UA-Platform (Chrome/Edge only).
 *   Add it as a primary signal once browser support broadens.
 *
 * ─── Analytics attribution ────────────────────────────────────────────────────
 *
 *   Optional `?from=<blockId>:<itemId>` query param lets LinksBlockRenderer
 *   pass block/item context for per-item click attribution. Forwarded verbatim
 *   to the backend resolve endpoint.
 *
 * ─── Rate limiting ────────────────────────────────────────────────────────────
 *
 *   In-memory per-IP sliding window (30 req / 60 s).
 *   ⚠️  Resets on cold starts. Upgrade to Upstash Redis / Vercel KV for
 *   production multi-instance deployments — see src/lib/rate-limit.ts.
 *
 * ─── Security ─────────────────────────────────────────────────────────────────
 *
 *   - smartLinkId is path-encoded via encodeURIComponent.
 *   - Resolved URL is validated as http(s) before issuing the redirect
 *     (defense-in-depth; backend also validates at write time).
 */

export const dynamic = 'force-dynamic';

function detectPlatform(userAgent: string): SmartLinkPlatform {
  if (/iPhone|iPod/i.test(userAgent)) return 'ios';
  if (/iPad/i.test(userAgent)) return 'ios'; // iPadOS < 13

  // iPadOS 13+ disguises as desktop Safari — Macintosh + AppleWebKit, no Chrome.
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

  // Rate limit: 30 requests / 60 s per IP.
  if (!checkRateLimit('go', ip, { windowMs: 60_000, max: 30 })) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': '60' },
    });
  }

  const { id } = await params;
  const userAgent = request.headers.get('user-agent') ?? '';
  const platform = detectPlatform(userAgent);

  // Optional attribution context set by LinksBlockRenderer.
  // Format: encodeURIComponent(`${blockId}:${itemId}`)
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
  // handler must not trust the API response unconditionally. Reject anything
  // that is not a plain http(s) URL to prevent open-redirect / protocol injection.
  const resolvedUrl = body.url;
  if (
    typeof resolvedUrl !== 'string' ||
    (!resolvedUrl.startsWith('http://') && !resolvedUrl.startsWith('https://'))
  ) {
    return new NextResponse('Invalid redirect target', { status: 502 });
  }

  return NextResponse.redirect(resolvedUrl, { status: 302 });
}
