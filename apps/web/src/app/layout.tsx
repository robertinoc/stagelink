import type { Metadata, Viewport } from 'next';
import { getCanonicalAppUrl } from '@/lib/site-url';
import './globals.css';

const appUrl = getCanonicalAppUrl();

export const metadata: Metadata = {
  applicationName: 'StageLink',
  title: {
    template: '%s | StageLink',
    default: 'StageLink — Artist Landing Page & Link in Bio for Musicians',
  },
  description:
    'Build your artist landing page in minutes. A modern link in bio for musicians, DJs, producers, and creators who want music, links, merch, and fans in one place.',
  keywords: [
    'artist landing page',
    'link in bio for artists',
    'landing page for musicians',
    'link in bio for DJs',
    'creator landing page',
    'artist bio link',
    'music creator profile',
    'musician website',
    'DJ landing page',
  ],
  openGraph: {
    type: 'website',
    siteName: 'StageLink',
    title: 'StageLink — Artist Landing Page & Link in Bio for Musicians',
    description:
      'Build your artist landing page in minutes. Centralize your music, links, merch, and fans in one place.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StageLink — Artist Landing Page & Link in Bio',
    description: 'A modern link-in-bio platform for musicians, DJs, producers, and creators.',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'StageLink',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  // Always resolve relative canonical/OG URLs against the canonical production
  // domain. The env var overrides this in staging/preview deployments if needed.
  metadataBase: new URL(appUrl),
};

export const viewport: Viewport = {
  themeColor: '#0b0b0f',
  colorScheme: 'dark',
};

/**
 * Root layout — global metadata and CSS only.
 *
 * <html> and <body> are intentionally delegated to child layouts so each
 * route tree can set the correct `lang` attribute:
 *   app/[locale]/layout.tsx          → lang from URL segment
 *   app/(public)/p/[username]/layout.tsx → lang from Accept-Language header
 *
 * Next.js allows this pattern when every route tree provides its own
 * <html>/<body>; the framework merges metadata from all layout levels.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
