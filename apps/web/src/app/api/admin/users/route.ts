import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-guard';
import { resolveApiBaseUrl } from '@/lib/server/api-base-url';

/**
 * GET /api/admin/users
 *
 * Proxies to the NestJS API endpoint GET /api/admin/users.
 * The NestJS side applies its own AdminOwnerGuard on top of JwtAuthGuard,
 * so the owner check is enforced at both layers.
 *
 * Auth:
 *   401 — no session (checked here before the proxy call)
 *   403 — session exists but email not in owner list (checked here)
 *   502 — NestJS API is unreachable
 */
export async function GET() {
  const guarded = await requireAdminSession();
  if (guarded.error) return guarded.error;

  const apiBaseUrl = resolveApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json({ message: 'API not configured' }, { status: 502 });
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/admin/users`, {
      headers: {
        Authorization: `Bearer ${guarded.session.accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[admin][users] Proxy request failed', error);
    return NextResponse.json({ message: 'Could not fetch users' }, { status: 502 });
  }
}
