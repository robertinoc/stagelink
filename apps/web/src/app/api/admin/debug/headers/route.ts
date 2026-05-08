import { NextResponse, type NextRequest } from 'next/server';
import { collectAdminDebugHeaders, isAdminDebugHeadersEnabled } from '@/lib/admin-debug-headers';
import { requireOwnerSession } from '@/lib/admin-guard';

// Force Node.js runtime because auth/session helpers use Node-only APIs.
export const runtime = 'nodejs';

/**
 * GET /api/admin/debug/headers
 *
 * Owner-only diagnostic endpoint. Disabled by default. When explicitly enabled,
 * returns redacted request headers, parsed URL and the values the middleware
 * would compare against BEHIND_HOST so we can see which header carries the
 * original hostname when the request comes in via behind.stagelink.art vs
 * stagelink.art on Vercel Edge.
 *
 * Set BEHIND_DEBUG_HEADERS_ENABLED=true only during an approved diagnostic
 * window, then redeploy with it removed/false.
 */
export async function GET(request: NextRequest) {
  if (!isAdminDebugHeadersEnabled()) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const guarded = await requireOwnerSession();
  if (guarded.error) return guarded.error;

  return NextResponse.json(
    {
      hostnameSources: {
        'request.headers.get("host")': request.headers.get('host'),
        'request.headers.get("x-forwarded-host")': request.headers.get('x-forwarded-host'),
        'request.nextUrl.hostname': request.nextUrl.hostname,
        'request.nextUrl.host': request.nextUrl.host,
      },
      requestUrl: request.url,
      nextUrl: {
        href: request.nextUrl.href,
        origin: request.nextUrl.origin,
        protocol: request.nextUrl.protocol,
        hostname: request.nextUrl.hostname,
        pathname: request.nextUrl.pathname,
      },
      headers: collectAdminDebugHeaders(request.headers),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
