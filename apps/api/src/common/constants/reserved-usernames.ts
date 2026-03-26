/**
 * Reserved usernames — fuente única de verdad.
 *
 * Estas palabras no pueden usarse como username de artista porque:
 * - Son rutas del sistema (api, app, auth, dashboard, etc.)
 * - Son dominios de la plataforma (www, staging, preview)
 * - Generan confusión o riesgo de seguridad (admin, root, null)
 * - Son rutas de marketing/legal que deben mantenerse limpias
 *
 * Para agregar una nueva reserva:
 *   1. Agregar la palabra al Set RESERVED_USERNAMES
 *   2. Documentar brevemente el motivo en un comentario
 *   3. Re-deployar (la validación es en runtime, no requiere migración)
 */

export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  // ── Rutas de sistema / API ───────────────────────────────────
  'api',
  'app',
  'auth',
  'oauth',
  'callback',
  'webhook',
  'webhooks',
  'health',
  'metrics',
  'status',
  'internal',
  'system',

  // ── Rutas de plataforma / dashboard ──────────────────────────
  'admin',
  'dashboard',
  'settings',
  'account',
  'profile',
  'billing',
  'upgrade',
  'plan',
  'subscription',

  // ── Rutas de auth ─────────────────────────────────────────────
  'login',
  'logout',
  'signin',
  'signout',
  'signup',
  'register',
  'password',
  'reset',
  'verify',
  'confirm',

  // ── Rutas de marketing / informativas ────────────────────────
  'home',
  'landing',
  'about',
  'pricing',
  'features',
  'contact',
  'support',
  'help',
  'faq',
  'blog',
  'docs',
  'documentation',
  'press',
  'careers',
  'jobs',
  'team',
  'enterprise',
  'business',

  // ── Rutas legales ─────────────────────────────────────────────
  'legal',
  'terms',
  'privacy',
  'cookies',
  'dmca',

  // ── Códigos de locale (evita colisión con rutas i18n) ────────
  // Agregar aquí cada nuevo locale antes de habilitarlo en next-intl.
  'en',
  'es',
  'fr',
  'pt',
  'de',
  'it',
  'ja',
  'zh',
  'ar',
  'ru',

  // ── Dominios / infra de plataforma ───────────────────────────
  'www',
  'staging',
  'preview',
  'dev',
  'development',
  'production',
  'sandbox',
  'test',
  'testing',
  'demo',
  'example',
  'sample',

  // ── Assets / estáticos ───────────────────────────────────────
  'static',
  'assets',
  'public',
  'cdn',
  'media',
  'images',
  'uploads',
  'upload',
  'files',
  'download',
  'downloads',

  // ── Nombre de plataforma ─────────────────────────────────────
  'stagelink',
  'stage',

  // ── Términos de entidad del modelo ───────────────────────────
  'artist',
  'artists',
  'page',
  'pages',
  'block',
  'blocks',
  'user',
  'users',
  'fan',
  'fans',

  // ── Palabras que generan ambigüedad o riesgo ─────────────────
  'root',
  'null',
  'undefined',
  'anonymous',
  'unknown',
  'nobody',
  'everyone',
  'all',
  'me',
  'i',
  'you',
  'new',
]);

/**
 * Verifica si un username (ya normalizado a lowercase) está reservado.
 */
export function isReservedUsername(normalizedUsername: string): boolean {
  return RESERVED_USERNAMES.has(normalizedUsername);
}
