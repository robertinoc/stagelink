import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

// Force Node.js runtime — WorkOS AuthKit uses Node-only APIs (cookies, crypto).
export const runtime = 'nodejs';

/**
 * GET /api/auth/behind-signin
 *
 * Dedicated sign-in entry point for the Behind the Stage admin panel.
 * Equivalent to /api/auth/signin?returnTo=/behind but without any query
 * parameters — avoids Vercel WAF path-traversal false positives that block
 * requests containing `returnTo=%2F...` or `returnTo=/...` in the query string.
 *
 * Sets the PKCE state cookie on stagelink.art (this handler's domain) so
 * the WorkOS callback at stagelink.art/api/auth/callback can verify it.
 */
export async function GET() {
  const signInUrl = await getSignInUrl({ returnTo: '/behind' });
  redirect(signInUrl);
}
