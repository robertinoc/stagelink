import { handleAuth } from '@workos-inc/authkit-nextjs';

// Force Node.js runtime — WorkOS AuthKit uses Node-only APIs (cookies, crypto)
// that are not available in the Edge Runtime.
export const runtime = 'nodejs';

/**
 * GET /api/auth/callback
 *
 * Callback OAuth de WorkOS. WorkOS redirige aquí después de que el usuario
 * se autentica. El SDK:
 *   1. Intercambia el authorization code por access + refresh tokens
 *   2. Guarda la sesión en una cookie cifrada (WORKOS_COOKIE_PASSWORD)
 *   3. Redirige al usuario a la ruta configurada en returnPathname
 *
 * La URL de este handler debe coincidir exactamente con WORKOS_REDIRECT_URI.
 */
export const GET = handleAuth({ returnPathname: '/en/dashboard' });
