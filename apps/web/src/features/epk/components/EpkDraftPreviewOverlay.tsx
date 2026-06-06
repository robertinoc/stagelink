'use client';

// EpkDraftPreviewOverlay — full-screen preview of the current draft EPK state.
// Renders PublicEpkView with form values so the artist can see how the EPK
// will look before publishing, without saving or making any API calls.

import { useEffect } from 'react';
import type { PublicEpkResponse, SupportedLocale } from '@stagelink/types';
import { PublicEpkView } from './PublicEpkView';

interface EpkDraftPreviewOverlayProps {
  epk: PublicEpkResponse;
  locale: SupportedLocale;
  onClose: () => void;
}

export function EpkDraftPreviewOverlay({ epk, locale, onClose }: EpkDraftPreviewOverlayProps) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0714',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          flexShrink: 0,
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(13,10,26,0.98)',
          backdropFilter: 'blur(12px)',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: 'rgba(251,191,36,0.15)',
              color: '#FBBF24',
              border: '1px solid rgba(251,191,36,0.3)',
            }}
          >
            Draft preview
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            This is how your EPK will look when published
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            lineHeight: 1,
          }}
          aria-label="Close preview"
        >
          ✕
        </button>
      </div>

      {/* Scrollable EPK content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <PublicEpkView epk={epk} locale={locale} />
      </div>
    </div>
  );
}
