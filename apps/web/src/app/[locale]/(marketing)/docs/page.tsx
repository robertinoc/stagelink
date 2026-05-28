import type { Metadata } from 'next';
import { getLandingT } from '@/lib/landing-translations';
import { ComingSoonPage } from '@/features/marketing/components/ComingSoonPage';
import { buildLocalizedAlternates } from '@/lib/seo-localization';
import type { SupportedLocale } from '@stagelink/types';

/**
 * /docs — Documentation hub (placeholder)
 *
 * Scalable structure for future CMS integration:
 *   docs/
 *     page.tsx          ← this file (listing / index)
 *     [slug]/
 *       page.tsx        ← individual doc pages (add when content is ready)
 *
 * When building out:
 *   - Add a `docs/[slug]/page.tsx` for individual doc articles
 *   - Replace `PLACEHOLDER_SECTIONS` below with real categories fetched from CMS / MDX
 *   - Pass `generateStaticParams` in [slug]/page.tsx for SSG
 */

interface PageProps {
  params: Promise<{ locale: SupportedLocale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = getLandingT(locale);
  return {
    title: `${t.docs.eyebrow} — StageLink`,
    description: t.docs.description,
    alternates: {
      canonical: `/${locale}/docs`,
      languages: buildLocalizedAlternates('/docs'),
    },
  };
}

/**
 * Placeholder sections — replace with real categories when docs are ready.
 * Shown at 40% opacity so the page signals structure without implying live content.
 */
export default async function DocsPage({ params }: PageProps) {
  const { locale } = await params;
  const t = getLandingT(locale);

  return (
    <ComingSoonPage
      eyebrow={t.docs.eyebrow}
      title={t.docs.title}
      description={t.docs.description}
      comingSoon={t.docs.comingSoon}
      backLabel={t.docs.backLabel}
      backHref={`/${locale}`}
      items={t.docs.items}
    />
  );
}
