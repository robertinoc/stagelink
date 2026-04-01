import type { MetadataRoute } from 'next';

/**
 * robots.txt for StageLink.
 *
 * Allow: public artist pages at /{username} (canonical).
 * Disallow: locale-prefixed app shell routes and the internal /p/ rewrite target.
 *
 * Crawlers should only index public artist pages and the root.
 * Authenticated app routes (/en/dashboard, /en/settings, etc.) must not be indexed.
 */
export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.stagelink.io';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/en/', // App shell (authenticated routes)
          '/es/', // App shell — Spanish locale
          '/p/', // Internal rewrite target — canonical is /{username}
          '/go/', // Smart link redirect handler — not indexable content
        ],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
