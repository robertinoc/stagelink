import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from '@stagelink/types';

/**
 * Parses an Accept-Language header and returns the best-matching supported locale.
 *
 * Supports: 'en', 'es'. Falls back to 'en' for unsupported or missing values.
 *
 * Example: "es-AR,es;q=0.9,en-US;q=0.8" → "es"
 */
export function detectLocale(acceptLanguage: string): SupportedLocale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  // Parse quality-sorted list: "es-AR,es;q=0.9,en-US;q=0.8,en;q=0.7"
  const langs = acceptLanguage
    .split(',')
    .map((part) => {
      const segments = part.trim().split(';q=');
      const langRaw = segments[0] ?? '';
      const qRaw = segments[1];
      return { lang: langRaw.trim().toLowerCase(), q: qRaw ? parseFloat(qRaw) : 1.0 };
    })
    .sort((a, b) => b.q - a.q);

  for (const entry of langs) {
    const { lang } = entry;
    // Exact match (e.g. 'es')
    if (SUPPORTED_LOCALES.includes(lang as SupportedLocale)) return lang as SupportedLocale;
    // Language-only prefix match (e.g. 'es-AR' → 'es')
    const prefix = lang.split('-')[0] ?? '';
    if (prefix && SUPPORTED_LOCALES.includes(prefix as SupportedLocale)) {
      return prefix as SupportedLocale;
    }
  }

  return DEFAULT_LOCALE;
}
