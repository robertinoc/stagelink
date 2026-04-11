import { cache } from 'react';
import { headers, cookies } from 'next/headers';
import { DEFAULT_LOCALE, type PublicPageResponse, type SupportedLocale } from '@stagelink/types';

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
 *   ⚠️  ADVERTENCIA ANALYTICS: al activar ISR, el backend solo recibe la
 *   request HTTP en el revalidation hit — no en cada visita. Los eventos
 *   page_view dejarán de contabilizarse por visitante. Solución: trasladar
 *   el tracking de page_view a un Client Component que llame al API desde
 *   el browser, o usar un Middleware para contar antes del cache layer.
 *
 * Header forwarding:
 * - Analytics-relevant visitor headers (Accept-Language, Referer,
 *   Sec-CH-UA-Platform) are forwarded to the API so the server-side
 *   public_page_view event has correct locale, referrer, and platform context.
 *   Next.js SSR receives these headers from the browser but does NOT forward
 *   them automatically in outgoing fetch() calls — we must do it explicitly.
 * - T4-4 quality headers (X-SL-QA, X-SL-AC) are read from the visitor's
 *   cookies (via the Cookie header, parsed selectively) and forwarded to the
 *   API so quality flags can be set on the persisted page_view event.
 *   Only the two known sl_* cookies are forwarded — no other cookie data.
 */

// API_URL is a private server-only variable (not NEXT_PUBLIC_*) — never sent to the browser.
// public-api.ts is imported only in Server Components so this is safe.
const API_URL = process.env.API_URL ?? 'http://localhost:4001';

async function _fetchPublicPage(
  username: string,
  locale: SupportedLocale = DEFAULT_LOCALE,
): Promise<PublicPageResponse | null> {
  // Forward analytics-relevant browser headers to the API. Only the headers
  // relevant for page_view context are forwarded — never Authorization, Cookie,
  // or other sensitive headers.
  const incomingHeaders = await headers();
  const forwardHeaders: Record<string, string> = {};

  const acceptLanguage = incomingHeaders.get('accept-language');
  if (acceptLanguage) forwardHeaders['accept-language'] = acceptLanguage;

  const referer = incomingHeaders.get('referer');
  if (referer) forwardHeaders['referer'] = referer;

  const secChUaPlatform = incomingHeaders.get('sec-ch-ua-platform');
  if (secChUaPlatform) forwardHeaders['sec-ch-ua-platform'] = secChUaPlatform;

  // User-Agent — needed by API for T4-4 bot detection.
  const userAgent = incomingHeaders.get('user-agent');
  if (userAgent) forwardHeaders['user-agent'] = userAgent;

  // T4-4: Forward quality cookies as typed headers (never forward the raw Cookie header).
  // Use Next.js cookies() API — type-safe, handles edge cases (encoded values,
  // cookies with '=' in the value, whitespace) that manual parsing can get wrong.
  const cookieStore = await cookies();

  // sl_ac: consent cookie — '1' = accepted, '0' = rejected, absent = unknown
  const slAc = cookieStore.get('sl_ac')?.value;
  if (slAc === '1' || slAc === '0') forwardHeaders['x-sl-ac'] = slAc;

  // sl_qa: QA mode cookie — '1' = QA session (set via ?sl_qa=1 URL param)
  if (cookieStore.get('sl_qa')?.value === '1') forwardHeaders['x-sl-qa'] = '1';

  const url = new URL(`/api/public/pages/by-username/${encodeURIComponent(username)}`, API_URL);
  url.searchParams.set('locale', locale);

  const res = await fetch(url.toString(), { cache: 'no-store', headers: forwardHeaders });

  if (res.status === 404) return null;

  if (res.status === 429) {
    // Rate-limited — propagate so Next.js renders error.tsx (not silently 404).
    throw new Error(`[public-api] Rate limited (429) fetching page for "${username}"`);
  }

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
 * @returns PublicPageResponse si el artista existe y su página pública es resoluble.
 *          Retorna null si no existe (404).
 * @throws Error si el backend devuelve 5xx (deja que Next.js maneje el error).
 */
export const fetchPublicPage = cache(_fetchPublicPage);
