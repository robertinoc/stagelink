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
    title: `${t.legal.privacy.title} — StageLink`,
    description: t.legal.privacy.title,
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: buildLocalizedAlternates('/privacy'),
    },
    // Draft content — keep out of the index until the lawyer-reviewed copy lands.
    robots: { index: false, follow: true },
  };
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  const t = getLandingT(locale);
  return (
    <LegalPage
      eyebrow={t.legal.eyebrow}
      title={t.legal.privacy.title}
      lastUpdatedLabel={t.legal.lastUpdatedLabel}
      reviewNotice={t.legal.reviewNotice}
      sections={t.legal.privacy.sections}
      backLabel={t.legal.backLabel}
      backHref={`/${locale}`}
    />
  );
}
