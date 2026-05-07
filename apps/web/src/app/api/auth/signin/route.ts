import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { sanitizeAuthReturnTo } from '@/lib/auth-return-to';

// Force Node.js runtime — WorkOS AuthKit uses Node-only APIs (cookies, crypto)
// that are not available in the Edge Runtime.
export const runtime = 'nodejs';

/**
 * GET /api/auth/signin?returnTo=/path
 *
 * Generates the WorkOS authorization URL and redirects the user to it.
 * Optional `returnTo` query param is forwarded to WorkOS via the encrypted
 * PKCE state cookie so the callback lands the user back on that path
 * (otherwise the callback's fallback `returnPathname` is used).
 *
 * Must live in a Route Handler (not a Server Component) because getSignInUrl()
 * sets a state cookie — Next.js 15 only allows cookie writes in Route Handlers
 * and Server Actions.
 */
export async function GET(request: NextRequest) {
  const returnTo = sanitizeAuthReturnTo(request.nextUrl.searchParams.get('returnTo'));
  const signInUrl = await getSignInUrl(returnTo ? { returnTo } : undefined);
  redirect(signInUrl);
}
