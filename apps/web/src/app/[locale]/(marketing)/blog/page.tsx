import type { Metadata } from 'next';
import { getLandingT } from '@/lib/landing-translations';
import { ComingSoonPage } from '@/features/marketing/components/ComingSoonPage';

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
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = getLandingT(locale);
  return {
    title: `${t.blog.eyebrow} — StageLink`,
    description: t.blog.description,
    alternates: {
      canonical: `/${locale}/blog`,
      languages: {
        en: '/en/blog',
        es: '/es/blog',
      },
    },
  };
}

/**
 * Placeholder topics — replace with real post cards when content is ready.
 * Shown at 40% opacity so the page signals structure without implying live content.
 */
const PLACEHOLDER_TOPICS = [
  {
    icon: '🎵',
    label: 'Artist presence',
    description: 'How to build a profile that actually represents who you are.',
  },
  {
    icon: '📣',
    label: 'Promotion tips',
    description: 'Getting your music in front of the right people.',
  },
  {
    icon: '📁',
    label: 'Press Kit guide',
    description: 'Everything a booker or journalist needs — in one place.',
  },
  {
    icon: '🤝',
    label: 'Bookings & gigs',
    description: 'Turning your page into a booking-ready asset.',
  },
  {
    icon: '📈',
    label: 'Grow your audience',
    description: 'Small moves that compound over time.',
  },
  {
    icon: '🎤',
    label: 'Artist stories',
    description: 'Real artists, real pages, real results.',
  },
];

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
      items={PLACEHOLDER_TOPICS}
    />
  );
}
