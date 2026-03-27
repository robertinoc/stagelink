'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Globe,
  BarChart2,
  User,
  CreditCard,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import type { Artist } from '@/lib/api/artists';

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  href: string;
  /** If true, only exact path match is active (not startsWith). */
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, labelKey: 'nav.dashboard', href: 'dashboard', exact: true },
  { icon: Globe, labelKey: 'nav.my_page', href: 'dashboard/page' },
  { icon: BarChart2, labelKey: 'nav.analytics', href: 'dashboard/analytics' },
  { icon: User, labelKey: 'nav.profile', href: 'dashboard/profile' },
  { icon: CreditCard, labelKey: 'nav.billing', href: 'dashboard/billing' },
  { icon: Settings, labelKey: 'nav.settings', href: 'dashboard/settings' },
];

interface AppSidebarProps {
  locale: string;
  artist: Artist | null;
  /** Called after a nav link is clicked — used by mobile sheet to close itself. */
  onNavigate?: () => void;
}

export function AppSidebar({ locale, artist, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations();

  /** Returns true when the nav item should render as active. */
  function isActive(item: NavItem): boolean {
    const fullHref = `/${locale}/${item.href}`;
    if (item.exact) return pathname === fullHref;
    return pathname === fullHref || pathname.startsWith(`${fullHref}/`);
  }

  /** Initials fallback when no avatar URL is available. */
  const initials = artist?.displayName ? artist.displayName.charAt(0).toUpperCase() : '?';

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-6">
        <Link href={`/${locale}`} className="font-bold text-lg tracking-tight">
          StageLink
        </Link>
      </div>

      {/* Artist identity */}
      <div className="flex items-center gap-3 px-4 py-4">
        {artist?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artist.avatarUrl}
            alt={artist.displayName}
            className="h-9 w-9 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-tight">{artist?.displayName ?? '—'}</p>
          {artist?.username && (
            <p className="truncate text-xs text-muted-foreground">@{artist.username}</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Primary navigation */}
      <nav className="flex-1 space-y-1 p-3 pt-2">
        {NAV_ITEMS.map((item) => {
          const href = `/${locale}/${item.href}`;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-secondary text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer: view public page link */}
      {artist?.username && (
        <>
          <Separator />
          <div className="p-3">
            <a
              href={`/${artist.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4 flex-shrink-0" />
              <span>{t('nav.view_page')}</span>
            </a>
          </div>
        </>
      )}
    </aside>
  );
}
