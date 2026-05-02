/**
 * admin-guard.ts — server-only guard for /api/admin/* route handlers.
 *
 * Never import this from a Client Component — it reads session cookies
 * and must only run on the server.
 *
 * Usage in a route handler:
 *
 *   const guarded = await requireAdminSession();
 *   if (guarded.error) return guarded.error;
 *   const { session } = guarded;
 */
import { NextResponse } from 'next/server';
import { getSession, type AuthSession } from '@/lib/auth';
import { isBehindOwner } from '@/lib/behind-config';

type AdminGuardOk = { session: AuthSession; error: null };
type AdminGuardErr = { session: null; error: NextResponse };
type AdminGuardResult = AdminGuardOk | AdminGuardErr;

/**
 * Validates that the incoming request carries a valid WorkOS session
 * and that the authenticated user is the Behind the Stage owner.
 *
 * Returns:
 *   { session, error: null }  — caller can proceed
 *   { session: null, error }  — caller must return the error response immediately
 *
 * HTTP semantics:
 *   401 Unauthorized — no valid session (not logged in)
 *   403 Forbidden    — valid session but not an allowed owner email
 */
export async function requireAdminSession(): Promise<AdminGuardResult> {
  const session = await getSession();

  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!isBehindOwner(session.user.email)) {
    return {
      session: null,
      error: NextResponse.json({ message: 'Forbidden' }, { status: 403 }),
    };
  }

  return { session, error: null };
}
