'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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

type SettingsTabId = 'plan' | 'connections' | 'stores' | 'privacy';

interface SettingsChild {
  id: SettingsTabId;
  label: string;
  href: string;
}

interface SidebarNavLinkProps {
  item: NavItem;
  locale: string;
  active: boolean;
  label: string;
  onNavigate?: () => void;
  settingsSubmenu?: {
    expanded: boolean;
    activeTab: SettingsTabId;
    children: SettingsChild[];
  };
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, labelKey: 'nav.dashboard', href: 'dashboard', exact: true },
  { icon: User, labelKey: 'nav.profile', href: 'dashboard/profile' },
  { icon: Globe, labelKey: 'nav.my_page', href: 'dashboard/page' },
  { icon: FileText, labelKey: 'nav.epk', href: 'dashboard/epk' },
  { icon: BarChart2, labelKey: 'nav.analytics', href: 'dashboard/analytics', exact: true },
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
      return 'Free';
  }
}

function resolveSettingsTab(
  pathname: string,
  settingsBaseHref: string,
  tabParam: string | null,
): SettingsTabId {
  if (tabParam === 'connections' || tabParam === 'stores' || tabParam === 'privacy') {
    return tabParam;
  }

  if (
    pathname === `${settingsBaseHref}/insights-connections` ||
    pathname.startsWith(`${settingsBaseHref}/insights-connections/`)
  ) {
    return 'connections';
  }

  if (
    pathname === `${settingsBaseHref}/shopify-store` ||
    pathname.startsWith(`${settingsBaseHref}/shopify-store/`) ||
    pathname === `${settingsBaseHref}/smart-merch` ||
    pathname.startsWith(`${settingsBaseHref}/smart-merch/`)
  ) {
    return 'stores';
  }

  if (
    pathname === `${settingsBaseHref}/privacy` ||
    pathname.startsWith(`${settingsBaseHref}/privacy/`)
  ) {
    return 'privacy';
  }

  return 'plan';
}

function SidebarNavLink({
  item,
  locale,
  active,
  label,
  onNavigate,
  settingsSubmenu,
}: SidebarNavLinkProps) {
  const href = `/${locale}/${item.href}`;

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
        <span>{label}</span>
      </Link>

      {settingsSubmenu?.expanded ? (
        <div
          role="list"
          aria-label="Settings submenu"
          className="mt-1 ml-6 space-y-1 border-l border-white/10 pl-3"
        >
          {settingsSubmenu.children.map((child) => {
            const childActive = settingsSubmenu.activeTab === child.id;

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

export function AppSidebar({ artist, effectivePlan, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations();

  const settingsBaseHref = `/${locale}/dashboard/settings`;
  const settingsExpanded =
    pathname === settingsBaseHref || pathname.startsWith(`${settingsBaseHref}/`);
  const activeSettingsTab = resolveSettingsTab(pathname, settingsBaseHref, searchParams.get('tab'));
  const settingsChildren: SettingsChild[] = [
    {
      id: 'plan',
      label: t('dashboard.settings.tabs.plan.label'),
      href: `${settingsBaseHref}?tab=plan`,
    },
    {
      id: 'connections',
      label: t('dashboard.settings.tabs.connections.label'),
      href: `${settingsBaseHref}?tab=connections`,
    },
    {
      id: 'stores',
      label: t('dashboard.settings.tabs.stores.label'),
      href: `${settingsBaseHref}?tab=stores`,
    },
    {
      id: 'privacy',
      label: t('dashboard.settings.tabs.privacy.label'),
      href: `${settingsBaseHref}?tab=privacy`,
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
          <Image
            src={artist.avatarUrl}
            alt={artist.displayName}
            width={38}
            height={38}
            sizes="40px"
            // Vercel image optimisation only runs when an explicit
            // remotePatterns entry matches (gated by NEXT_PUBLIC_IMAGES_HOSTNAME
            // in next.config.ts). Fall back to a passthrough so deploys without
            // that env still render the avatar instead of crashing on a 400.
            unoptimized={!process.env.NEXT_PUBLIC_IMAGES_HOSTNAME}
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
        {NAV_ITEMS.map((item) => {
          const isSettings = item.href === 'dashboard/settings';
          return (
            <SidebarNavLink
              key={item.href}
              item={item}
              locale={locale}
              active={isActive(item)}
              label={t(item.labelKey)}
              onNavigate={onNavigate}
              settingsSubmenu={
                isSettings
                  ? {
                      expanded: settingsExpanded,
                      activeTab: activeSettingsTab,
                      children: settingsChildren,
                    }
                  : undefined
              }
            />
          );
        })}

        {/* Spacer + Help (visually separated) */}
        <div className="mt-3" />
        <SidebarNavLink
          item={HELP_ITEM}
          locale={locale}
          active={isActive(HELP_ITEM)}
          label={t(HELP_ITEM.labelKey)}
          onNavigate={onNavigate}
        />
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
