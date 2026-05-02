import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-guard';
import { resolveApiBaseUrl } from '@/lib/server/api-base-url';

/**
 * POST /api/admin/invitations
 *
 * Body: { "email": "someone@example.com" }
 *
 * Proxies to NestJS POST /api/admin/invitations, which calls WorkOS
 * sendInvitation so the user receives a sign-up link via email.
 * The owner check is enforced here (requireAdminSession) and again
 * on the NestJS side (AdminOwnerGuard).
 */
export async function POST(request: NextRequest) {
  const guarded = await requireAdminSession();
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
