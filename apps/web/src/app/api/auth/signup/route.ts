import { getSignUpUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

// Force Node.js runtime — WorkOS AuthKit uses Node-only APIs (cookies, crypto)
// that are not available in the Edge Runtime.
export const runtime = 'nodejs';

/**
 * GET /api/auth/signup
 *
 * Generates the WorkOS sign-up URL and redirects the user to it.
 *
 * The localized signup page uses a Server Action for the primary flow so the
 * raw API route stays out of the address bar. This route remains as a direct
 * entry point for old links/tests and should preserve the same WorkOS posture:
 * create-account intent, hosted credentials only, and no credentials handled by
 * StageLink.
 */
export async function GET() {
  const signUpUrl = await getSignUpUrl();
  redirect(signUpUrl);
}
