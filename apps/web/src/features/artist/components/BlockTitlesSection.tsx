'use client';

/**
 * BlockTitlesSection — shown inside the SEO & Languages tab.
 *
 * Lists all published blocks for the artist's page and lets them provide
 * translated titles for the other locale. Includes a one-click auto-translate
 * button that calls the existing /api/localization/translate endpoint.
 *
 * Saves each modified title via PATCH /api/blocks/:blockId with
 * `localizedContent: { title: { [locale]: value } }`.
 */

import { useState, useEffect } from 'react';
import { Loader2, Languages, Check } from 'lucide-react';
import { getBlocks, updateBlock } from '@/lib/api/blocks';
import { autoTranslateLocalizedFields } from '@/lib/api/localization';
import type { Block } from '@stagelink/types';
import { Bento } from '@/components/sl/Bento';
import { SubHead } from './SubHead';

type SupportedLocale = 'en' | 'es';

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  es: 'Español',
};

const BLOCK_TYPE_ICONS: Record<string, string> = {
  links: '🔗',
  email_capture: '✉️',
  text: '📝',
  music_embed: '🎵',
  video_embed: '▶️',
  shopify_store: '🛍️',
  smart_merch: '🎁',
  technical_rider: '🎚️',
  contact_form: '📨',
  releases: '💿',
  record_labels: '🏷️',
  image_gallery: '🖼️',
  public_counters: '📊',
};

interface BlockTitlesSectionProps {
  pageId: string;
  baseLocale: SupportedLocale;
  otherLocale: SupportedLocale;
  disabled?: boolean;
}

export function BlockTitlesSection({
  pageId,
  baseLocale,
  otherLocale,
  disabled = false,
}: BlockTitlesSectionProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  // Map of blockId → translated title being edited
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getBlocks(pageId)
      .then((data) => {
        if (cancelled) return;
        // Only show blocks that have a title (translatable)
        const titled = data.filter((b) => b.isPublished && b.title);
        setBlocks(titled);
        // Pre-populate with any existing localized titles
        const initial: Record<string, string> = {};
        for (const b of titled) {
          const existing = (b.localizedContent?.title as Record<string, string> | undefined)?.[
            otherLocale
          ];
          initial[b.id] = existing ?? '';
        }
        setTitles(initial);
      })
      .catch(() => {
        // Silent — section will stay empty but won't break the page
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pageId, otherLocale]);

  async function handleAutoTranslate() {
    if (blocks.length === 0) return;
    setTranslating(true);
    setTranslateError(null);
    try {
      const values: Record<string, string> = {};
      for (const b of blocks) {
        if (b.title) values[b.id] = b.title;
      }
      const result = await autoTranslateLocalizedFields({
        sourceLocale: baseLocale,
        targetLocale: otherLocale,
        values,
      });
      setTitles((prev) => ({ ...prev, ...result }));
    } catch (err) {
      setTranslateError(err instanceof Error ? err.message : 'Auto-translation failed.');
    } finally {
      setTranslating(false);
    }
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const updates = blocks
        .filter((b) => {
          const newTitle = titles[b.id] ?? '';
          const existingTitle = (b.localizedContent?.title as Record<string, string> | undefined)?.[
            otherLocale
          ];
          // Only save blocks where the value changed
          return newTitle !== (existingTitle ?? '');
        })
        .map((b) =>
          updateBlock(b.id, {
            localizedContent: {
              ...(b.localizedContent ?? {}),
              title: {
                ...((b.localizedContent?.title as Record<string, string> | undefined) ?? {}),
                [otherLocale]: titles[b.id]?.trim() ?? '',
              },
            },
          }),
        );
      await Promise.all(updates);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  const otherLocaleLabel = LOCALE_LABELS[otherLocale];

  if (loading) {
    return (
      <Bento pad={22}>
        <SubHead title="Títulos de bloques" hint={`Traducciones en ${otherLocaleLabel}`} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, opacity: 0.5 }}>
          <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Cargando bloques…</span>
        </div>
      </Bento>
    );
  }

  if (blocks.length === 0) {
    return null; // No translatable blocks — hide the section entirely
  }

  const hasChanges = blocks.some((b) => {
    const newTitle = titles[b.id] ?? '';
    const existingTitle = (b.localizedContent?.title as Record<string, string> | undefined)?.[
      otherLocale
    ];
    return newTitle !== (existingTitle ?? '');
  });

  return (
    <Bento pad={22}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <SubHead
          title="Títulos de bloques"
          hint={`Versión en ${otherLocaleLabel} de los títulos de tus bloques publicados`}
        />
        <button
          type="button"
          onClick={() => void handleAutoTranslate()}
          disabled={disabled || translating}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            cursor: disabled || translating ? 'not-allowed' : 'pointer',
            opacity: disabled || translating ? 0.5 : 1,
            background: 'rgba(224,64,251,0.10)',
            border: '1px solid rgba(224,64,251,0.25)',
            color: '#E040FB',
            whiteSpace: 'nowrap',
          }}
        >
          <Languages style={{ width: 13, height: 13 }} />
          {translating ? 'Traduciendo…' : '✨ Auto-traducir todos'}
        </button>
      </div>

      {translateError && (
        <p style={{ fontSize: 12, color: 'rgba(239,68,68,0.9)', marginBottom: 12 }}>
          {translateError}
        </p>
      )}

      {/* Block rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {blocks.map((b) => {
          const icon = BLOCK_TYPE_ICONS[b.type] ?? '📦';
          const value = titles[b.id] ?? '';
          return (
            <div
              key={b.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                alignItems: 'center',
              }}
            >
              {/* Base title (read-only) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.65)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {b.title}
                </span>
              </div>

              {/* Translated title input */}
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  setTitles((prev) => ({ ...prev, [b.id]: e.target.value }));
                  setSaveStatus('idle');
                }}
                disabled={disabled}
                placeholder={`Título en ${otherLocaleLabel}…`}
                style={{
                  padding: '9px 12px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 13,
                  outline: 'none',
                  width: '100%',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Save row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={disabled || saving || !hasChanges}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 18px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
            cursor: disabled || saving || !hasChanges ? 'not-allowed' : 'pointer',
            opacity: !hasChanges ? 0.4 : 1,
            background: hasChanges ? 'rgba(224,64,251,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${hasChanges ? 'rgba(224,64,251,0.35)' : 'rgba(255,255,255,0.08)'}`,
            color: hasChanges ? '#E040FB' : 'rgba(255,255,255,0.4)',
          }}
        >
          {saving ? (
            <>
              <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
              Guardando…
            </>
          ) : (
            'Guardar títulos'
          )}
        </button>

        {saveStatus === 'saved' && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              color: '#4ADE80',
            }}
          >
            <Check style={{ width: 13, height: 13 }} />
            Guardado
          </span>
        )}
        {saveStatus === 'error' && (
          <span style={{ fontSize: 12, color: 'rgba(239,68,68,0.9)' }}>
            Error al guardar. Intentá de nuevo.
          </span>
        )}
      </div>
    </Bento>
  );
}
