import { handleAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse, type NextRequest } from 'next/server';

// Force Node.js runtime — WorkOS AuthKit uses Node-only APIs (cookies, crypto)
// that are not available in the Edge Runtime.
export const runtime = 'nodejs';

const SUPPORTED_LOCALES = ['en', 'es'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Read the user's preferred locale from the NEXT_LOCALE cookie set by next-intl. */
function localeFromRequest(request: NextRequest): Locale {
  const value = request.cookies.get('NEXT_LOCALE')?.value;
  return SUPPORTED_LOCALES.includes(value as Locale) ? (value as Locale) : 'en';
}

/**
 * GET /api/auth/callback
 *
 * WorkOS OAuth callback. Flow after the user authenticates on WorkOS AuthKit:
 *   1. WorkOS redirects the browser here with ?code=...&state=...
 *   2. handleAuth verifies the PKCE state cookie (CSRF protection)
 *   3. Exchanges the authorization code for access + refresh tokens (WorkOS API)
 *   4. Encrypts the session and writes the wos-session cookie
 *   5. Issues a 302 redirect to `returnPathname` — never renders UI
 *
 * Where does `returnPathname` come from?
 *   Login/signup pages call `getSignInUrl({ returnTo: `/${locale}/dashboard` })`.
 *   This stores the locale-aware path in the encrypted PKCE state cookie.
 *   handleAuth reads it from the cookie and uses it as the redirect destination,
 *   so English users land on /en/dashboard and Spanish users on /es/dashboard.
 *   The fallback below is only used if no returnTo was stored in the state
 *   (e.g. someone navigates directly to the WorkOS authorization URL).
 *
 * Onboarding detection:
 *   /[locale]/dashboard checks if the user has an artist profile; if not it
 *   redirects to /[locale]/onboarding. No extra logic needed here.
 *
 * Error handling:
 *   On any failure (PKCE mismatch, missing state cookie, code-exchange error)
 *   handleAuth's default behaviour is to return a raw JSON 500 at this URL.
 *   Leaving the user on /api/auth/callback?code=...&state=... with a JSON body
 *   is exactly what triggers Chrome SafeBrowsing's "Dangerous site" warning on
 *   new TLDs like .link. The onError handler below redirects to the login page
 *   instead, keeping the user on a safe, recognisable URL.
 */
export const GET = handleAuth({
  // Fallback destination — overridden by returnTo stored in PKCE state.
  returnPathname: '/en/dashboard',

  onError: ({ error, request }: { error?: unknown; request: NextRequest }) => {
    // Log for observability but never expose internals to the browser.
    console.error('[Auth callback error]', error);

    const locale = localeFromRequest(request);
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('error', 'auth_failed');

    // 302 redirect — browser leaves /api/auth/callback immediately.
    return NextResponse.redirect(loginUrl, { status: 302 });
  },
});
