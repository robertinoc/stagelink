/**
 * admin-guard.ts — server-only guards for /api/admin/* route handlers.
 *
 * Never import this from a Client Component — it reads session cookies
 * and must only run on the server.
 *
 * Two guards:
 *   requireAdminSession() — owner OR admin (access to the panel and its APIs)
 *   requireOwnerSession() — owner only (role management)
 */
import { NextResponse } from 'next/server';
import { getSession, type AuthSession } from '@/lib/auth';
import { getBehindRole, type BehindRole } from '@/lib/behind-redis';

type AdminGuardOk = { session: AuthSession; role: BehindRole; error: null };
type AdminGuardErr = { session: null; role: null; error: NextResponse };
type AdminGuardResult = AdminGuardOk | AdminGuardErr;

/**
 * Requires a valid WorkOS session where the user is an owner OR admin.
 * Used by all /api/admin/* routes that the admin panel calls.
 */
export async function requireAdminSession(): Promise<AdminGuardResult> {
  const session = await getSession();

  if (!session) {
    return {
      session: null,
      role: null,
      error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  const role = await getBehindRole(session.user.email);

  if (!role) {
    return {
      session: null,
      role: null,
      error: NextResponse.json({ message: 'Forbidden' }, { status: 403 }),
    };
  }

  return { session, role, error: null };
}

/**
 * Requires a valid WorkOS session where the user is an owner.
 * Used by role management routes (/api/admin/behind-roles).
 */
export async function requireOwnerSession(): Promise<AdminGuardResult> {
  const session = await getSession();

  if (!session) {
    return {
      session: null,
      role: null,
      error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  const role = await getBehindRole(session.user.email);

  if (role !== 'owner') {
    return {
      session: null,
      role: null,
      error: NextResponse.json({ message: 'Forbidden — owners only' }, { status: 403 }),
    };
  }

  return { session, role, error: null };
}
