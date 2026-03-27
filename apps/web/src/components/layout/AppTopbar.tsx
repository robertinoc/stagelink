'use client';

import Link from 'next/link';
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
  const initials = artist?.displayName ? artist.displayName.charAt(0).toUpperCase() : '?';

  return (
    <header className="flex h-14 items-center border-b bg-background px-4 lg:px-6">
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
      <Link href={`/${locale}`} className="font-bold text-lg tracking-tight lg:hidden">
        StageLink
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side: artist identity + logout */}
      <div className="flex items-center gap-3">
        {/* Artist avatar with initials fallback */}
        {artist?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artist.avatarUrl}
            alt={artist.displayName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold"
            title={artist?.displayName ?? ''}
          >
            {initials}
          </div>
        )}

        {/* Artist name — hidden on very small screens */}
        {artist?.displayName && (
          <span className="hidden text-sm font-medium sm:block">{artist.displayName}</span>
        )}

        {/* Logout — uses a full-page navigation so WorkOS clears the cookie correctly */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/auth/signout"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('logout')}
        </a>
      </div>
    </header>
  );
}
