import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | StageLink',
    default: 'StageLink — Your digital stage',
  },
  description: 'Create your artist page. Share music, links, videos and connect with your fans.',
  openGraph: {
    type: 'website',
    siteName: 'StageLink',
    title: 'StageLink — Your digital stage',
    description: 'Create your artist page. Share music, links, videos and connect with your fans.',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://stagelink.app'),
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
