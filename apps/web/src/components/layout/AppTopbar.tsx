'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { Artist } from '@/lib/api/artists';

interface AppTopbarProps {
  artist: Artist | null;
  /** Callback wired to the mobile Sheet open handler. */
  onMenuOpen: () => void;
}

export function AppTopbar({ artist, onMenuOpen }: AppTopbarProps) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initials = artist?.displayName ? artist.displayName.charAt(0).toUpperCase() : '?';

  const otherLocale = locale === 'en' ? 'es' : 'en';
  // Replace leading /{locale} segment with the other locale, and preserve the
  // current query string (e.g. Settings' ?tab=connections) so switching
  // language doesn't bounce the user back to the default tab/state.
  const query = searchParams.toString();
  const otherLocalePath = `/${otherLocale}${pathname.replace(/^\/[a-z]{2}/, '')}${
    query ? `?${query}` : ''
  }`;

  return (
    <header className="flex h-14 items-center border-b border-white/10 bg-sidebar px-4 lg:px-6">
      {/* Hamburger — only visible on mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="mr-2 lg:hidden"
        onClick={onMenuOpen}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Logo — only visible on mobile (desktop shows it in the sidebar) */}
      <Link
        href={`/${locale}`}
        className="font-bold text-lg tracking-tight lg:hidden font-[family-name:var(--font-heading)]"
      >
        <span className="text-white">Stage</span>
        <span className="text-gradient-brand">Link</span>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side: artist identity + logout */}
      <div className="flex items-center gap-3">
        {/* Artist avatar with initials fallback */}
        {artist?.avatarUrl ? (
          <Image
            src={artist.avatarUrl}
            alt={artist.displayName}
            width={32}
            height={32}
            sizes="32px"
            unoptimized={!process.env.NEXT_PUBLIC_IMAGES_HOSTNAME}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-white/10"
          />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-white text-xs font-semibold"
            title={artist?.displayName ?? ''}
          >
            {initials}
          </div>
        )}

        {/* Artist name — hidden on very small screens */}
        {artist?.displayName && (
          <span className="hidden text-sm font-medium text-white/70 sm:block">
            {artist.displayName}
          </span>
        )}

        {/* Language toggle — always visible (especially useful in PWA where URL bar is hidden) */}
        <Link
          href={otherLocalePath}
          className="text-xs font-medium uppercase tracking-widest text-white/60 transition-colors hover:text-white"
          title={otherLocale === 'en' ? 'Switch to English' : 'Cambiar a Español'}
        >
          {otherLocale}
        </Link>

        {/* Logout */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/auth/signout"
          className="text-sm text-white/50 transition-colors hover:text-white"
        >
          {t('logout')}
        </a>
      </div>
    </header>
  );
}
