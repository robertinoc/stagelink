import type { Metadata } from 'next';
import { LandingPage } from '@/features/marketing/components/LandingPage';
import { getLandingT } from '@/lib/landing-translations';
import {
  buildLocalizedAlternates,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
} from '@/lib/seo-localization';
import type { SupportedLocale } from '@stagelink/types';

interface HomePageProps {
  params: Promise<{ locale: SupportedLocale }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = getLandingT(locale);

  return {
    title: t.seo.title,
    description: t.seo.description,
    alternates: {
      canonical: `/${locale}`,
      languages: buildLocalizedAlternates('/'),
    },
    openGraph: {
      title: t.seo.ogTitle,
      description: t.seo.ogDescription,
      url: `/${locale}`,
      type: 'website',
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
    },
    twitter: {
      card: 'summary_large_image',
      title: t.seo.ogTitle,
      description: t.seo.ogDescription,
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  return <LandingPage locale={locale} />;
}
