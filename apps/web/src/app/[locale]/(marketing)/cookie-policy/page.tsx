import type { Metadata } from 'next';
import { getLandingT } from '@/lib/landing-translations';
import { LegalPage } from '@/features/marketing/components/LegalPage';
import { buildLocalizedAlternates } from '@/lib/seo-localization';
import type { SupportedLocale } from '@stagelink/types';

interface PageProps {
  params: Promise<{ locale: SupportedLocale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = getLandingT(locale);
  return {
    title: `${t.legal.cookies.title} — StageLink`,
    description: t.legal.cookies.title,
    alternates: {
      canonical: `/${locale}/cookie-policy`,
      languages: buildLocalizedAlternates('/cookie-policy'),
    },
    // Draft content — keep out of the index until the lawyer-reviewed copy lands.
    robots: { index: false, follow: true },
  };
}

export default async function CookiePolicyPage({ params }: PageProps) {
  const { locale } = await params;
  const t = getLandingT(locale);
  return (
    <LegalPage
      eyebrow={t.legal.eyebrow}
      title={t.legal.cookies.title}
      lastUpdatedLabel={t.legal.lastUpdatedLabel}
      reviewNotice={t.legal.reviewNotice}
      sections={t.legal.cookies.sections}
      backLabel={t.legal.backLabel}
      backHref={`/${locale}`}
    />
  );
}
