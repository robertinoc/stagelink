'use client';

// EpkTabBar — sticky 4-tab navigation matching design handoff.
// Each tab has a label + hint subtitle, with an underline gradient indicator
// on the active tab. Sticky at top with backdrop blur.

import { useTranslations } from 'next-intl';

export type EpkTab = 'template' | 'identity' | 'media' | 'booking' | 'locales';

interface TabDef {
  id: EpkTab;
  labelKey: string;
  hintKey: string;
}

const TABS: TabDef[] = [
  { id: 'template', labelKey: 'tabs.templateLabel', hintKey: 'tabs.templateHint' },
  { id: 'identity', labelKey: 'tabs.identityLabel', hintKey: 'tabs.identityHint' },
  { id: 'media', labelKey: 'tabs.mediaLabel', hintKey: 'tabs.mediaHint' },
  { id: 'booking', labelKey: 'tabs.bookingLabel', hintKey: 'tabs.bookingHint' },
  { id: 'locales', labelKey: 'tabs.localesLabel', hintKey: 'tabs.localesHint' },
];

interface EpkTabBarProps {
  activeTab: EpkTab;
  onChange: (tab: EpkTab) => void;
  hasMultiLanguageAccess: boolean;
}

export function EpkTabBar({ activeTab, onChange, hasMultiLanguageAccess }: EpkTabBarProps) {
  const t = useTranslations('dashboard.epk.editor');
  // All 4 tabs are always visible. Free users see the Languages tab with a
  // lock badge; the content panel inside (LocalizedEpkContentSection) handles
  // the FeatureLockCta upsell.
  const visibleTabs = TABS;

  return (
    <div
      // -mx-4 px-4 on mobile (matches AppShell p-4); -mx-6 px-6 on sm+ (matches sm:p-6).
      // These mirror the content wrapper's horizontal padding so the tab bar goes
      // full-bleed without overflowing the viewport and triggering horizontal scroll.
      className="-mx-4 px-4 sm:-mx-6 sm:px-6"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        background: 'rgba(13,10,26,0.85)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {visibleTabs.map((tab) => {
          const active = tab.id === activeTab;
          const locked = tab.id === 'locales' && !hasMultiLanguageAccess;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              style={{
                position: 'relative',
                background: 'transparent',
                border: 'none',
                padding: '14px 18px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
                fontFamily: 'var(--font-body)',
                color: active ? 'white' : 'rgba(255,255,255,0.5)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'color 0.15s',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                }}
              >
                {t(tab.labelKey)}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
                }}
              >
                {t(tab.hintKey)}
              </span>
              {locked && (
                <span
                  aria-hidden="true"
                  title={t('tabs.lockedTitle')}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'rgba(224,64,251,0.15)',
                    color: '#E040FB',
                    border: '1px solid rgba(224,64,251,0.35)',
                    letterSpacing: 0.4,
                  }}
                >
                  PRO+
                </span>
              )}
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    left: 12,
                    right: 12,
                    bottom: 0,
                    height: 2,
                    background: 'linear-gradient(135deg,#E040FB 0%,#9B30D0 45%,#4A1A8C 100%)',
                    borderRadius: 2,
                    boxShadow: '0 0 8px rgba(224,64,251,0.5)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
