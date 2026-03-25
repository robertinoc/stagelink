import type { Metadata } from 'next';
import { geistSans, geistMono } from '@/lib/fonts';
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
