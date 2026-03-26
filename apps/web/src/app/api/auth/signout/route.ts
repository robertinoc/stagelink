import { signOut } from '@workos-inc/authkit-nextjs';

/**
 * GET /api/auth/signout
 *
 * Cierra la sesión del usuario:
 *   1. Borra la cookie de sesión cifrada
 *   2. Redirige al usuario a la página de inicio
 *
 * signOut() llama a redirect() internamente (throws redirect in Next.js),
 * por lo que esta función no retorna un valor Response explícito.
 *
 * Uso desde el frontend:
 *   <a href="/api/auth/signout">Log out</a>
 */
export async function GET(): Promise<never> {
  await signOut({ returnTo: '/' });
  // signOut() siempre lanza un redirect — este punto es inalcanzable
  throw new Error('unreachable');
}
