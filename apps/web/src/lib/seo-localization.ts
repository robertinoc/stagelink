import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from '@stagelink/types';

const OPEN_GRAPH_LOCALES: Record<SupportedLocale, string> = {
  en: 'en_US',
  es: 'es_AR',
};

function normalizePath(path: string) {
  if (!path || path === '/') return '';
  return path.startsWith('/') ? path : `/${path}`;
}

export function buildLocalizedAlternates(path: string, origin?: string) {
  const normalizedPath = normalizePath(path);
  const prefix = origin?.replace(/\/$/, '') ?? '';

  const languages = Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, `${prefix}/${locale}${normalizedPath}`]),
  ) as Record<SupportedLocale, string>;

  return {
    ...languages,
    'x-default': languages[DEFAULT_LOCALE],
  };
}

export function getOpenGraphLocale(locale: SupportedLocale) {
  return OPEN_GRAPH_LOCALES[locale];
}

export function getAlternateOpenGraphLocales(locale: SupportedLocale) {
  return SUPPORTED_LOCALES.filter((candidate) => candidate !== locale).map(
    (candidate) => OPEN_GRAPH_LOCALES[candidate],
  );
}
