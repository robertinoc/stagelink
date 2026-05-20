'use client';

// PublishBanner — sticky prominent publish status card shown above the EPK tab bar.
// Matches the design handoff prototype: 44×44 status icon square, title + PRO+ pill,
// descriptive subtitle that changes per state, "Copiar URL" + "Publish/Unpublish".

import { useState } from 'react';

interface PublishBannerProps {
  isPublished: boolean;
  publishBusy: 'publish' | 'unpublish' | null;
  publishReadiness: { ready: boolean; missing: string[] };
  sharePath: string;
  publicUrl: string;
  onToggle: () => void;
}

export function PublishBanner({
  isPublished,
  publishBusy,
  publishReadiness,
  sharePath,
  publicUrl,
  onToggle,
}: PublishBannerProps) {
  const [copied, setCopied] = useState(false);
  void sharePath;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`https://${publicUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — silently fail
    }
  }

  const accent = isPublished
    ? { color: '#4ADE80', rgb: '74,222,128', icon: '✓' }
    : { color: '#FBBF24', rgb: '251,191,36', icon: '✎' };

  return (
    <div
      style={{
        padding: '18px 24px',
        borderRadius: 16,
        background: isPublished
          ? 'linear-gradient(135deg, rgba(74,222,128,0.10) 0%, rgba(0,212,255,0.04) 100%)'
          : 'linear-gradient(135deg, rgba(251,191,36,0.10) 0%, rgba(224,64,251,0.04) 100%)',
        border: `1px solid rgba(${accent.rgb},0.3)`,
        boxShadow: `0 0 36px rgba(${accent.rgb},0.10)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      {/* Left — icon + title + subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 280 }}>
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `rgba(${accent.rgb},0.18)`,
            color: accent.color,
            border: `1px solid rgba(${accent.rgb},0.35)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
            boxShadow: `0 0 16px rgba(${accent.rgb},0.3)`,
          }}
        >
          {accent.icon}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 17,
                fontWeight: 700,
                color: 'white',
                letterSpacing: '-0.01em',
              }}
            >
              {isPublished ? 'Press Kit publicado' : 'En borrador'}
            </span>
            <span
              style={{
                padding: '3px 9px',
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.5,
                background: 'rgba(224,64,251,0.15)',
                color: '#E040FB',
                border: '1px solid rgba(224,64,251,0.3)',
              }}
            >
              PRO+
            </span>
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: 'rgba(255,255,255,0.7)',
              marginTop: 3,
              lineHeight: 1.45,
            }}
          >
            {isPublished ? (
              <>
                Cambios futuros quedan privados hasta que vuelvas a publicar. Tu URL pública:{' '}
                <span
                  style={{
                    color: 'white',
                    fontFamily: '"Space Grotesk", monospace',
                    fontWeight: 600,
                  }}
                >
                  {publicUrl}
                </span>
              </>
            ) : !publishReadiness.ready ? (
              <>
                Completá los campos requeridos antes de publicar:{' '}
                <span style={{ color: 'white', fontWeight: 600 }}>
                  {publishReadiness.missing.join(', ')}
                </span>
              </>
            ) : (
              'Los cambios se guardan en draft. La página pública sigue mostrando la última versión publicada.'
            )}
          </div>
        </div>
      </div>

      {/* Right — actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {isPublished && (
          <button
            type="button"
            onClick={handleCopy}
            style={{
              padding: '9px 14px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)',
              fontFamily: 'var(--font-body)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
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
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {copied ? '¡Copiado!' : 'Copiar URL'}
          </button>
        )}
        <button
          type="button"
          onClick={onToggle}
          disabled={publishBusy !== null || (!isPublished && !publishReadiness.ready)}
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            background: isPublished
              ? 'rgba(255,107,107,0.12)'
              : !publishReadiness.ready
                ? 'rgba(255,255,255,0.06)'
                : 'linear-gradient(135deg,#E040FB_0%,#9B30D0_45%,#4A1A8C_100%)',
            color: isPublished
              ? '#ff6b6b'
              : !publishReadiness.ready
                ? 'rgba(255,255,255,0.4)'
                : 'white',
            border: isPublished ? '1px solid rgba(255,107,107,0.3)' : 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 600,
            cursor:
              publishBusy !== null || (!isPublished && !publishReadiness.ready)
                ? 'not-allowed'
                : 'pointer',
            boxShadow:
              isPublished || !publishReadiness.ready ? 'none' : '0 0 18px rgba(224,64,251,0.35)',
            opacity: publishBusy !== null ? 0.6 : 1,
          }}
        >
          {publishBusy === 'publish'
            ? 'Publicando…'
            : publishBusy === 'unpublish'
              ? 'Despublicando…'
              : isPublished
                ? 'Unpublish y editar'
                : '✓ Publicar Press Kit'}
        </button>
      </div>
    </div>
  );
}
