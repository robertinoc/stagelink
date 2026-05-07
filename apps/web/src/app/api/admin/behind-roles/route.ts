import { NextRequest, NextResponse } from 'next/server';
import { requireOwnerSession } from '@/lib/admin-guard';
import { getMergedRoles, setRole, type BehindRole } from '@/lib/behind-redis';
import { BEHIND_OWNER_EMAILS } from '@/lib/behind-config';

export const runtime = 'nodejs';

/**
 * GET /api/admin/behind-roles
 *
 * Returns the merged roles map (env var owners + Redis roles).
 * Owner-only endpoint.
 */
export async function GET() {
  const guarded = await requireOwnerSession();
  if (guarded.error) return guarded.error;

  const roles = await getMergedRoles();
  const lockedEmails = [...BEHIND_OWNER_EMAILS];

  return NextResponse.json({ roles, lockedEmails });
}

/**
 * PUT /api/admin/behind-roles
 *
 * Body: { email: string, role: 'owner' | 'admin' | 'none' }
 *
 * Sets or removes a role for the given email. Returns the updated roles map.
 * Owner-only endpoint. Env-var owners and self cannot be modified.
 */
export async function PUT(request: NextRequest) {
  const guarded = await requireOwnerSession();
  if (guarded.error) return guarded.error;

  let body: { email?: string; role?: string };
  try {
    body = (await request.json()) as { email?: string; role?: string };
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const { email, role } = body;

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ message: 'email is required' }, { status: 400 });
  }

  if (!role || !['owner', 'admin', 'none'].includes(role)) {
    return NextResponse.json(
      { message: 'role must be "owner", "admin", or "none"' },
      { status: 400 },
    );
  }

  try {
    await setRole(email, role as BehindRole | 'none', guarded.session.user.email);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not update role';
    return NextResponse.json({ message }, { status: 422 });
  }

  const roles = await getMergedRoles();
  const lockedEmails = [...BEHIND_OWNER_EMAILS];

  return NextResponse.json({ roles, lockedEmails });
}
