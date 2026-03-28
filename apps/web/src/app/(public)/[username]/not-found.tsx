import Link from 'next/link';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';

function detectLocale(acceptLanguage: string): 'en' | 'es' {
  const primary = acceptLanguage.split(',')[0]?.split(';')[0]?.trim().toLowerCase() ?? '';
  return primary.startsWith('es') ? 'es' : 'en';
}

/**
 * Not-found boundary for artist pages.
 *
 * Triggered by notFound() in the Server Component when the backend returns 404.
 * Next.js serves this with a real HTTP 404 status code.
 *
 * Uses explicit locale detection (not middleware context) since notFound()
 * may render outside the layout's setRequestLocale scope.
 */
export default async function ArtistNotFound() {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') ?? '';
  const locale = detectLocale(acceptLanguage);
  const t = await getTranslations({ locale, namespace: 'public_page' });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
      <p className="text-5xl font-bold text-zinc-600">404</p>
      <h1 className="mt-4 text-xl font-semibold text-white">{t('not_found_title')}</h1>
      <p className="mt-2 text-sm text-zinc-400">{t('not_found_description')}</p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-white px-5 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
      >
        {t('not_found_cta')}
      </Link>
    </div>
  );
}
