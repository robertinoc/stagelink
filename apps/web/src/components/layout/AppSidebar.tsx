'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Globe,
  BarChart2,
  User,
  FileText,
  Settings,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import type { Artist } from '@/lib/api/artists';
import type { PlanCode } from '@stagelink/types';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  href: string;
  /** If true, only exact path match is active (not startsWith). */
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, labelKey: 'nav.dashboard', href: 'dashboard', exact: true },
  { icon: User, labelKey: 'nav.profile', href: 'dashboard/profile' },
  { icon: Globe, labelKey: 'nav.my_page', href: 'dashboard/page' },
  { icon: BarChart2, labelKey: 'nav.analytics', href: 'dashboard/analytics', exact: true },
  { icon: FileText, labelKey: 'nav.epk', href: 'dashboard/epk' },
  { icon: Settings, labelKey: 'nav.settings', href: 'dashboard/settings' },
  { icon: HelpCircle, labelKey: 'nav.help', href: 'dashboard/help' },
];

interface AppSidebarProps {
  artist: Artist | null;
  effectivePlan: PlanCode | null;
  /** Called after a nav link is clicked — used by mobile sheet to close itself. */
  onNavigate?: () => void;
}

function resolvePlanLabel(plan: PlanCode | null) {
  switch (plan) {
    case 'pro':
      return 'Pro';
    case 'pro_plus':
      return 'Pro+';
    default:
      return 'Free';
  }
}

export function AppSidebar({ artist, effectivePlan, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();
  const [activeHash, setActiveHash] = useState('');

  useEffect(() => {
    function updateHash() {
      setActiveHash(window.location.hash);
    }

    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, [pathname]);

  const settingsBaseHref = `/${locale}/dashboard/settings`;
  const settingsExpanded =
    pathname === settingsBaseHref || pathname.startsWith(`${settingsBaseHref}/`);
  const settingsChildren = [
    {
      id: 'plans-billing',
      label: t('dashboard.settings.navigation.plans_billing'),
      href: `${settingsBaseHref}/plans-billing`,
    },
    {
      id: 'insights-connections',
      label: t('dashboard.settings.navigation.insights_connections'),
      href: `${settingsBaseHref}/insights-connections`,
    },
    {
      id: 'shopify-store',
      label: t('dashboard.settings.navigation.shopify_store'),
      href: `${settingsBaseHref}/shopify-store`,
    },
    {
      id: 'smart-merch',
      label: t('dashboard.settings.navigation.smart_merch'),
      href: `${settingsBaseHref}/smart-merch`,
    },
  ];

  /** Returns true when the nav item should render as active. */
  function isActive(item: NavItem): boolean {
    const fullHref = `/${locale}/${item.href}`;
    if (item.exact) return pathname === fullHref;
    return pathname === fullHref || pathname.startsWith(`${fullHref}/`);
  }

  /** Initials fallback when no avatar URL is available. */
  const initials = artist?.displayName ? artist.displayName.charAt(0).toUpperCase() : '?';

  return (
    <aside className="flex h-full w-60 flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-white/10 px-6">
        <Link
          href={`/${locale}`}
          className="font-bold text-lg tracking-tight font-[family-name:var(--font-heading)]"
        >
          <span className="text-white">Stage</span>
          <span className="text-gradient-brand">Link</span>
        </Link>
      </div>

      {/* Artist identity */}
      <div className="flex items-center gap-3 px-4 py-4">
        {artist?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artist.avatarUrl}
            alt={artist.displayName}
            className="h-9 w-9 rounded-full object-cover flex-shrink-0 ring-2 ring-white/10"
          />
        ) : (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white text-sm font-semibold">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-tight text-white">
            {artist?.displayName ?? '—'}
          </p>
          {artist?.username && <p className="truncate text-xs text-white/50">@{artist.username}</p>}
          {effectivePlan && (
            <Badge variant="secondary" className="mt-1.5 text-[10px] uppercase tracking-wide">
              {resolvePlanLabel(effectivePlan)}
            </Badge>
          )}
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Primary navigation */}
      <nav className="flex-1 space-y-0.5 p-3 pt-2">
        {NAV_ITEMS.map((item) => {
          const href = `/${locale}/${item.href}`;
          const active = isActive(item);
          const isDashboard = item.href === 'dashboard';
          const isSettings = item.href === 'dashboard/settings';

          return (
            <div key={item.href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isDashboard &&
                    'mb-2 border border-primary/30 bg-primary/12 text-white shadow-[0_0_18px_rgba(168,85,247,0.12)]',
                  isDashboard && active && 'bg-primary/20 text-white font-medium',
                  isDashboard && !active && 'text-white hover:bg-primary/15',
                  !isDashboard &&
                    (active
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'),
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>{t(item.labelKey)}</span>
              </Link>

              {isSettings && settingsExpanded ? (
                <div
                  role="list"
                  aria-label="Settings submenu"
                  className="mt-1 ml-6 space-y-1 border-l border-white/10 pl-3"
                >
                  {settingsChildren.map((child) => {
                    const childActive =
                      pathname === child.href ||
                      pathname.startsWith(`${child.href}/`) ||
                      (pathname === settingsBaseHref && activeHash === `#${child.id}`);

                    return (
                      <Link
                        key={child.id}
                        href={child.href}
                        onClick={onNavigate}
                        role="listitem"
                        aria-current={childActive ? 'page' : undefined}
                        className={cn(
                          'block rounded-md px-3 py-1.5 text-xs transition-colors',
                          childActive
                            ? 'bg-primary/12 text-white'
                            : 'text-white/55 hover:bg-white/8 hover:text-white/85',
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      {/* Footer: view public page link */}
      {artist?.username && (
        <>
          <Separator className="bg-white/10" />
          <div className="p-3">
            <a
              href={`/p/${artist.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/50 transition-colors hover:bg-white/10 hover:text-white"
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
