import { NextRequest, NextResponse } from 'next/server';
import { requireOwnerSession } from '@/lib/admin-guard';
import { resolveApiBaseUrl } from '@/lib/server/api-base-url';

/**
 * POST /api/admin/invitations
 *
 * Body: { "email": "someone@example.com" }
 *
 * Proxies to NestJS POST /api/admin/invitations, which calls WorkOS
 * sendInvitation so the user receives a sign-up link via email.
 * Owner-only at the web edge and API layer.
 */
export async function POST(request: NextRequest) {
  const guarded = await requireOwnerSession();
  if (guarded.error) return guarded.error;

  const apiBaseUrl = resolveApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json({ message: 'API not configured' }, { status: 502 });
  }

  const body = await request.text();

  try {
    const response = await fetch(`${apiBaseUrl}/api/admin/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${guarded.session.accessToken}`,
      },
      body,
      cache: 'no-store',
    });

    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[admin][invitations] Proxy request failed', error);
    return NextResponse.json({ message: 'Could not send invitation' }, { status: 502 });
  }
}
