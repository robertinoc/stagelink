import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

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
