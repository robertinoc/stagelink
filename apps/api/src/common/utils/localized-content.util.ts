import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type LocalizedTextMap,
  type SupportedLocale,
} from '@stagelink/types';

type TranslationFieldMap = Record<string, LocalizedTextMap | undefined>;
type TranslationFieldOptions<T extends object> = {
  allowedFields?: readonly Extract<keyof T, string>[];
  defaultMaxLength?: number;
  maxLengthByField?: Partial<Record<Extract<keyof T, string>, number>>;
};
interface LocalizedDocumentField {
  baseValue: string | null | undefined;
  localizedValue?: LocalizedTextMap;
  required?: boolean;
}

const DEFAULT_LOCALIZED_TEXT_MAX_LENGTH = 5000;

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

export function normalizeBaseLocale(value: unknown): SupportedLocale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

export function sanitizeLocalizedTextMap(
  value: unknown,
  options?: { maxLength?: number },
): LocalizedTextMap | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const maxLength = options?.maxLength ?? DEFAULT_LOCALIZED_TEXT_MAX_LENGTH;
  const sanitized = Object.entries(value).reduce<LocalizedTextMap>((acc, [locale, text]) => {
    if (!isSupportedLocale(locale) || !hasText(text)) {
      return acc;
    }

    acc[locale] = text.trim().slice(0, maxLength);
    return acc;
  }, {});

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

export function sanitizeTranslationFieldMap<T extends object>(
  value: unknown,
  options?: TranslationFieldOptions<T>,
): Partial<T> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const allowedFields = options?.allowedFields ? new Set<string>(options.allowedFields) : null;
  const defaultMaxLength = options?.defaultMaxLength ?? DEFAULT_LOCALIZED_TEXT_MAX_LENGTH;

  return Object.entries(value).reduce<Partial<T>>((acc, [field, localizedValue]) => {
    if (allowedFields && !allowedFields.has(field)) {
      return acc;
    }

    const maxLength =
      options?.maxLengthByField?.[field as Extract<keyof T, string>] ?? defaultMaxLength;
    const sanitized = sanitizeLocalizedTextMap(localizedValue, { maxLength });
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

export function isLocaleCompleteForDocument(
  locale: SupportedLocale,
  fields: LocalizedDocumentField[],
): boolean {
  return fields
    .filter(({ baseValue, required = true }) => required && hasText(baseValue))
    .every(({ localizedValue }) => hasText(localizedValue?.[locale]));
}

export function resolveDocumentLocale(
  requestedLocale: SupportedLocale,
  baseLocale: unknown,
  fields: LocalizedDocumentField[],
): SupportedLocale {
  const normalizedBaseLocale = normalizeBaseLocale(baseLocale);
  if (requestedLocale === normalizedBaseLocale) {
    return normalizedBaseLocale;
  }

  return isLocaleCompleteForDocument(requestedLocale, fields)
    ? requestedLocale
    : normalizedBaseLocale;
}

export function resolveDocumentText(
  baseValue: string | null | undefined,
  localizedValue: LocalizedTextMap | undefined,
  localeToRender: SupportedLocale,
  baseLocale: unknown,
): string | null {
  const normalizedBaseLocale = normalizeBaseLocale(baseLocale);
  if (localeToRender === normalizedBaseLocale) {
    return hasText(baseValue) ? baseValue.trim() : null;
  }

  const translated = localizedValue?.[localeToRender];
  return hasText(translated) ? translated.trim() : null;
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

/**
 * Use this helper for independently localized block fields where falling back
 * field-by-field is preferred over the stricter document-level locale policy.
 */
export function resolveFieldLevelLocalizedText(
  baseValue: string | null | undefined,
  localizedValue: LocalizedTextMap | undefined,
  locale: SupportedLocale,
): string | null {
  return resolveLocalizedText(baseValue, localizedValue, locale);
}
