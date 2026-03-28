import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';

const LOCALES = ['en', 'es'] as const;
type SupportedLocale = (typeof LOCALES)[number];

const intlMiddleware = createMiddleware({
  locales: LOCALES,
  defaultLocale: 'en',
});

/**
 * Route requests through the i18n middleware only when needed.
 *
 * Public artist pages live at /{username} (no locale prefix) and handle
 * locale detection themselves via Accept-Language. Routing them through
 * the intl middleware would prepend /en/ and break share URLs.
 *
 * Rule: single-segment paths that are NOT a supported locale go directly
 * to the (public)/[username] route — no redirect.
 */
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 1 && !LOCALES.includes(segments[0] as SupportedLocale)) {
    // Artist username — bypass locale redirect, serve at /{username}
    return;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
