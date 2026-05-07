import { authkit, partitionAuthkitHeaders, applyResponseHeaders } from '@workos-inc/authkit-nextjs';
import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCALE } from '@stagelink/types';
import { resolvePreferredLocale } from '@/lib/detect-locale';

const LOCALES = ['en', 'es'] as const;
type SupportedLocale = (typeof LOCALES)[number];

const intlMiddleware = createIntlMiddleware({
  locales: LOCALES,
  defaultLocale: 'en',
});

/** Internal hostname for the Behind the Stage admin panel. */
const BEHIND_HOST = 'behind.stagelink.art';

/**
 * Composed middleware: AuthKit session handling + i18n + custom routing rules.
 *
 * authkit() (low-level) is used instead of authkitMiddleware() because v3 of
 * @workos-inc/authkit-nextjs does not accept a custom handler callback.
 * We manually compose it with next-intl by:
 *   1. Running authkit() to get session headers (marks request as authkit-processed,
 *      refreshes token if needed)
 *   2. Forwarding authkit's request headers via a new NextRequest so withAuth()
 *      can read the session in server components
 *   3. Applying authkit's response headers (Set-Cookie for token refresh) to the
 *      final response returned by intl middleware
 *
 * Rules:
 * 0. /go/[id] — bypass everything (Next.js route handler, no locale needed).
 * 1. /p/{username} → 302 to /{locale}/{username} — prevent duplicate content.
 * 2. Single-segment non-locale paths → 302 to /{locale}/{username}.
 * 3. Everything else → authkit session + intl locale handling.
 *
 * Note: behind.stagelink.art path rewrites are handled in next.config.ts
 * (rewrites with `has: { type: 'host' }`). The admin panel lives at top-level
 * /behind (outside [locale]) to avoid the [username] dynamic-route conflict.
 * Middleware still runs authkit for session handling on the behind subdomain
 * but skips intl middleware (admin panel is always English).
 */
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);
  const isBehindHost = request.nextUrl.hostname === BEHIND_HOST;

  // behind.stagelink.art: run authkit but skip intl middleware.
  // The path rewrite to /behind/* is handled by next.config.ts rewrites.
  if (isBehindHost && !pathname.startsWith('/api/')) {
    const { headers: authkitHeaders } = await authkit(request);
    const { requestHeaders, responseHeaders } = partitionAuthkitHeaders(request, authkitHeaders);
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    return applyResponseHeaders(response, responseHeaders);
  }

  const locale = resolvePreferredLocale({
    acceptLanguage: request.headers.get('accept-language') ?? DEFAULT_LOCALE,
    localeCookie: request.cookies.get('NEXT_LOCALE')?.value ?? null,
  });

  // API routes that need AuthKit session context but not locale handling.
  if (
    pathname === '/api/onboarding/complete' ||
    pathname === '/api/assets/upload-intent' ||
    (pathname.startsWith('/api/assets/') && pathname.endsWith('/confirm')) ||
    pathname.startsWith('/api/insights/') ||
    pathname.startsWith('/api/artists/') ||
    pathname.startsWith('/api/pages/') ||
    pathname.startsWith('/api/blocks/') ||
    pathname.startsWith('/api/admin/')
  ) {
    const { headers: authkitHeaders } = await authkit(request);
    const { requestHeaders, responseHeaders } = partitionAuthkitHeaders(request, authkitHeaders);
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    return applyResponseHeaders(response, responseHeaders);
  }

  // Rule 0: smart link handler — bypass intl and authkit entirely.
  if (segments[0] === 'go' && segments.length === 2) {
    return NextResponse.next();
  }

  // Rule 1: block direct access to the internal rewrite target for artist pages,
  // but allow explicit public subroutes like /p/{username}/epk and /print.
  if (
    segments[0] === 'p' &&
    segments.length === 2 &&
    segments[1] !== 'epk' &&
    segments[1] !== 'print'
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/${segments[1]!}`;
    return NextResponse.redirect(url, 302);
  }

  // Public EPK routes redirect to the localized canonical URLs.
  if (segments[0] === 'p' && segments.length >= 3 && segments[2] === 'epk') {
    const url = request.nextUrl.clone();
    const username = segments[1];
    const isPrintRoute = segments[3] === 'print';
    url.pathname = isPrintRoute ? `/${locale}/${username}/epk/print` : `/${locale}/${username}/epk`;
    return NextResponse.redirect(url, 302);
  }

  // Rule 2: artist username — redirect /{username} → /{locale}/{username}.
  // Excludes top-level routes that aren't artist pages (e.g. /behind admin panel).
  if (
    segments.length === 1 &&
    !LOCALES.includes(segments[0] as SupportedLocale) &&
    segments[0] !== 'behind'
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/${segments[0]!}`;
    return NextResponse.redirect(url, 302);
  }

  // Rule 2b: /behind (admin panel) on main domain.
  //
  // After a successful auth flow the callback redirects to stagelink.art/behind.
  // Without this rule the intl middleware would add a locale prefix and redirect
  // to /en/behind, which no longer exists as a route (the panel lives at
  // app/behind/ outside [locale]).
  //
  // When WORKOS_COOKIE_DOMAIN=.stagelink.art is set, the session cookie is valid
  // on all subdomains, so we can canonically redirect stagelink.art/behind →
  // behind.stagelink.art/. Without that env var the cookie is host-only on
  // stagelink.art, so we serve /behind here instead (redirecting would loop).
  if (segments[0] === 'behind') {
    if (process.env.WORKOS_COOKIE_DOMAIN === '.stagelink.art') {
      const url = request.nextUrl.clone();
      url.hostname = BEHIND_HOST;
      url.pathname = pathname.replace(/^\/behind/, '') || '/';
      url.protocol = 'https:';
      return NextResponse.redirect(url, 308);
    }
    const { headers: authkitHeaders } = await authkit(request);
    const { requestHeaders, responseHeaders } = partitionAuthkitHeaders(request, authkitHeaders);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    return applyResponseHeaders(response, responseHeaders);
  }

  // Rule 3: authkit session + intl locale handling.
  //
  // authkit() sets the x-workos-middleware marker (required by withAuth()) and
  // refreshes the session token if it is about to expire.
  const { headers: authkitHeaders } = await authkit(request);
  const { requestHeaders, responseHeaders } = partitionAuthkitHeaders(request, authkitHeaders);

  // Build an augmented request so intl middleware forwards the authkit request
  // headers (x-workos-middleware, x-workos-session, etc.) to server components.
  const augmentedRequest = new NextRequest(request.url, {
    method: request.method,
    headers: requestHeaders,
  });

  // Run intl middleware for locale prefix handling / redirects.
  const intlResponse = intlMiddleware(augmentedRequest);

  // Merge authkit response headers (Set-Cookie for token refresh) into the
  // response that intl middleware produced.
  return applyResponseHeaders(intlResponse, responseHeaders);
}

export const config = {
  matcher: [
    '/api/onboarding/complete',
    '/api/assets/upload-intent',
    '/api/assets/:path*',
    '/api/insights/:path*',
    '/api/artists/:path*',
    '/api/pages/:path*',
    '/api/blocks/:path*',
    '/api/admin/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
