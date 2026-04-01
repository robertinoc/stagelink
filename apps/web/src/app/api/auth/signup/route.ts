import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

/**
 * GET /api/auth/signup
 *
 * Temporary fallback: route signup through the same hosted auth flow as sign-in.
 * This keeps the product demoable while the environment's self-signup flow is
 * finalized in WorkOS.
 */
export async function GET() {
  const signInUrl = await getSignInUrl();
  redirect(signInUrl);
}
