import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { fetchPublicPage } from '@/lib/public-api';
import { ArtistPageView } from '@/features/public-page/components/ArtistPageView';
import { AnalyticsConsentBanner } from '@/features/public-page/components/AnalyticsConsentBanner';
import { QaModeInitializer } from '@/features/public-page/components/QaModeInitializer';
import { detectLocale } from '@/lib/detect-locale';

interface ArtistPageProps {
  params: Promise<{ username: string }>;
}

/**
 * Metadata dinámica por tenant.
 *
 * `fetchPublicPage` está wrapped con `React.cache()`, por lo que esta llamada
 * y la del Server Component comparten el resultado — una sola request HTTP
 * al backend por pageview, aunque se llame dos veces en el mismo render tree.
 *
 * SEO fields priority:
 *   title:       seoTitle → displayName (@username) — StageLink
 *   description: seoDescription → bio → generic fallback (i18n)
 *
 * Canonical apunta a /{username} (sin prefijo de locale) — URL de sharing limpia.
 * Si NEXT_PUBLIC_APP_URL no está definida, se omite canonical y se marca noindex.
 */
export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const { username } = await params;
  const page = await fetchPublicPage(username);

  if (!page) {
    return {
      title: 'Artist not found — StageLink',
      robots: { index: false, follow: false },
    };
  }

  const { artist } = page;

  // Detect locale from Accept-Language for the description fallback.
  // generateMetadata runs before the layout sets setRequestLocale, so we
  // detect explicitly rather than relying on middleware context.
  const headersList = await headers();
  const locale = detectLocale(headersList.get('accept-language') ?? '');
  const t = await getTranslations({ locale, namespace: 'public_page' });

  const title = artist.seoTitle
    ? `${artist.seoTitle} — StageLink`
    : `${artist.displayName} (@${artist.username}) — StageLink`;

  const description =
    artist.seoDescription ??
    artist.bio ??
    t('seo_description_fallback', { name: artist.displayName });

  // Canonical must be absolute — relative canonicals are ignored by Google.
  // If NEXT_PUBLIC_APP_URL is unset we omit canonical entirely and mark the
  // page noindex so it isn't crawled under an unknown/localhost domain.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const canonical = appUrl ? `${appUrl}/${artist.username}` : undefined;

  return {
    title,
    description,
    ...(canonical && { alternates: { canonical } }),
    robots: {
      index: !!canonical,
      follow: true,
    },
    openGraph: {
      title: artist.seoTitle ?? artist.displayName,
      description,
      ...(canonical && { url: canonical }),
      // Prefer cover (wide format) for social previews; fall back to avatar.
      images: artist.coverUrl
        ? [{ url: artist.coverUrl, width: 1200, height: 630, alt: artist.displayName }]
        : artist.avatarUrl
          ? [{ url: artist.avatarUrl, width: 400, height: 400, alt: artist.displayName }]
          : [],
      type: 'profile',
    },
    twitter: {
      // summary_large_image when a wide cover is available, summary otherwise.
      card: artist.coverUrl ? 'summary_large_image' : 'summary',
      title: artist.seoTitle ?? artist.displayName,
      description,
      images: artist.coverUrl ? [artist.coverUrl] : artist.avatarUrl ? [artist.avatarUrl] : [],
    },
  };
}

/**
 * Builds a JSON-LD Person schema for the artist page.
 * Helps Google generate rich results for artist profiles.
 */
function buildJsonLd(
  artist: NonNullable<Awaited<ReturnType<typeof fetchPublicPage>>>['artist'],
  canonical: string | undefined,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: artist.displayName,
    ...(artist.bio && { description: artist.bio }),
    ...(canonical && { url: canonical }),
    ...(artist.avatarUrl && { image: artist.avatarUrl }),
  };
}

/**
 * Página pública de artista — resuelve tenant por username.
 *
 * Flujo:
 * 1. fetchPublicPage(username) → GET /api/public/pages/by-username/:username
 * 2. Si 404 → notFound() → página 404 con HTTP 404 real
 * 3. Si 5xx → Next.js propaga el error → error.tsx lo maneja
 * 4. Si existe → renderiza con datos del tenant correcto
 *
 * Seguridad:
 * - El backend filtra todo por artistId (identificador interno estable)
 * - cache: 'no-store' evita mezclar contenido entre tenants
 * - notFound() retorna 404 HTTP real, no solo UI vacía
 *
 * T4-4 additions:
 * - AnalyticsConsentBanner: client-side opt-out notice (shown on first visit).
 * - QaModeInitializer: reads ?sl_qa=1 URL param and persists as a cookie so
 *   the web tier can forward X-SL-QA: 1 to the API on subsequent page loads.
 */
export default async function ArtistPage({ params }: ArtistPageProps) {
  const { username } = await params;
  const page = await fetchPublicPage(username);

  if (!page) {
    notFound();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const canonical = appUrl ? `${appUrl}/${page.artist.username}` : undefined;
  const jsonLd = buildJsonLd(page.artist, canonical);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArtistPageView page={page} />
      {/* T4-4: Minimal analytics notice — shown on first visit, opt-out model */}
      <AnalyticsConsentBanner />
      {/* T4-4: QA mode — reads ?sl_qa=1 and sets sl_qa cookie for header forwarding.
           Suspense is required: useSearchParams() in a Client Component must be
           wrapped to avoid opting the route out of prerendering. */}
      <Suspense fallback={null}>
        <QaModeInitializer />
      </Suspense>
    </>
  );
}
