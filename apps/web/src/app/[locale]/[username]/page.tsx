import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchPublicPage } from '@/lib/public-api';
import { ArtistPageView } from '@/features/public-page/components/ArtistPageView';

interface ArtistPageProps {
  params: Promise<{ username: string; locale: string }>;
}

/**
 * Metadata dinámica por tenant.
 *
 * `fetchPublicPage` está wrapped con `React.cache()`, por lo que esta llamada
 * y la del Server Component comparten el resultado — una sola request HTTP
 * al backend por pageview, aunque se llame dos veces en el mismo render tree.
 */
export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const { username } = await params;
  const page = await fetchPublicPage(username);

  if (!page) {
    return {
      title: 'Artist not found — StageLink',
    };
  }

  return {
    title: `${page.artist.displayName} (@${page.artist.username}) — StageLink`,
    description: page.artist.bio ?? `Check out ${page.artist.displayName}'s page on StageLink`,
    openGraph: {
      title: page.artist.displayName,
      description: page.artist.bio ?? undefined,
      images: page.artist.avatarUrl ? [{ url: page.artist.avatarUrl }] : [],
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
