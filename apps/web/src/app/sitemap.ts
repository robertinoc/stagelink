import type { MetadataRoute } from 'next';
import { SUPPORTED_LOCALES } from '@stagelink/types';
import { buildLocalizedAlternates } from '@/lib/seo-localization';
import { getCanonicalAppUrl } from '@/lib/site-url';

const STATIC_PUBLIC_ROUTES = [
  {
    path: '',
    changeFrequency: 'weekly' as const,
    priority: 1,
  },
  {
    path: '/pricing',
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  },
  {
    path: '/install',
    changeFrequency: 'yearly' as const,
    priority: 0.5,
  },
];

// Safety caps so a growing user base can't produce an unbounded sitemap or
// hammer the API during generation. Up to MAX_PAGES * PAGE_SIZE artist pages.
const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

interface PublishedPage {
  username: string;
  updatedAt: string;
}

/**
 * Fetches all published public pages from the API, paging through the cursor
 * until exhausted or the safety cap is hit. Any failure falls back to an empty
 * list so a transient API problem never breaks the whole sitemap.
 */
async function fetchPublishedPages(): Promise<PublishedPage[]> {
  const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const all: PublishedPage[] = [];
  let cursor: string | null = null;

  try {
    for (let i = 0; i < MAX_PAGES; i++) {
      const url = new URL('/api/public/pages/published', apiUrl);
      url.searchParams.set('limit', String(PAGE_SIZE));
      if (cursor) url.searchParams.set('cursor', cursor);

      // Revalidate hourly — sitemap freshness within an hour is fine and keeps
      // generation cheap.
      const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
      if (!res.ok) break;

      const data = (await res.json()) as { items: PublishedPage[]; nextCursor: string | null };
      all.push(...data.items);
      if (!data.nextCursor) break;
      cursor = data.nextCursor;
    }
  } catch {
    return [];
  }

  return all;
}

/**
 * Sitemap for StageLink.
 *
 * Covers indexable localized static public pages plus every published artist
 * page (`/{locale}/{username}`). Artist pages are sourced from
 * `GET /api/public/pages/published`, which only returns pages with
 * `isPublished = true`.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = getCanonicalAppUrl();
  const lastModified = new Date();

  const staticEntries = STATIC_PUBLIC_ROUTES.flatMap((route) =>
    SUPPORTED_LOCALES.map((locale) => ({
      url: `${appUrl}/${locale}${route.path}`,
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: buildLocalizedAlternates(route.path, appUrl),
      },
    })),
  );

  const publishedPages = await fetchPublishedPages();
  const artistEntries = publishedPages.flatMap((page) =>
    SUPPORTED_LOCALES.map((locale) => ({
      url: `${appUrl}/${locale}/${page.username}`,
      lastModified: new Date(page.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: {
        languages: buildLocalizedAlternates(`/${page.username}`, appUrl),
      },
    })),
  );

  return [...staticEntries, ...artistEntries];
}
