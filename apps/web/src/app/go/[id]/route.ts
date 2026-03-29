import { NextRequest, NextResponse } from 'next/server';
import type { SmartLinkPlatform, ResolveSmartLinkResponse } from '@stagelink/types';

/**
 * GET /go/[id]
 *
 * Smart Link redirect handler.
 *
 * Reads the visitor's User-Agent, detects their platform (ios/android/desktop),
 * calls the backend resolution endpoint, and returns a 302 redirect to the
 * resolved destination URL.
 *
 * Returns 404 if the smart link is not found, inactive, or has no matching
 * destination for the visitor's platform (and no 'all' catch-all).
 *
 * Security: smartLinkId comes from the URL path and is forwarded to the
 * backend as a path parameter — it is never interpolated into a query string
 * without encoding. The backend owns resolution and access control.
 *
 * Caching: no-store — each visit must resolve fresh (platform may differ per
 * visitor; smart link destinations can be updated any time).
 */

function detectPlatform(userAgent: string): SmartLinkPlatform {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  return 'desktop';
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userAgent = request.headers.get('user-agent') ?? '';
  const platform = detectPlatform(userAgent);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  let resolveResponse: Response;
  try {
    resolveResponse = await fetch(
      `${apiUrl}/api/public/smart-links/${encodeURIComponent(id)}/resolve?platform=${platform}`,
      { cache: 'no-store' },
    );
  } catch {
    return new NextResponse('Service unavailable', { status: 503 });
  }

  if (resolveResponse.status === 404) {
    return new NextResponse('Smart link not found', { status: 404 });
  }

  if (!resolveResponse.ok) {
    return new NextResponse('Unexpected error', { status: 502 });
  }

  const body = (await resolveResponse.json()) as ResolveSmartLinkResponse;

  return NextResponse.redirect(body.url, { status: 302 });
}
