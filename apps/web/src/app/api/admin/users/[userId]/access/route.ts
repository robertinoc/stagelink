import { NextRequest, NextResponse } from 'next/server';
import { requireOwnerSession } from '@/lib/admin-guard';
import { resolveApiBaseUrl } from '@/lib/server/api-base-url';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

/**
 * POST /api/admin/users/:userId/access
 * Body: { plan: 'pro' | 'pro_plus', expiresAt: string (ISO), reason?: string }
 *
 * Grants temporary manual access to a user's artist account.
 * Proxies to NestJS POST /api/admin/users/:id/access.
 * Owner-only at the web edge and API layer.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const guarded = await requireOwnerSession();
  if (guarded.error) return guarded.error;

  const apiBaseUrl = resolveApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json({ message: 'API not configured' }, { status: 502 });
  }

  const { userId } = await context.params;
  const body = await request.text();

  try {
    const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/access`, {
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
    console.error('[admin][users][access] POST proxy failed', error);
    return NextResponse.json({ message: 'Could not grant access' }, { status: 502 });
  }
}

/**
 * PATCH /api/admin/users/:userId/access
 * Body: { expiresAt: string (ISO), reason?: string }
 *
 * Extends an existing manual access grant.
 * Proxies to NestJS PATCH /api/admin/users/:id/access.
 * Owner-only at the web edge and API layer.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const guarded = await requireOwnerSession();
  if (guarded.error) return guarded.error;

  const apiBaseUrl = resolveApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json({ message: 'API not configured' }, { status: 502 });
  }

  const { userId } = await context.params;
  const body = await request.text();

  try {
    const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/access`, {
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
    console.error('[admin][users][access] PATCH proxy failed', error);
    return NextResponse.json({ message: 'Could not extend access' }, { status: 502 });
  }
}

/**
 * DELETE /api/admin/users/:userId/access
 *
 * Revokes an existing manual access grant, returning the user to their
 * commercial plan effective access.
 * Proxies to NestJS DELETE /api/admin/users/:id/access.
 * Owner-only at the web edge and API layer.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const guarded = await requireOwnerSession();
  if (guarded.error) return guarded.error;

  const apiBaseUrl = resolveApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json({ message: 'API not configured' }, { status: 502 });
  }

  const { userId } = await context.params;

  try {
    const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/access`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${guarded.session.accessToken}`,
      },
      cache: 'no-store',
    });

    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[admin][users][access] DELETE proxy failed', error);
    return NextResponse.json({ message: 'Could not revoke access' }, { status: 502 });
  }
}
