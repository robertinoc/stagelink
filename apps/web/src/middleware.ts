import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

const LOCALES = ['en', 'es'] as const;
type SupportedLocale = (typeof LOCALES)[number];

const intlMiddleware = createMiddleware({
  locales: LOCALES,
  defaultLocale: 'en',
});

/**
 * Route requests through the i18n middleware only when needed.
 *
 * Public artist pages live at /{username} (no locale prefix). Next.js cannot
 * have two differently-named dynamic segments at the same URL depth
 * (app/[locale] vs app/(public)/[username] would conflict). To avoid this,
 * we transparently rewrite /{username} → /p/{username} internally so the
 * route lives at app/(public)/p/[username] — no naming collision with [locale].
 * The browser URL remains /{username} because rewrites are transparent.
 *
 * Rule: single-segment paths that are NOT a supported locale are rewrtten
 * to /p/{username} and served by app/(public)/p/[username].
 */
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 1 && !LOCALES.includes(segments[0] as SupportedLocale)) {
    // Rewrite /{username} → /p/{username} transparently.
    // Browser URL stays /{username}; Next.js resolves app/(public)/p/[username].
    const url = request.nextUrl.clone();
    url.pathname = `/p/${segments[0]}`;
    return NextResponse.rewrite(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
