export type SupportedLocale = 'en' | 'es';

/**
 * Detects the preferred locale from an Accept-Language header value.
 *
 * Used by public artist pages which are served without a URL locale prefix.
 * Locale is inferred from the browser header rather than the URL.
 *
 * Returns 'es' only when the primary language tag starts with "es".
 * Defaults to 'en' for everything else (including missing/malformed headers).
 */
export function detectLocale(acceptLanguage: string): SupportedLocale {
  const primary = acceptLanguage.split(',')[0]?.split(';')[0]?.trim().toLowerCase() ?? '';
  return primary.startsWith('es') ? 'es' : 'en';
}
