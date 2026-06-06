import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import { SUPPORTED_LOCALES } from '@stagelink/types';
import type { Locale } from '@/i18n/request';

// Force Node.js runtime — WorkOS AuthKit uses Node-only APIs (cookies, crypto)
// that are not available in the Edge Runtime.
export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ locale: string }>;
}

/**
 * POST /{locale}/login/start
 *
 * Starts WorkOS from a normal Route Handler so the PKCE state cookie is written
 * in a plain HTTP redirect response. That is more reliable for installed PWA
 * launches on mobile than combining the cookie write and external redirect in a
 * React Server Action response.
 */
export async function POST(_request: Request, context: RouteContext) {
  const { locale: rawLocale } = await context.params;
  const locale = SUPPORTED_LOCALES.includes(rawLocale as Locale) ? rawLocale : 'en';
  const signInUrl = await getSignInUrl({ returnTo: `/${locale}/dashboard` });

  redirect(signInUrl);
}
