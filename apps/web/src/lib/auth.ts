import { withAuth, getSignInUrl, getSignUpUrl } from '@workos-inc/authkit-nextjs';
import type { UserInfo } from '@workos-inc/authkit-nextjs';

/**
 * auth.ts — helpers de autenticación para Server Components.
 *
 * SÓLO para uso server-side (Server Components, Server Actions, Route Handlers).
 * No importar en Client Components.
 *
 * Flujo de sesión:
 *   1. WorkOS almacena la sesión en una cookie cifrada (WORKOS_COOKIE_PASSWORD)
 *   2. withAuth() lee y valida esa cookie en cada server render
 *   3. accessToken es el JWT de WorkOS que el backend valida vía JWKS
 *
 * Para llamadas autenticadas al backend:
 *   const { accessToken } = await requireSession();
 *   const res = await apiFetch('/api/auth/me', { accessToken });
 */

/** User de WorkOS tal como viene del SDK. */
export type WorkOSUser = UserInfo['user'];

/** Sesión completa con acceso garantizado al usuario y al token. */
export interface AuthSession {
  user: WorkOSUser;
  accessToken: string;
}

/**
 * Retorna la sesión si el usuario está autenticado, o null si no lo está.
 * No hace redirect — útil para páginas que muestran contenido opcional.
 */
export async function getSession(): Promise<AuthSession | null> {
  const result = await withAuth();
  if (!result.user) return null;
  return { user: result.user, accessToken: result.accessToken };
}

/**
 * Retorna la sesión sin garantía de autenticación.
 * El caller es responsable de redirigir si user es null.
 */
export { withAuth, getSignInUrl, getSignUpUrl };

/**
 * Realiza un fetch autenticado al backend NestJS.
 * Añade `Authorization: Bearer <accessToken>` automáticamente.
 *
 * Uso desde Server Components:
 *   const session = await getSession();
 *   if (!session) redirect('/login');
 *   const data = await apiFetch('/api/auth/me', { accessToken: session.accessToken });
 */
export async function apiFetch(
  path: string,
  options: RequestInit & { accessToken: string },
): Promise<Response> {
  const { accessToken, ...fetchOptions } = options;
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4001';

  return fetch(`${apiUrl}${path}`, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
