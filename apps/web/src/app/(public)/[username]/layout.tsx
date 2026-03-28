import { headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

const LOCALES = ['en', 'es'] as const;
type PublicLocale = (typeof LOCALES)[number];

/**
 * Detects the preferred locale from the Accept-Language header.
 * Public artist pages are served without a locale URL prefix, so locale
 * is inferred from the browser rather than the URL.
 */
function detectLocale(acceptLanguage: string): PublicLocale {
  const primary = acceptLanguage.split(',')[0]?.split(';')[0]?.trim().toLowerCase() ?? '';
  return primary.startsWith('es') ? 'es' : 'en';
}

interface PublicLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout for public artist pages at /{username}.
 *
 * Provides next-intl context without relying on the i18n middleware
 * (which is bypassed for these routes). Locale is detected from
 * Accept-Language and set via setRequestLocale for Server Components.
 * NextIntlClientProvider makes translations available to Client Components
 * (e.g. EmailCaptureRenderer).
 */
export default async function PublicArtistLayout({ children }: PublicLayoutProps) {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') ?? '';
  const locale = detectLocale(acceptLanguage);

  // Make locale available to all Server Components in this subtree
  // (getTranslations calls without explicit locale will use this).
  setRequestLocale(locale);

  const messages = (await import(`@/i18n/messages/${locale}.json`)).default as Record<
    string,
    unknown
  >;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
