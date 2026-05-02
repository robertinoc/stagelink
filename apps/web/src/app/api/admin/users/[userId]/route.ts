import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-guard';
import { resolveApiBaseUrl } from '@/lib/server/api-base-url';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

/**
 * PATCH /api/admin/users/:userId
 *
 * Body: { firstName?: string; lastName?: string }
 *
 * Proxies to NestJS PATCH /api/admin/users/:id.
 * Only firstName and lastName are mutable — email and handle are not.
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
    const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}`, {
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
    console.error('[admin][users][patch] Proxy request failed', error);
    return NextResponse.json({ message: 'Could not update user' }, { status: 502 });
  }
}

/**
 * DELETE /api/admin/users/:userId
 *
 * Soft-deletes the user (sets deletedAt). Returns 204 on success.
 * Hard delete is deferred to V2 — see AdminService.softDeleteUser() for rationale.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const guarded = await requireAdminSession();
  if (guarded.error) return guarded.error;

  const apiBaseUrl = resolveApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json({ message: 'API not configured' }, { status: 502 });
  }

  const { userId } = await context.params;

  try {
    const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${guarded.session.accessToken}`,
      },
      cache: 'no-store',
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[admin][users][delete] Proxy request failed', error);
    return NextResponse.json({ message: 'Could not delete user' }, { status: 502 });
  }
}
