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
import type { Artist } from '@/lib/api/artists';
import type { PlanCode } from '@stagelink/types';

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
];

/** Help is separated from the main nav by a spacer */
const HELP_ITEM: NavItem = { icon: HelpCircle, labelKey: 'nav.help', href: 'dashboard/help' };

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
      return null; // Free plan: no badge
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
    {
      id: 'privacy',
      label: t('dashboard.settings.navigation.privacy'),
      href: `${settingsBaseHref}/privacy`,
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
  const planLabel = resolvePlanLabel(effectivePlan);

  function NavLink({ item }: { item: NavItem }) {
    const href = `/${locale}/${item.href}`;
    const active = isActive(item);
    const isSettings = item.href === 'dashboard/settings';

    return (
      <div>
        <Link
          href={href}
          onClick={onNavigate}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-[10px] border px-[14px] py-[10px] text-sm transition-colors',
            active
              ? 'border-[rgba(155,48,208,0.30)] bg-[rgba(155,48,208,0.18)] font-semibold text-white'
              : 'border-transparent text-white/70 hover:bg-white/10 hover:text-white',
          )}
        >
          <item.icon
            className={cn(
              'h-[18px] w-[18px] flex-shrink-0',
              active ? 'text-[#E040FB]' : 'text-white/50',
            )}
            aria-hidden="true"
          />
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
  }

  return (
    <aside
      className="flex h-full w-60 flex-col border-r border-white/8"
      style={{ background: 'var(--sl-bg-deep, #0D0A1A)' }}
    >
      {/* ── Logo ── */}
      <div className="px-6 pb-6 pt-5">
        <Link
          href={`/${locale}`}
          className="font-[family-name:var(--font-heading)] text-[22px] font-extrabold leading-none tracking-[-0.02em]"
        >
          <span className="text-white">Stage</span>
          <span className="text-sl-grad">Link</span>
        </Link>
      </div>

      {/* ── Artist profile card ── */}
      <div className="mx-4 mb-5 flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.025] px-[10px] py-3">
        {artist?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artist.avatarUrl}
            alt={artist.displayName}
            className="h-[38px] w-[38px] flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold tracking-[0.3px] text-white">
            {artist?.displayName ?? artist?.username ?? '—'}
          </p>
          {artist?.username && (
            <p className="truncate text-[11px] text-white/50">@{artist.username}</p>
          )}
        </div>
        {planLabel && (
          <span
            className="shrink-0 rounded-full border border-[rgba(224,64,251,0.3)] px-[7px] py-[3px] text-[9px] font-bold uppercase tracking-[1px] text-[#E040FB]"
            style={{ background: 'var(--sl-grad-soft)' }}
          >
            {planLabel}
          </span>
        )}
      </div>

      {/* ── Primary navigation ── */}
      <nav className="flex flex-1 flex-col gap-0.5 px-4">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {/* Spacer + Help (visually separated) */}
        <div className="mt-3" />
        <NavLink item={HELP_ITEM} />
      </nav>

      {/* ── Footer: view public page link ── */}
      {artist?.username && (
        <div className="border-t border-white/8 p-4">
          <a
            href={`/p/${artist.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-[10px] border border-transparent px-[10px] py-3 text-[13px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-[14px] w-[14px] flex-shrink-0 text-white/50" />
            <span>{t('nav.view_page')}</span>
          </a>
        </div>
      )}
    </aside>
  );
}
