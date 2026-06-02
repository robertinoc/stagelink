import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const configDir = path.dirname(fileURLToPath(import.meta.url));

// Artist images (avatars, covers) are served from S3 / CDN.
// Set NEXT_PUBLIC_IMAGES_HOSTNAME to the hostname of your asset delivery URL,
// e.g. "your-bucket.s3.us-east-1.amazonaws.com" or "cdn.stagelink.io".
const imagesHostname = process.env.NEXT_PUBLIC_IMAGES_HOSTNAME;

/**
 * Canonical production domain.
 * All other hostnames either redirect here (www, .link) or are noindexed (Vercel URL).
 */
const CANONICAL_DOMAIN = 'stagelink.art';

/**
 * Behind the Stage admin subdomain.
 * Served by this same deployment via middleware host rewrite.
 * Must never be indexed by search engines.
 */
const BEHIND_HOST = 'behind\\.stagelink\\.art';

/**
 * Vercel deployment URL — not the canonical domain.
 * Search engines must not index it; it exists only for Vercel infrastructure.
 *
 * Note: Next.js `has.value` is treated as a regex, so dots are escaped.
 */
const VERCEL_DEPLOYMENT_HOST = 'stagelink-omega\\.vercel\\.app';

/**
 * Allowed external image hosts for `next/image`. PR #432 migrated the
 * release cover renderer to `<Image>` but the `remotePatterns` list at
 * the time only had the R2 hostname — so covers pointing at Spotify /
 * Beatport / Google search thumbnails got 400 INVALID_IMAGE_OPTIMIZE
 * from Vercel and fell through to the 💿 emoji fallback. This list
 * restores those covers and lets them benefit from WebP/AVIF transcoding
 * at the same time.
 *
 * Add a new host here when adding a new release-link platform.
 */
const EXTERNAL_IMAGE_HOSTS = [
  'i.scdn.co', // Spotify CDN — album covers from Spotify track URLs
  'geo-media.beatport.com', // Beatport CDN — release artwork
  'encrypted-tbn0.gstatic.com', // Google Image Search thumbnails (Bandcamp / Soundcloud fallback covers)
] as const;

const nextConfig: NextConfig = {
  transpilePackages: ['@stagelink/ui'],
  outputFileTracingRoot: path.join(configDir, '../..'),
  images: {
    remotePatterns: [
      ...(imagesHostname ? [{ protocol: 'https' as const, hostname: imagesHostname }] : []),
      ...EXTERNAL_IMAGE_HOSTS.map((hostname) => ({ protocol: 'https' as const, hostname })),
    ],
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      'recharts',
    ],
  },

  /**
   * Security + SEO response headers.
   *
   * X-Robots-Tag: noindex is injected on every response served from the
   * Vercel deployment URL so it is never indexed, regardless of the page's
   * own <meta name="robots"> tag (which only applies to the HTML page itself,
   * whereas this HTTP header applies to all resource types).
   */
  async headers() {
    return [
      {
        source: '/(.*)',
        has: [{ type: 'host', value: VERCEL_DEPLOYMENT_HOST }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/(.*)',
        has: [{ type: 'host', value: BEHIND_HOST }],
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          // Tell browsers to always use HTTPS for this subdomain for 1 year.
          // Eliminates the "had to type https://" problem after the first visit.
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },

  /**
   * Domain-level redirects (permanent 308 → 301 for GET).
   *
   * These only fire when the matching domain is pointed at this Vercel project.
   * Adding them here means zero Vercel dashboard config is required beyond
   * assigning the domains to the project.
   *
   * Covered:
   *   stagelink.link      → stagelink.art  (old domain → canonical)
   *   www.stagelink.link  → stagelink.art  (old domain www → canonical)
   *   www.stagelink.art   → stagelink.art  (naked canonical)
   */
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'stagelink\\.link' }],
        destination: `https://${CANONICAL_DOMAIN}/:path*`,
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www\\.stagelink\\.link' }],
        destination: `https://${CANONICAL_DOMAIN}/:path*`,
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www\\.stagelink\\.art' }],
        destination: `https://${CANONICAL_DOMAIN}/:path*`,
        permanent: true,
      },
    ];
  },

  /**
   * Host-based rewrites for behind.stagelink.art admin subdomain.
   *
   * The admin panel lives at the top-level /behind path (outside [locale])
   * to avoid conflicting with [locale]/[username] dynamic routing — when
   * Vercel rewrote / → /en/behind, Next.js was matching the dynamic
   * [username] route (notFound for "behind") instead of the static (admin)
   * route, returning 404 even though the rewrite path was correct.
   *
   * Path is internal-only and always English, so no locale prefix needed.
   *
   * Cascade prevention: beforeFiles rewrites keep matching while the host
   * stays the same, so the catch-all rule excludes paths already starting
   * with "behind" via negative lookahead.
   *
   * Rules:
   *   /                       → /behind
   *   /anything-not-rewritten → /behind/anything (excludes behind, api, _next, _vercel)
   */
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          has: [{ type: 'host', value: BEHIND_HOST }],
          destination: '/behind',
        },
        {
          // Excludes behind/api/_next/_vercel AND any path containing a dot
          // (static assets like icon-192.png, apple-icon.png, favicon.ico) so
          // the subdomain serves them from /public instead of rewriting them
          // to a non-existent /behind/icon-192.png (which 404s → no favicon).
          source: '/:path((?!behind|api|_next|_vercel|.*\\.).+)',
          has: [{ type: 'host', value: BEHIND_HOST }],
          destination: '/behind/:path',
        },
      ],
    };
  },
};

// Source map upload only runs when a Sentry auth token is present, so a
// build without Sentry credentials never fails — the wrapper is otherwise
// transparent. Runtime error capture is driven by NEXT_PUBLIC_SENTRY_DSN
// (see instrumentation.ts / instrumentation-client.ts), independent of this.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  telemetry: false,
});
