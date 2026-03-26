import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchPublicPage } from '@/lib/public-api';
import { ArtistPagePlaceholder } from '@/features/public-page/components/ArtistPagePlaceholder';

interface ArtistPageProps {
  params: Promise<{ username: string; locale: string }>;
}

/**
 * Metadata dinámica por tenant.
 *
 * Se llama fetchPublicPage dos veces (aquí y en el Server Component),
 * pero Next.js deduplica automáticamente las fetches con la misma URL
 * dentro del mismo render (Request Memoization).
 * Ref: https://nextjs.org/docs/app/building-your-application/caching#request-memoization
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
 * 2. Si 404 (no existe / no publicada) → notFound() → muestra página 404
 * 3. Si existe → renderiza con los datos del tenant correcto
 *
 * Seguridad:
 * - El backend filtra todo por artistId (identificador interno)
 * - cache: 'no-store' evita mezclar contenido entre tenants
 * - notFound() devuelve 404 HTTP real, no solo UI vacía
 */
export default async function ArtistPage({ params }: ArtistPageProps) {
  const { username } = await params;
  const page = await fetchPublicPage(username);

  if (!page) {
    notFound();
  }

  // ArtistPagePlaceholder recibe los datos del tenant resuelto.
  // En el futuro, se reemplaza por ArtistPageView con el editor completo.
  return <ArtistPagePlaceholder username={page.artist.username} />;
}
