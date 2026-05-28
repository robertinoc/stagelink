'use client';

// BrandCustomizerDrawer — Color palette editor for the Press Bureau (brutalist) template.
// Appears as a slide-in panel over the template tab when the user clicks "Customize palette".
// Only available for Pro+ artists on the brutalist template.

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { EpkBrand } from '@stagelink/types';
import { BrutalistThumb } from '../EpkTemplateThumbs';

// ── Presets ───────────────────────────────────────────────────────────────────

interface Preset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  bg: string;
  ink: string;
}

const PRESETS: Preset[] = [
  {
    id: 'default',
    name: 'Default',
    primary: '#E040FB',
    secondary: '#9B30D0',
    bg: '#0D0018',
    ink: '#FFFFFF',
  },
  {
    id: 'blood',
    name: 'Blood',
    primary: '#E53935',
    secondary: '#B71C1C',
    bg: '#0D0000',
    ink: '#FFFFFF',
  },
  {
    id: 'neon',
    name: 'Neon',
    primary: '#39FF14',
    secondary: '#00E5FF',
    bg: '#000000',
    ink: '#FFFFFF',
  },
  {
    id: 'glacial',
    name: 'Glacial',
    primary: '#00B0FF',
    secondary: '#FFFFFF',
    bg: '#0A1929',
    ink: '#FFFFFF',
  },
  {
    id: 'inverted',
    name: 'Inverted',
    primary: '#1A1A1A',
    secondary: '#444444',
    bg: '#F5F5F5',
    ink: '#000000',
  },
  {
    id: 'rust',
    name: 'Rust',
    primary: '#FF6F00',
    secondary: '#E65100',
    bg: '#1A0A00',
    ink: '#FFF8E1',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface BrandCustomizerDrawerProps {
  currentBrand: EpkBrand | null;
  onApply: (brand: EpkBrand) => void;
  onReset: () => void;
  onClose: () => void;
  isSaving: boolean;
}

export function BrandCustomizerDrawer({
  currentBrand,
  onApply,
  onReset,
  onClose,
  isSaving,
}: BrandCustomizerDrawerProps) {
  const t = useTranslations('dashboard.epk.editor.templateTab');

  const [draft, setDraft] = useState<EpkBrand>(currentBrand ?? PRESETS[0]!);

  function applyPreset(preset: Preset) {
    setDraft({
      id: preset.id,
      name: preset.name,
      primary: preset.primary,
      secondary: preset.secondary,
      bg: preset.bg,
      ink: preset.ink,
    });
  }

  function updateColor(
    key: keyof Pick<EpkBrand, 'primary' | 'secondary' | 'bg' | 'ink'>,
    value: string,
  ) {
    setDraft((prev) => ({ ...prev, id: 'custom', name: 'Custom', [key]: value }));
  }

  const activePresetId = PRESETS.find((p) => p.id === draft.id)?.id ?? null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 0 env(safe-area-inset-bottom)',
      }}
    >
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 560,
          background: '#13111F',
          borderRadius: '20px 20px 0 0',
          padding: '8px 0 32px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
          <div
            style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            padding: '12px 24px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                color: 'white',
              }}
            >
              {t('brandTitle')}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {t('brandSubtitle')}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: 22,
              lineHeight: 1,
              padding: 4,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div style={{ padding: '0 24px 0' }}>
          {/* Live preview */}
          <div
            style={{
              marginBottom: 20,
              borderRadius: 10,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <BrutalistThumb primary={draft.primary} bg={draft.bg} ink={draft.ink} />
          </div>

          {/* Presets */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              {t('brandPresetsLabel')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  style={{
                    background: preset.bg,
                    border: `2px solid ${activePresetId === preset.id ? preset.primary : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: 8,
                    padding: '10px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4,
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', gap: 4 }}>
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        background: preset.primary,
                        border: '1px solid rgba(255,255,255,0.15)',
                      }}
                    />
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        background: preset.secondary,
                        border: '1px solid rgba(255,255,255,0.15)',
                      }}
                    />
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        background: preset.ink,
                        border: '1px solid rgba(255,255,255,0.15)',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: preset.ink, opacity: 0.7 }}>
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom color slots */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              {t('brandCustomLabel')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(
                [
                  { key: 'primary' as const, label: t('brandColorPrimary') },
                  { key: 'secondary' as const, label: t('brandColorSecondary') },
                  { key: 'bg' as const, label: t('brandColorBg') },
                  { key: 'ink' as const, label: t('brandColorInk') },
                ] as const
              ).map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 8,
                      padding: '6px 10px',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <input
                      type="color"
                      value={draft[key]}
                      onChange={(e) => updateColor(key, e.target.value)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        background: 'transparent',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.7)',
                        fontFamily: 'monospace',
                        flex: 1,
                      }}
                    >
                      {draft[key]}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => onApply(draft)}
              disabled={isSaving}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg,#E040FB 0%,#9B30D0 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '12px 0',
                fontWeight: 700,
                fontSize: 14,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.6 : 1,
                fontFamily: 'var(--font-heading)',
              }}
            >
              {isSaving ? t('brandApplying') : t('brandApply')}
            </button>
            {currentBrand && (
              <button
                type="button"
                onClick={onReset}
                disabled={isSaving}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  fontSize: 13,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                {t('brandReset')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
