import type { Metadata } from 'next';
import { LandingPage } from '@/features/marketing/components/LandingPage';
import { getLandingT } from '@/lib/landing-translations';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = getLandingT(locale);

  return {
    title: t.seo.title,
    description: t.seo.description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: '/en',
        es: '/es',
      },
    },
    openGraph: {
      title: t.seo.ogTitle,
      description: t.seo.ogDescription,
      url: `/${locale}`,
      type: 'website',
      locale: locale === 'es' ? 'es_AR' : 'en_US',
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
