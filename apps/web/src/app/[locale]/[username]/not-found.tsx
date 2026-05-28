import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';

/**
 * Renders when an artist isn't found at /[locale]/[username].
 *
 * Next.js's special files (not-found, error, loading) do NOT receive
 * `params` as a prop — only `layout` and `page` do. Read the locale via
 * `getLocale()` from next-intl/server, which pulls it from the request
 * context set up by the next-intl middleware. Previously this file
 * destructured `params.locale` and crashed every render with
 * "TypeError: Cannot destructure property 'locale' of '(intermediate value)'
 * as it is undefined", surfaced to users + crawlers as a 500.
 */
export default async function LocalizedArtistNotFound() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'public_page' });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
      <p className="text-5xl font-bold text-zinc-600">404</p>
      <h1 className="mt-4 text-xl font-semibold text-white">{t('not_found_title')}</h1>
      <p className="mt-2 text-sm text-zinc-400">{t('not_found_description')}</p>
      <Link
        href={`/${locale}`}
        className="mt-6 rounded-full bg-white px-5 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
      >
        {t('not_found_cta')}
      </Link>
    </div>
  );
}
