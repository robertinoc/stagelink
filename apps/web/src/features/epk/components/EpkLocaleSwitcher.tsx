'use client';

// EpkLocaleSwitcher — compact language toggle for the public EPK page.
// Renders EN / ES chips; clicking navigates to the same page in the other locale.
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
}

export function EpkLocaleSwitcher({
  currentLocale,
  username,
  theme = 'dark',
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

  function handleSwitch(newLocale: string) {
    if (newLocale === currentLocale) return;
    // Full reload — the public EPK is server-rendered
    window.location.assign(`/${newLocale}/${username}/epk`);
  }

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {SUPPORTED_LOCALES.map((loc) => {
        const active = loc === currentLocale;
        return (
          <button
            key={loc}
            type="button"
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
              cursor: active ? 'default' : 'pointer',
              transition: 'all 0.15s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
            aria-current={active ? 'true' : undefined}
          >
            <span style={{ fontSize: 12 }}>{LOCALE_FLAGS[loc] ?? ''}</span>
            {loc}
          </button>
        );
      })}
    </div>
  );
}
