import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchPublicPage } from '@/lib/public-api';
import { ArtistPageView } from '@/features/public-page/components/ArtistPageView';

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
 *   description: seoDescription → bio → generic fallback
 *
 * Canonical apunta a /{username} (sin prefijo de locale) — URL de sharing limpia.
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

  const title = artist.seoTitle
    ? `${artist.seoTitle} — StageLink`
    : `${artist.displayName} (@${artist.username}) — StageLink`;

  const description =
    artist.seoDescription ?? artist.bio ?? `Check out ${artist.displayName}'s page on StageLink`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const canonical = `${appUrl}/${artist.username}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: artist.seoTitle ?? artist.displayName,
      description,
      url: canonical,
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
 */
export default async function ArtistPage({ params }: ArtistPageProps) {
  const { username } = await params;
  const page = await fetchPublicPage(username);

  if (!page) {
    notFound();
  }

  return <ArtistPageView page={page} />;
}
