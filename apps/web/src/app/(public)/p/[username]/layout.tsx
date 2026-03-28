import { headers } from 'next/headers';
import type { AbstractIntlMessages } from 'next-intl';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { detectLocale } from '@/lib/detect-locale';
import { geistSans, geistMono } from '@/lib/fonts';

interface PublicLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout for public artist pages at /{username}.
 *
 * Owns <html lang> and <body> (root layout delegates html/body to child
 * layouts so each route tree sets the correct lang attribute).
 *
 * Locale is detected from Accept-Language (no URL prefix on public pages)
 * and set via setRequestLocale for Server Components. NextIntlClientProvider
 * makes translations available to Client Components (e.g. EmailCaptureRenderer).
 */
export default async function PublicArtistLayout({ children }: PublicLayoutProps) {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') ?? '';
  const locale = detectLocale(acceptLanguage);

  // Make locale available to all Server Components in this subtree
  // (getTranslations calls without explicit locale will use this).
  setRequestLocale(locale);

  const messages = (await import(`@/i18n/messages/${locale}.json`)).default as AbstractIntlMessages;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
