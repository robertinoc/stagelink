'use client';

// EpkImagesHero — combined hero card with full-width cover band + overlapping
// avatar circle. Mirrors the My Profile identity card so the EPK doesn't waste
// vertical space. Replaces the two side-by-side image slot cards.
//
// Layout:
//   ┌──────────────────────────────────────────┐
//   │  [HERO·1500×500]      [profile][upload] │  ← Cover band (180px)
//   │  ░░░ gradient or cover img ░░░          │
//   │                       JPEG · PNG · 8MB  │
//   ├──────────────────────────────────────────┤
//   │  ○ (avatar)   IMAGES OF EPK     [profile]│  ← Avatar row
//   │  ──camera──   Hero + Artist image       │     (avatar overlaps cover -56px)
//   │               Por defecto se usan...    │
//   └──────────────────────────────────────────┘

import { EpkImageUploader } from './EpkImageUploader';
import { BentoLabel } from '@/components/sl/Bento';

interface EpkImagesHeroProps {
  artistId: string;
  disabled: boolean;
  /** Inherited cover URL from profile (for "Usar cover del Perfil" button) */
  inheritedCoverUrl: string | null;
  /** Inherited avatar URL from profile (for "Usar avatar del Perfil" button) */
  inheritedAvatarUrl: string | null;
  /** Currently displayed cover image URL (custom or inherited) */
  displayedCoverImage: string;
  /** Currently displayed artist image URL (custom or inherited) */
  displayedArtistImage: string;
  onSetCoverImage: (url: string) => void;
  onSetAvatarImage: (url: string) => void;
}

const COVER_GRADIENT =
  'radial-gradient(ellipse 60% 50% at 30% 50%, rgba(224,64,251,0.45) 0%, transparent 70%), ' +
  'radial-gradient(ellipse 60% 50% at 80% 60%, rgba(0,212,255,0.28) 0%, transparent 70%), ' +
  'linear-gradient(135deg, #2a0e4f 0%, #0a0612 100%)';

const PILL_BTN_STYLE: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 999,
  background: 'rgba(0,0,0,0.5)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.18)',
  fontFamily: 'var(--font-body)',
  fontSize: 11.5,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const SMALL_OUTLINE_STYLE: React.CSSProperties = {
  padding: '7px 12px',
  borderRadius: 10,
  background: 'transparent',
  color: '#E040FB',
  border: '1px solid rgba(224,64,251,0.3)',
  fontFamily: 'var(--font-body)',
  fontSize: 11.5,
  fontWeight: 600,
  cursor: 'pointer',
};

export function EpkImagesHero({
  artistId,
  disabled,
  inheritedCoverUrl,
  inheritedAvatarUrl,
  displayedCoverImage,
  displayedArtistImage,
  onSetCoverImage,
  onSetAvatarImage,
}: EpkImagesHeroProps) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.025)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* ── Cover band ────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          height: 180,
          borderRadius: '20px 20px 0 0',
          background: displayedCoverImage
            ? `linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 100%), url("${displayedCoverImage}")`
            : COVER_GRADIENT,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Hero spec badge (top-left) */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            padding: '5px 10px',
            borderRadius: 999,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            fontSize: 10,
            color: 'rgba(255,255,255,0.85)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}
        >
          Hero · 1500×500
        </div>

        {/* Action buttons (top-right) */}
        {!disabled && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            {inheritedCoverUrl && (
              <button
                type="button"
                onClick={() => onSetCoverImage(inheritedCoverUrl)}
                style={PILL_BTN_STYLE}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Usar cover del Perfil
              </button>
            )}
            <EpkImageUploader
              artistId={artistId}
              disabled={disabled}
              onUploaded={(asset) => {
                if (asset.deliveryUrl) onSetCoverImage(asset.deliveryUrl);
              }}
              renderTrigger={({ open, uploading, disabled: d }) => (
                <button type="button" onClick={open} disabled={d} style={PILL_BTN_STYLE}>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {uploading ? 'Subiendo…' : 'Subir nueva'}
                </button>
              )}
            />
          </div>
        )}

        {/* File spec (bottom-right) */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            right: 16,
            fontSize: 10.5,
            color: 'rgba(255,255,255,0.55)',
            fontFamily: 'var(--font-heading)',
            letterSpacing: 0.3,
          }}
        >
          JPEG · PNG · WebP · máx 8 MB
        </div>
      </div>

      {/* ── Avatar overlap row ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: 24,
          padding: '0 28px 22px',
          marginTop: -56,
          position: 'relative',
          alignItems: 'flex-end',
        }}
      >
        {/* Avatar circle (overlapping) */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: '50%',
              backgroundImage: displayedArtistImage
                ? `url("${displayedArtistImage}")`
                : 'linear-gradient(135deg, #2a0e4f 0%, #0a0612 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '4px solid #0D0A1A',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 12px 30px rgba(0,0,0,0.5)',
            }}
            aria-label="Artist avatar"
          />

          {/* Camera button overlay */}
          {!disabled && (
            <EpkImageUploader
              artistId={artistId}
              disabled={disabled}
              onUploaded={(asset) => {
                if (asset.deliveryUrl) onSetAvatarImage(asset.deliveryUrl);
              }}
              renderTrigger={({ open, uploading, disabled: d }) => (
                <button
                  type="button"
                  onClick={open}
                  disabled={d}
                  title="Cambiar artist image"
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#E040FB 0%,#9B30D0 45%,#4A1A8C 100%)',
                    color: 'white',
                    border: '3px solid #0D0A1A',
                    cursor: d ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    opacity: uploading ? 0.7 : 1,
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </button>
              )}
            />
          )}
        </div>

        {/* Right — title block */}
        <div style={{ paddingTop: 62, minWidth: 0 }}>
          <BentoLabel tint="#E040FB">Imágenes del EPK</BentoLabel>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 18,
              fontWeight: 700,
              color: 'white',
              marginTop: 4,
              letterSpacing: '-0.01em',
            }}
          >
            Hero + Artist image
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: 'rgba(255,255,255,0.5)',
              marginTop: 4,
              lineHeight: 1.5,
              maxWidth: 540,
            }}
          >
            Por defecto se usan las del Perfil. Subí versiones aparte si querés un cover o avatar
            distinto sólo para el EPK.
          </div>
        </div>

        {/* Far right — small avatar profile button */}
        {!disabled && inheritedAvatarUrl && (
          <div
            style={{
              paddingBottom: 4,
              paddingTop: 62,
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={() => onSetAvatarImage(inheritedAvatarUrl)}
              style={SMALL_OUTLINE_STYLE}
            >
              Usar avatar del Perfil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
