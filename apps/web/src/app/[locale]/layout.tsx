import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { SUPPORTED_LOCALES } from '@stagelink/types';
import type { Locale } from '@/i18n/request';
import { spaceGrotesk, inter } from '@/lib/fonts';
import { PostHogProvider } from '@/lib/analytics/PostHogProvider';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} ${spaceGrotesk.variable} ${inter.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <PostHogProvider>{children}</PostHogProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
