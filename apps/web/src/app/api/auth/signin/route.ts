import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

// Force Node.js runtime — WorkOS AuthKit uses Node-only APIs (cookies, crypto)
// that are not available in the Edge Runtime.
export const runtime = 'nodejs';

/**
 * GET /api/auth/signin
 *
 * Generates the WorkOS authorization URL and redirects the user to it.
 * Must live in a Route Handler (not a Server Component) because getSignInUrl()
 * sets a state cookie — Next.js 15 only allows cookie writes in Route Handlers
 * and Server Actions.
 */
export async function GET() {
  const signInUrl = await getSignInUrl();
  redirect(signInUrl);
}
