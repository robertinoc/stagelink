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

/**
 * Sitemap for StageLink.
 *
 * Covers indexable localized static public pages.
 *
 * TODO: add artist public pages when the backend exposes a paginated
 * "list all published pages" endpoint, e.g.:
 *
 *   const { usernames } = await fetchAllPublishedPageUsernames();
 *   const artistEntries = usernames.map((username) => ({
 *     url: `${appUrl}/${username}`,
 *     lastModified: new Date(),
 *     changeFrequency: 'weekly' as const,
 *     priority: 0.8,
 *   }));
 *   return [...staticEntries, ...artistEntries];
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = getCanonicalAppUrl();
  const lastModified = new Date();

  return STATIC_PUBLIC_ROUTES.flatMap((route) =>
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
}
