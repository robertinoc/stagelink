import type { Metadata } from 'next';
import { getLandingT } from '@/lib/landing-translations';
import { ComingSoonPage } from '@/features/marketing/components/ComingSoonPage';
import { buildLocalizedAlternates } from '@/lib/seo-localization';
import type { SupportedLocale } from '@stagelink/types';

/**
 * /blog — Blog listing (placeholder)
 *
 * Scalable structure for future CMS integration:
 *   blog/
 *     page.tsx          ← this file (post listing)
 *     [slug]/
 *       page.tsx        ← individual blog posts (add when content is ready)
 *
 * When building out:
 *   - Add a `blog/[slug]/page.tsx` for individual articles
 *   - Replace `PLACEHOLDER_TOPICS` below with real posts fetched from CMS / MDX / DB
 *   - Add category filters, pagination, and an RSS feed route at blog/rss.xml
 */

interface PageProps {
  params: Promise<{ locale: SupportedLocale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = getLandingT(locale);
  return {
    title: `${t.blog.eyebrow} — StageLink`,
    description: t.blog.description,
    alternates: {
      canonical: `/${locale}/blog`,
      languages: buildLocalizedAlternates('/blog'),
    },
  };
}

/**
 * Placeholder topics — replace with real post cards when content is ready.
 * Shown at 40% opacity so the page signals structure without implying live content.
 */
export default async function BlogPage({ params }: PageProps) {
  const { locale } = await params;
  const t = getLandingT(locale);

  return (
    <ComingSoonPage
      eyebrow={t.blog.eyebrow}
      title={t.blog.title}
      description={t.blog.description}
      comingSoon={t.blog.comingSoon}
      backLabel={t.blog.backLabel}
      backHref={`/${locale}`}
      items={t.blog.items}
    />
  );
}
