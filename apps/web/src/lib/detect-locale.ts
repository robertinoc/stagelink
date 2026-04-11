import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from '@stagelink/types';

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
  return primary.startsWith('es') ? 'es' : DEFAULT_LOCALE;
}

export function resolvePreferredLocale(options: {
  acceptLanguage?: string | null;
  localeCookie?: string | null;
}): SupportedLocale {
  const cookieLocale = options.localeCookie?.trim().toLowerCase();

  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as SupportedLocale)) {
    return cookieLocale as SupportedLocale;
  }

  return detectLocale(options.acceptLanguage ?? DEFAULT_LOCALE);
}
