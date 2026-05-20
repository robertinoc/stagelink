'use client';

// EpkTabBar — 4-tab horizontal navigation for EpkEditorV2.
// Tabs: Identity | Media | Booking | Locales (Locales gated on hasMultiLanguageAccess)

export type EpkTab = 'identity' | 'media' | 'booking' | 'locales';

interface TabDef {
  id: EpkTab;
  label: string;
  icon: string;
}

const TABS: TabDef[] = [
  { id: 'identity', label: 'Identity', icon: '✦' },
  { id: 'media', label: 'Media', icon: '🖼' },
  { id: 'booking', label: 'Booking', icon: '📋' },
  { id: 'locales', label: 'Languages', icon: '🌐' },
];

interface EpkTabBarProps {
  activeTab: EpkTab;
  onChange: (tab: EpkTab) => void;
  hasMultiLanguageAccess: boolean;
}

export function EpkTabBar({ activeTab, onChange, hasMultiLanguageAccess }: EpkTabBarProps) {
  const visibleTabs = TABS.filter((t) => t.id !== 'locales' || hasMultiLanguageAccess);

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        overflowX: 'auto',
        padding: '4px 0',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {visibleTabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              border: active
                ? '1px solid rgba(224,64,251,0.35)'
                : '1px solid rgba(255,255,255,0.07)',
              background: active ? 'rgba(224,64,251,0.12)' : 'rgba(255,255,255,0.03)',
              color: active ? '#E040FB' : 'rgba(255,255,255,0.55)',
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.5,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 13, lineHeight: 1 }}>{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
