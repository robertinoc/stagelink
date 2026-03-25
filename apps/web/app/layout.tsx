import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StageLink — Your Digital Stage',
  description:
    'StageLink helps artists create a professional landing page in minutes. Connect music, videos, merch, events and fan signups in one beautiful place.',
  openGraph: {
    title: 'StageLink — Your Digital Stage',
    description: 'One page for every song, show, drop and link.',
    siteName: 'StageLink',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
