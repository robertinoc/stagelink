'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { StickyTabs, type StickyTabItem } from '@/components/sl/StickyTabs';
import type {
  DashboardSettingsData,
  SettingsTabId,
} from '@/features/dashboard/settings/settings-data';
import { resolvePlanLabel, resolveTabId } from '@/features/dashboard/settings/settings-data';

// Each tab is its own code-split chunk. The user only downloads the tab
// they open (~80–150 kB each pre-gzip), instead of paying for all four on
// every settings page load. `ssr: false` is safe here because the
// `SettingsTabs` component is already client-only, and the inactive tabs
// are never rendered (see `TabPanel` below) so they never reach the
// server anyway.
const TAB_LOADING: React.ReactNode = (
  <div className="h-[480px] animate-pulse rounded-3xl border border-white/8 bg-white/[0.025]" />
);

const PlanTab = dynamic(() => import('./PlanTab').then((m) => m.PlanTab), {
  ssr: false,
  loading: () => TAB_LOADING,
});
const ConnectionsTab = dynamic(() => import('./ConnectionsTab').then((m) => m.ConnectionsTab), {
  ssr: false,
  loading: () => TAB_LOADING,
});
const StoresTab = dynamic(() => import('./StoresTab').then((m) => m.StoresTab), {
  ssr: false,
  loading: () => TAB_LOADING,
});
const PrivacyTab = dynamic(() => import('./PrivacyTab').then((m) => m.PrivacyTab), {
  ssr: false,
  loading: () => TAB_LOADING,
});

interface SettingsTabsProps {
  initialTab: SettingsTabId;
  locale: string;
  data: DashboardSettingsData;
}

/**
 * Client-side tab orchestrator for /dashboard/settings. Keeps the active
 * tab in sync with the `?tab=` query param so deep links + the 301
 * redirects from the legacy routes land on the right panel.
 */
export function SettingsTabs({ initialTab, locale, data }: SettingsTabsProps) {
  const t = useTranslations('dashboard.settings.tabs');
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const active = resolveTabId(search.get('tab') ?? initialTab);

  const onChange = useCallback(
    (id: SettingsTabId) => {
      const params = new URLSearchParams(search.toString());
      params.set('tab', id);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, search],
  );

  const items: ReadonlyArray<StickyTabItem<SettingsTabId>> = [
    {
      id: 'plan',
      label: t('plan.label'),
      hint: t('plan.hint'),
      badge: { label: resolvePlanLabel(data.summary.effectivePlan), tone: 'active' },
    },
    {
      id: 'connections',
      label: t('connections.label'),
      hint: t('connections.hint'),
      badge: {
        label: t('connections.badge', {
          connected: data.badges.connections.connected,
          total: data.badges.connections.total,
        }),
      },
    },
    {
      id: 'stores',
      label: t('stores.label'),
      hint: t('stores.hint'),
      badge: {
        label: t('stores.badge', {
          connected: data.badges.stores.connected,
          total: data.badges.stores.total,
        }),
      },
    },
    {
      id: 'privacy',
      label: t('privacy.label'),
      hint: t('privacy.hint'),
      badge: null,
    },
  ];

  return (
    <div className="@container overflow-x-hidden px-0 sm:px-8">
      <StickyTabs items={items} active={active} onChange={onChange} ariaLabel={t('aria_label')} />
      <div className="space-y-6 pb-16 pt-6">
        <TabPanel id="plan" active={active}>
          <PlanTab data={data} locale={locale} />
        </TabPanel>
        <TabPanel id="connections" active={active}>
          <ConnectionsTab data={data} locale={locale} />
        </TabPanel>
        <TabPanel id="stores" active={active}>
          <StoresTab data={data} locale={locale} />
        </TabPanel>
        <TabPanel id="privacy" active={active}>
          <PrivacyTab data={data} locale={locale} />
        </TabPanel>
      </div>
    </div>
  );
}

function TabPanel({
  id,
  active,
  children,
}: {
  id: SettingsTabId;
  active: SettingsTabId;
  children: React.ReactNode;
}) {
  const isActive = id === active;
  return (
    <div
      role="tabpanel"
      id={`settings-panel-${id}`}
      aria-labelledby={`settings-tab-${id}`}
      hidden={!isActive}
      className={isActive ? 'space-y-6' : undefined}
    >
      {isActive ? children : null}
    </div>
  );
}
