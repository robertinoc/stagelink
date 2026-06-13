'use client';

// EpkLocaleSwitcher — compact language toggle for the public EPK page.
// Renders EN / ES chips; clicking either calls onLocaleChange (client-side
// translation) or falls back to a full navigation when onLocaleChange is absent.
// Accepts a `theme` prop so it blends into all 3 template aesthetics.

import { SUPPORTED_LOCALES, type SupportedLocale } from '@stagelink/types';

const LOCALE_FLAGS: Record<string, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
};

interface EpkLocaleSwitcherProps {
  currentLocale: SupportedLocale;
  username: string;
  /** Visual theme: 'dark' for Cinematic, 'light' for Studio, 'brand' for Brutalist */
  theme?: 'dark' | 'light' | 'brand';
  /**
   * When provided, locale switching is handled client-side (no page reload).
   * When absent, falls back to window.location.assign for backwards compat.
   */
  onLocaleChange?: (locale: SupportedLocale) => void;
  /** When true, shows a spinner on the active locale chip while translating. */
  translating?: boolean;
}

export function EpkLocaleSwitcher({
  currentLocale,
  username,
  theme = 'dark',
  onLocaleChange,
  translating = false,
}: EpkLocaleSwitcherProps) {
  const colors = {
    dark: {
      activeBg: 'rgba(224,64,251,0.2)',
      activeBorder: 'rgba(224,64,251,0.4)',
      activeColor: '#E040FB',
      inactiveBg: 'rgba(255,255,255,0.06)',
      inactiveBorder: 'rgba(255,255,255,0.12)',
      inactiveColor: 'rgba(255,255,255,0.5)',
    },
    light: {
      activeBg: 'rgba(0,0,0,0.08)',
      activeBorder: 'rgba(0,0,0,0.2)',
      activeColor: '#1a1a1a',
      inactiveBg: 'rgba(0,0,0,0.03)',
      inactiveBorder: 'rgba(0,0,0,0.1)',
      inactiveColor: 'rgba(0,0,0,0.4)',
    },
    brand: {
      activeBg: 'rgba(255,255,255,0.15)',
      activeBorder: 'rgba(255,255,255,0.3)',
      activeColor: 'var(--epk-ink, #fff)',
      inactiveBg: 'rgba(255,255,255,0.05)',
      inactiveBorder: 'rgba(255,255,255,0.12)',
      inactiveColor: 'rgba(255,255,255,0.4)',
    },
  }[theme];

  function handleSwitch(newLocale: SupportedLocale) {
    if (newLocale === currentLocale) return;
    if (onLocaleChange) {
      onLocaleChange(newLocale);
    } else {
      // Fallback: full page reload (backwards compat when parent hasn't opted in)
      window.location.assign(`/${newLocale}/${username}/epk`);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {SUPPORTED_LOCALES.map((loc) => {
        const active = loc === currentLocale;
        return (
          <button
            key={loc}
            type="button"
            disabled={translating && !active}
            onClick={() => handleSwitch(loc)}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              background: active ? colors.activeBg : colors.inactiveBg,
              border: `1px solid ${active ? colors.activeBorder : colors.inactiveBorder}`,
              color: active ? colors.activeColor : colors.inactiveColor,
              cursor: translating || active ? 'default' : 'pointer',
              opacity: translating && !active ? 0.4 : 1,
              transition: 'all 0.15s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
            aria-current={active ? 'true' : undefined}
          >
            {active && translating ? (
              <svg
                style={{ width: 10, height: 10, animation: 'spin 1s linear infinite' }}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                <circle
                  style={{ opacity: 0.25 }}
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  style={{ opacity: 0.75 }}
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <span style={{ fontSize: 12 }}>{LOCALE_FLAGS[loc] ?? ''}</span>
            )}
            {loc}
          </button>
        );
      })}
    </div>
  );
}
