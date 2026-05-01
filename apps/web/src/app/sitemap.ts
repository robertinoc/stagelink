import type { MetadataRoute } from 'next';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stagelink.art';

/**
 * Sitemap for StageLink.
 *
 * Currently covers only static marketing/app pages.
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
  return [
    {
      url: appUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
