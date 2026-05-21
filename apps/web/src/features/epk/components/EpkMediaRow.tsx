'use client';

// EpkMediaRow — featured media row with brand-colored icon square + provider
// label + URL + Quitar button. Stacks inside the Media tab's Featured media
// Bento card.

import type { EpkFeaturedMediaItem } from '@stagelink/types';

interface EpkMediaRowProps {
  media: EpkFeaturedMediaItem;
  locked: boolean;
  last?: boolean;
  onRemove: () => void;
}

const BRAND: Record<
  EpkFeaturedMediaItem['provider'],
  { color: string; emoji: string; label: string }
> = {
  spotify: { color: '#1DB954', emoji: '🎵', label: 'Spotify' },
  youtube: { color: '#FF0000', emoji: '▶︎', label: 'YouTube' },
  soundcloud: { color: '#ff8800', emoji: '☁️', label: 'SoundCloud' },
  other: { color: '#E040FB', emoji: '🔗', label: 'Other' },
};

export function EpkMediaRow({ media, locked, last, onRemove }: EpkMediaRowProps) {
  const brand = BRAND[media.provider];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: 14,
        alignItems: 'center',
        padding: '14px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: last ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}
    >
      {/* Brand-color icon square */}
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${brand.color}18`,
          border: `1px solid ${brand.color}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          color: brand.color,
          flexShrink: 0,
        }}
      >
        {brand.emoji}
      </span>

      {/* Title + provider tag + URL */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, color: 'white', fontWeight: 600 }}>{media.title}</span>
          <span
            style={{
              padding: '2px 7px',
              borderRadius: 5,
              background: `${brand.color}15`,
              color: brand.color,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              fontFamily: 'var(--font-heading)',
            }}
          >
            {brand.label}
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.5)',
            marginTop: 3,
            fontFamily: '"Space Grotesk", monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {media.url}
        </div>
      </div>

      {/* Remove button */}
      {!locked && (
        <button
          type="button"
          onClick={onRemove}
          style={{
            padding: '7px 12px',
            borderRadius: 8,
            background: 'transparent',
            color: '#ff6b6b',
            border: '1px solid rgba(255,107,107,0.25)',
            fontFamily: 'var(--font-body)',
            fontSize: 11.5,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Quitar
        </button>
      )}
    </div>
  );
}
