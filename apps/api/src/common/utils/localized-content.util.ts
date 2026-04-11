import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type LocalizedTextMap,
  type SupportedLocale,
} from '@stagelink/types';

type TranslationFieldMap = Record<string, LocalizedTextMap | undefined>;

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

export function sanitizeLocalizedTextMap(value: unknown): LocalizedTextMap | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const sanitized = Object.entries(value).reduce<LocalizedTextMap>((acc, [locale, text]) => {
    if (!isSupportedLocale(locale) || !hasText(text)) {
      return acc;
    }

    acc[locale] = text.trim();
    return acc;
  }, {});

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

export function sanitizeTranslationFieldMap<T extends object>(value: unknown): Partial<T> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce<Partial<T>>((acc, [field, localizedValue]) => {
    const sanitized = sanitizeLocalizedTextMap(localizedValue);
    if (sanitized) {
      acc[field as keyof T] = sanitized as T[keyof T];
    }
    return acc;
  }, {});
}

export function hasAdditionalLocaleContent(
  translations: Record<string, LocalizedTextMap | undefined> | undefined,
): boolean {
  if (!translations) return false;

  return Object.values(translations).some((localizedValue) =>
    Object.values(localizedValue ?? {}).some((text) => hasText(text)),
  );
}

export function resolveLocalizedText(
  baseValue: string | null | undefined,
  localizedValue: LocalizedTextMap | undefined,
  locale: SupportedLocale,
): string | null {
  const requested = localizedValue?.[locale];
  if (hasText(requested)) {
    return requested.trim();
  }

  if (locale !== DEFAULT_LOCALE) {
    const fallback = localizedValue?.[DEFAULT_LOCALE];
    if (hasText(fallback)) {
      return fallback.trim();
    }
  }

  return hasText(baseValue) ? baseValue.trim() : null;
}
