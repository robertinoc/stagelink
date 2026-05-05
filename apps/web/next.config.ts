import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

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

const nextConfig: NextConfig = {
  transpilePackages: ['@stagelink/ui'],
  outputFileTracingRoot: path.join(configDir, '../..'),
  images: {
    remotePatterns: imagesHostname ? [{ protocol: 'https', hostname: imagesHostname }] : [],
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
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
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
   * Why next.config.ts instead of middleware: empirical testing showed that
   * middleware-based host rewrites don't fire reliably for the root path on
   * Vercel Edge (the /api/admin/debug/headers diagnostic confirmed all four
   * hostname sources return "behind.stagelink.art" correctly, yet the
   * middleware Rule 4 wasn't applying for /). next.config.ts rewrites with
   * `has: { type: 'host' }` are processed by Vercel's CDN layer before the
   * file system check and are the canonical Next.js mechanism for this.
   *
   * Rules below cover:
   *   - /                          → /en/behind
   *   - /en or /es (cached prefix) → /en/behind
   *   - /en/foo or /es/foo         → /en/behind/foo
   *   - /anything-else             → /en/behind/anything-else
   *   - /api/*, /_next/*, /_vercel/* are excluded (negative lookahead)
   */
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/:locale(en|es)',
          has: [{ type: 'host', value: BEHIND_HOST }],
          destination: '/en/behind',
        },
        {
          source: '/:locale(en|es)/:path*',
          has: [{ type: 'host', value: BEHIND_HOST }],
          destination: '/en/behind/:path*',
        },
        {
          source: '/',
          has: [{ type: 'host', value: BEHIND_HOST }],
          destination: '/en/behind',
        },
        {
          source: '/:path((?!api|_next|_vercel).+)',
          has: [{ type: 'host', value: BEHIND_HOST }],
          destination: '/en/behind/:path',
        },
      ],
    };
  },
};

export default withNextIntl(nextConfig);
