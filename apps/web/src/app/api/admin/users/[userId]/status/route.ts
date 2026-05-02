import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-guard';
import { resolveApiBaseUrl } from '@/lib/server/api-base-url';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

/**
 * PATCH /api/admin/users/:userId/status
 *
 * Body: { "isSuspended": true | false }
 *
 * Proxies to NestJS PATCH /api/admin/users/:id/status.
 * The owner check is enforced here (requireAdminSession) and again
 * on the NestJS side (AdminOwnerGuard).
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const guarded = await requireAdminSession();
  if (guarded.error) return guarded.error;

  const apiBaseUrl = resolveApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json({ message: 'API not configured' }, { status: 502 });
  }

  const { userId } = await context.params;
  const body = await request.text();

  try {
    const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/status`, {
      method: 'PATCH',
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
    console.error('[admin][users][status] Proxy request failed', error);
    return NextResponse.json({ message: 'Could not update user status' }, { status: 502 });
  }
}
