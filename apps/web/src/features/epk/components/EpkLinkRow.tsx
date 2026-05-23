'use client';

// EpkLinkRow — link visibility row with brand-color dot + label + URL +
// toggle switch (or Pill when locked). Stacks inside the Media tab's
// "Visibilidad de links" Bento card.

import { useTranslations } from 'next-intl';

interface EpkLinkRowProps {
  label: string;
  url: string;
  visible: boolean;
  locked: boolean;
  /** Toggle is visually disabled because the plan limit has been reached */
  atLimit?: boolean;
  last?: boolean;
  onToggle: () => void;
}

// Match the prototype palette + cover common platforms by display name.
const BRAND_COLORS: Record<string, string> = {
  Spotify: '#1DB954',
  YouTube: '#FF0000',
  SoundCloud: '#ff8800',
  Website: '#9B30D0',
  Instagram: '#E1306C',
  TikTok: '#fe2c55',
  Apple: '#fc3c44',
  AppleMusic: '#fc3c44',
  Beatport: '#a4d922',
  Bandcamp: '#629aa9',
  Twitter: '#1DA1F2',
  X: '#000000',
  Amazon: '#FF9900',
  AmazonMusic: '#25D1DA',
  Deezer: '#A238FF',
  Tidal: '#000000',
  Traxsource: '#95C623',
};

function brandColor(label: string): string {
  for (const [key, color] of Object.entries(BRAND_COLORS)) {
    if (label.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return '#E040FB';
}

export function EpkLinkRow({
  label,
  url,
  visible,
  locked,
  atLimit,
  last,
  onToggle,
}: EpkLinkRowProps) {
  const t = useTranslations('dashboard.epk.editor');
  const color = brandColor(label);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 14,
        alignItems: 'center',
        padding: '14px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: last ? '1px solid rgba(255,255,255,0.06)' : 'none',
        opacity: visible ? 1 : 0.55,
      }}
    >
      {/* Color dot + label + URL */}
      <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: color,
            boxShadow: visible ? `0 0 8px ${color}88` : 'none',
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, color: 'white', fontWeight: 600 }}>{label}</div>
          <div
            style={{
              fontSize: 11.5,
              color: 'rgba(255,255,255,0.5)',
              marginTop: 2,
              fontFamily: '"Space Grotesk", monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {url}
          </div>
        </div>
      </div>

      {/* Toggle switch (or visibility pill when locked) */}
      {locked ? (
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.5,
            background: visible ? 'rgba(74,222,128,0.14)' : 'rgba(255,255,255,0.06)',
            color: visible ? '#4ADE80' : 'rgba(255,255,255,0.5)',
            border: `1px solid ${visible ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.1)'}`,
          }}
        >
          {visible ? `● ${t('linkRow.visible')}` : `○ ${t('linkRow.hidden')}`}
        </span>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          disabled={atLimit}
          aria-pressed={visible}
          style={{
            width: 38,
            height: 22,
            borderRadius: 999,
            background: visible
              ? 'linear-gradient(135deg,#E040FB 0%,#9B30D0 45%,#4A1A8C 100%)'
              : 'rgba(255,255,255,0.1)',
            border: 'none',
            cursor: atLimit ? 'not-allowed' : 'pointer',
            position: 'relative',
            padding: 0,
            opacity: atLimit ? 0.4 : 1,
            boxShadow: visible ? '0 0 12px rgba(224,64,251,0.4)' : 'none',
            transition: 'background 0.15s, opacity 0.15s',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: visible ? 18 : 2,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.15s ease',
            }}
          />
        </button>
      )}
    </div>
  );
}
