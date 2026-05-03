import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse, type NextRequest } from 'next/server';
import { isBehindOwner } from '@/lib/behind-config';

// Force Node.js runtime — withAuth() uses Node-only APIs.
export const runtime = 'nodejs';

/**
 * GET /api/admin/debug/headers
 *
 * Owner-only diagnostic endpoint. Returns the request headers, parsed URL,
 * and the values the middleware would compare against BEHIND_HOST so we can
 * see which header carries the original hostname when the request comes in
 * via behind.stagelink.art vs stagelink.art on Vercel Edge.
 *
 * Hit this from both hosts and diff the responses.
 */
export async function GET(request: NextRequest) {
  const { user } = await withAuth();
  if (!user || !isBehindOwner(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return NextResponse.json({
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
    allHeaders: headers,
  });
}
