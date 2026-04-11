import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@stagelink/types';

const locales = SUPPORTED_LOCALES;
export type Locale = SupportedLocale;

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  if (!locale || !locales.includes(locale as Locale)) notFound();

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
