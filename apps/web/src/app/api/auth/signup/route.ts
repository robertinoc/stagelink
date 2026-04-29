import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

// Force Node.js runtime — WorkOS AuthKit uses Node-only APIs (cookies, crypto)
// that are not available in the Edge Runtime.
export const runtime = 'nodejs';

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
