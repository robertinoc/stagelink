import type { PublicPageResponse } from '@stagelink/types';

/**
 * public-api.ts — helpers para consumir endpoints públicos del API.
 *
 * Estos helpers son para uso en Server Components (SSR).
 * No requieren autenticación.
 *
 * Caching:
 * - Se usa `cache: 'no-store'` para evitar mezclar contenido entre tenants.
 * - En el futuro, se puede cambiar a `next: { tags: [`artist:${username}`] }`
 *   para ISR con revalidación por tag, una vez que estemos seguros de que
 *   Next.js no mezcla tenants por key de caché.
 * - Ver: docs/multi-tenant.md — sección "Caching y SSR"
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001';

/**
 * Obtiene la página pública de un artista por username.
 *
 * @returns PublicPageResponse si existe y está publicada, null si no.
 *          Retorna null para cualquier error (404, 500, red, etc.).
 */
export async function fetchPublicPage(username: string): Promise<PublicPageResponse | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/public/pages/by-username/${encodeURIComponent(username)}`,
      {
        cache: 'no-store', // Sin caché — cada request va al backend
      },
    );

    if (res.status === 404) return null;

    if (!res.ok) {
      // Error inesperado — loguear pero no crashear
      console.error(`[public-api] Unexpected error fetching page for "${username}": ${res.status}`);
      return null;
    }

    const data = (await res.json()) as PublicPageResponse;
    return data;
  } catch (error) {
    // Error de red o parse — retornar null para mostrar 404
    console.error(`[public-api] Network error fetching page for "${username}":`, error);
    return null;
  }
}
