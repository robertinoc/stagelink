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
 * Rules:
 * 1. /p/{username} → 301 to /{username} — block direct access to the internal
 *    rewrite target to prevent duplicate content (different URL, same page).
 * 2. Single-segment non-locale paths → rewrite to /p/{username}.
 * 3. Everything else → intl middleware (locale prefix handling).
 */
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);

  // Rule 1 (pre-check): smart link redirect paths — bypass intl middleware entirely.
  // /go/[id] is a Next.js route handler, not a page — no locale prefix needed.
  if (segments[0] === 'go' && segments.length === 2) {
    return NextResponse.next();
  }

  // Rule 1: redirect direct access to the internal rewrite target.
  // Prevents crawlers from indexing /p/{username} as a duplicate of /{username}.
  if (segments[0] === 'p' && segments.length === 2) {
    const url = request.nextUrl.clone();
    url.pathname = `/${segments[1]}`;
    return NextResponse.redirect(url, 301);
  }

  // Rule 2: artist username — rewrite /{username} → /p/{username} transparently.
  if (segments.length === 1 && !LOCALES.includes(segments[0] as SupportedLocale)) {
    const url = request.nextUrl.clone();
    url.pathname = `/p/${segments[0]}`;
    return NextResponse.rewrite(url);
  }

  // Rule 3: everything else through the intl middleware.
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
