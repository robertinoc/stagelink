import type { MetadataRoute } from 'next';

/**
 * robots.txt for StageLink.
 *
 * Allow: localized public artist pages at /{locale}/{username}.
 * Disallow: authenticated app shell routes and the internal /p/ compatibility target.
 *
 * Crawlers should index marketing routes and localized public artist pages.
 * Authenticated app routes (/en/dashboard, /es/dashboard, etc.) must not be indexed.
 */
export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.stagelink.io';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/en/dashboard',
          '/en/onboarding',
          '/en/login',
          '/en/signup',
          '/en/settings',
          '/es/dashboard',
          '/es/onboarding',
          '/es/login',
          '/es/signup',
          '/es/settings',
          '/p/', // Internal rewrite target — canonical is /{username}
          '/go/', // Smart link redirect handler — not indexable content
        ],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
