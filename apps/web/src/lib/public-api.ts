import { cache } from 'react';
import type { PublicPageResponse } from '@stagelink/types';

/**
 * public-api.ts — helpers para consumir endpoints públicos del API.
 *
 * Para uso exclusivo en Server Components (SSR).
 * No requieren autenticación.
 *
 * Caching:
 * - `cache: 'no-store'` evita que Next.js persista respuestas entre requests,
 *   eliminando el riesgo de servir contenido de un tenant a otro.
 * - `React.cache()` deduplica llamadas con el mismo argumento dentro del mismo
 *   render tree (mismo request). Así `generateMetadata` y el Server Component
 *   comparten el resultado sin hacer dos requests al backend.
 * - Migrar a ISR: reemplazar `cache: 'no-store'` por
 *   `next: { tags: ['artist:username'], revalidate: 60 }` cuando el volumen
 *   lo justifique. Ver: docs/multi-tenant.md — sección "Caching y SSR".
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001';

async function _fetchPublicPage(username: string): Promise<PublicPageResponse | null> {
  const res = await fetch(
    `${API_URL}/api/public/pages/by-username/${encodeURIComponent(username)}`,
    { cache: 'no-store' },
  );

  if (res.status === 404) return null;

  if (res.status >= 500) {
    // Error de infraestructura — propagar para que Next.js muestre error.tsx,
    // no silenciar como 404 (ocultaría fallos reales del backend).
    throw new Error(`[public-api] Backend error ${res.status} fetching page for "${username}"`);
  }

  if (!res.ok) {
    console.error(`[public-api] Unexpected ${res.status} fetching page for "${username}"`);
    return null;
  }

  return (await res.json()) as PublicPageResponse;
}

/**
 * Obtiene la página pública de un artista por username.
 *
 * Wrapped con `React.cache()` para deduplicar dentro del mismo render:
 * `generateMetadata` y el Server Component llaman a esta función con el
 * mismo username → una sola request HTTP al backend por pageview.
 *
 * @returns PublicPageResponse si el artista existe y su página está publicada.
 *          Retorna null si no existe (404).
 * @throws Error si el backend devuelve 5xx (deja que Next.js maneje el error).
 */
export const fetchPublicPage = cache(_fetchPublicPage);
