export const SUPPORTED_LOCALES = ['en', 'es'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export type LocalizedTextMap = Partial<Record<SupportedLocale, string>>;

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return Boolean(value && SUPPORTED_LOCALES.includes(value as SupportedLocale));
}

export function getLocaleFallbackChain(
  locale: SupportedLocale,
  includeDefault = true,
): SupportedLocale[] {
  if (includeDefault && locale !== DEFAULT_LOCALE) {
    return [locale, DEFAULT_LOCALE];
  }

  return [locale];
}
