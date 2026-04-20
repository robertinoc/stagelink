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

const nextConfig: NextConfig = {
  transpilePackages: ['@stagelink/ui'],
  outputFileTracingRoot: path.join(configDir, '../..'),
  images: {
    remotePatterns: imagesHostname ? [{ protocol: 'https', hostname: imagesHostname }] : [],
  },
};

export default withNextIntl(nextConfig);
