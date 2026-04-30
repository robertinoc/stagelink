import { handleAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse, type NextRequest } from 'next/server';

// Force Node.js runtime — WorkOS AuthKit uses Node-only APIs (cookies, crypto)
// that are not available in the Edge Runtime.
export const runtime = 'nodejs';

const SUPPORTED_LOCALES = ['en', 'es'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Reads the NEXT_LOCALE cookie written by next-intl middleware.
 * Falls back to 'en' if absent or unrecognised.
 */
function localeFromRequest(request: NextRequest): Locale {
  const value = request.cookies.get('NEXT_LOCALE')?.value;
  return SUPPORTED_LOCALES.includes(value as Locale) ? (value as Locale) : 'en';
}

/**
 * GET /api/auth/callback
 *
 * OAuth callback handler for WorkOS AuthKit.  WorkOS redirects here after the
 * user authenticates.  The SDK:
 *   1. Exchanges the authorization code for access + refresh tokens
 *   2. Saves the session in an encrypted cookie (WORKOS_COOKIE_PASSWORD)
 *   3. Redirects the user to the path stored in the PKCE state cookie
 *      (set by getSignInUrl({ returnTo }) in the login Server Action), or to
 *      returnPathname as a hard fallback.
 *
 * Error handling:
 *   Any auth failure (PKCE mismatch, missing cookie, code-exchange error) is
 *   caught by onError and redirected to /{locale}/login?error=auth_failed so
 *   the user never gets stranded on the raw /api/auth/callback URL.
 */
export const GET = handleAuth({
  // Fallback when PKCE state has no returnTo (e.g. direct link to this URL).
  returnPathname: '/en/dashboard',

  onError: ({ error, request }: { error?: unknown; request: NextRequest }) => {
    console.error('[Auth callback error]', error);
    const locale = localeFromRequest(request);
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('error', 'auth_failed');
    return NextResponse.redirect(loginUrl, { status: 302 });
  },
});
