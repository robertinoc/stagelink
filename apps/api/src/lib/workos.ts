import { createWorkOS } from '@workos-inc/node';

/**
 * WorkOS SDK singleton.
 *
 * Creado una sola vez en el ciclo de vida del proceso para reutilizar
 * el HTTP connection pool interno del SDK.
 *
 * Solo para uso server-side (NestJS guards y services).
 * No exponer en endpoints públicos.
 *
 * Uso:
 *   const wos = getWorkOS();
 *   const user = await wos.userManagement.getUser(workosUserId);
 */

// ReturnType genérico para evitar problemas de tipos con el SDK
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _workos: ReturnType<typeof createWorkOS> | null = null;

export function getWorkOS(): ReturnType<typeof createWorkOS> {
  if (!_workos) {
    const apiKey = process.env['WORKOS_API_KEY'];
    if (!apiKey) {
      throw new Error('WORKOS_API_KEY is not set — required for backend auth');
    }
    _workos = createWorkOS({ apiKey });
  }
  return _workos;
}
