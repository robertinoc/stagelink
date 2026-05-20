'use client';

// EpkTabBar — sticky 4-tab navigation matching design handoff.
// Each tab has a label + hint subtitle, with an underline gradient indicator
// on the active tab. Sticky at top with backdrop blur.

export type EpkTab = 'identity' | 'media' | 'booking' | 'locales';

interface TabDef {
  id: EpkTab;
  label: string;
  hint: string;
}

const TABS: TabDef[] = [
  { id: 'identity', label: 'Identidad & contacto', hint: 'Hero, bio, contactos' },
  { id: 'media', label: 'Media & galería', hint: 'Fotos, video, links' },
  { id: 'booking', label: 'Booking & rider', hint: 'Logística, técnico' },
  { id: 'locales', label: 'Idiomas', hint: 'Traducción del EPK' },
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
        position: 'sticky',
        top: 0,
        zIndex: 5,
        background: 'rgba(13,10,26,0.85)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginLeft: -32,
        marginRight: -32,
        paddingLeft: 32,
        paddingRight: 32,
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
                {tab.label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
                }}
              >
                {tab.hint}
              </span>
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
