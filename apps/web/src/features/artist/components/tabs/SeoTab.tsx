'use client';

// Tab 4 — SEO & idiomas
// URL handle + SEO title/meta + SERP preview + localized content

import { useState } from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { useIsMobile } from '../../hooks/useIsMobile';
import { Bento } from '@/components/sl/Bento';
import { Icon } from '@/components/sl/Icon';
import { Btn } from '@/components/sl/Btn';
import { SeoInput } from '../SeoInput';
import { LangPill } from '../LangPill';
import { LocalizedField } from '../LocalizedField';
import { SubHead } from '../SubHead';
import { autoTranslateLocalizedFields } from '@/lib/api/localization';
import type { ProfileFormValues } from '../../schemas/profile.schema';
import { BlockTitlesSection } from '../BlockTitlesSection';

const TODAY = new Date().toLocaleDateString('es-AR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const SUPPORTED_LOCALES: { code: 'en' | 'es'; flag: string; name: string }[] = [
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
];

const LOCALIZED_FIELDS: {
  key: keyof {
    displayName: string;
    bio: string;
    fullBio: string;
    seoTitle: string;
    seoDescription: string;
  };
  label: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
}[] = [
  { key: 'displayName', label: 'Nombre artístico' },
  { key: 'bio', label: 'Bio corta', multiline: true, rows: 3, maxLength: 1000 },
  { key: 'fullBio', label: 'Bio completa', multiline: true, rows: 6, maxLength: 5000 },
  { key: 'seoTitle', label: 'Título de página' },
  { key: 'seoDescription', label: 'Meta descripción', multiline: true, rows: 2, maxLength: 160 },
];

interface SeoTabProps {
  form: UseFormReturn<ProfileFormValues>;
  handle: string; // artist.username
  /** Whether the artist's plan includes multi-language pages. When false, the localized-content section shows a locked/upsell state. */
  hasMultiLanguageAccess: boolean;
  /** Href to the billing/upgrade page. Used in the upsell CTA. */
  billingHref?: string;
  /** The artist's primary page ID — used to fetch and translate block titles. When undefined the BlockTitlesSection is hidden. */
  pageId?: string;
}

export function SeoTab({ form, handle, hasMultiLanguageAccess, billingHref, pageId }: SeoTabProps) {
  const { watch, setValue, register } = form;
  const isMobile = useIsMobile();
  const baseLocale = watch('baseLocale');
  const seoTitle = watch('seoTitle') ?? '';
  const seoDescription = watch('seoDescription') ?? '';
  const translations = watch('translations');

  // Active locale in the localized editor (not the base)
  const otherLocale = baseLocale === 'en' ? 'es' : 'en';
  const otherLocaleInfo = SUPPORTED_LOCALES.find((l) => l.code === otherLocale)!;
  const baseLocaleInfo = SUPPORTED_LOCALES.find((l) => l.code === baseLocale)!;

  // Translation state
  const [translating, setTranslating] = useState(false);
  const [translateConfirm, setTranslateConfirm] = useState(false);

  // Check if the other locale has any content
  const otherTrans = translations[otherLocale];
  const otherHasContent = Object.values(otherTrans).some((v) => v?.trim());
  const otherState: 'ready' | 'empty' = otherHasContent ? 'ready' : 'empty';

  async function handleAutoTranslate() {
    setTranslating(true);
    setTranslateConfirm(false);
    try {
      const sourceValues: Record<string, string> = {
        displayName: watch('displayName') ?? '',
        bio: watch('bio') ?? '',
        fullBio: watch('fullBio') ?? '',
        seoTitle: watch('seoTitle') ?? '',
        seoDescription: watch('seoDescription') ?? '',
      };
      const result = await autoTranslateLocalizedFields({
        sourceLocale: baseLocale,
        targetLocale: otherLocale,
        values: sourceValues,
      });
      setValue(
        `translations.${otherLocale}`,
        {
          displayName: result.displayName ?? '',
          bio: result.bio ?? '',
          fullBio: result.fullBio ?? '',
          seoTitle: result.seoTitle ?? '',
          seoDescription: result.seoDescription ?? '',
        } as never,
        { shouldDirty: true },
      );
    } catch {
      // In production: show toast
    } finally {
      setTranslating(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── URL handle ────────────────────────────────────────────────── */}
      <Bento pad={isMobile ? 16 : 22}>
        <SubHead
          title="Tu URL pública"
          hint="Cómo te encuentran. Cambiarla requiere verificación de identidad."
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {/* Prefix */}
          <div
            style={{
              padding: '14px 18px',
              background: 'rgba(0,0,0,0.2)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              fontFamily: 'var(--font-heading)',
              fontSize: 14,
              color: 'rgba(255,255,255,0.50)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            stagelink.art/
          </div>
          {/* Handle (read-only) */}
          <input
            type="text"
            value={handle}
            readOnly
            style={{
              flex: 1,
              padding: '14px 18px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-heading)',
              fontSize: 14,
              fontWeight: 600,
              color: 'white',
            }}
          />
          {/* Request change */}
          <button
            type="button"
            onClick={() => alert('Funcionalidad de cambio de handle — próximamente.')}
            style={
              {
                padding: '0 18px',
                background: 'transparent',
                border: 'none',
                borderLeft: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 600,
                color: '#E040FB',
                whiteSpace: 'nowrap',
              } as React.CSSProperties
            }
          >
            Solicitar cambio
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', marginTop: 8 }}>
          Tu nombre de usuario todavía no es editable — los cambios van a requerir verificación de
          identidad.
        </p>
      </Bento>

      {/* ── SEO title + meta ──────────────────────────────────────────── */}
      <Bento pad={isMobile ? 16 : 22}>
        <SeoInput
          label="Título de página · cómo aparece en Google"
          value={seoTitle}
          onChange={(v) => setValue('seoTitle', v, { shouldDirty: true })}
          max={60}
          recommended="50–60 caracteres"
          placeholder="Tu nombre artístico o eslogan principal"
        />

        <div style={{ marginTop: 22 }}>
          <SeoInput
            label="Meta descripción"
            value={seoDescription}
            onChange={(v) => setValue('seoDescription', v, { shouldDirty: true })}
            max={160}
            recommended="120–160 caracteres"
            multiline
            rows={3}
            placeholder="Una frase que resume quién sos y qué hacés como artista…"
          />
        </div>

        {/* SERP preview */}
        <div
          style={{
            marginTop: 22,
            padding: '20px 22px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px dashed rgba(255,255,255,0.14)',
          }}
        >
          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 999,
                background: 'rgba(74,144,255,0.12)',
                border: '1px solid rgba(74,144,255,0.25)',
                color: '#a5cfff',
                fontFamily: 'var(--font-heading)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            >
              G
            </span>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.50)',
                letterSpacing: '1px',
              }}
            >
              Así te ven en Google
            </span>
          </div>

          {/* Source row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon-192.png"
              alt="StageLink"
              width={22}
              height={22}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                flexShrink: 0,
                objectFit: 'cover',
              }}
            />
            <span style={{ fontSize: 12.5, color: '#bdc1c6' }}>StageLink</span>
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.30)' }}>·</span>
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.50)' }}>
              stagelink.art › {handle}
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 20,
              color: '#8ab4f8',
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
              textDecoration: 'underline',
              cursor: 'pointer',
              marginBottom: 4,
            }}
          >
            {seoTitle || <span style={{ opacity: 0.4 }}>(Tu título va acá)</span>}
          </div>

          {/* Description */}
          <div style={{ fontSize: 13.5, color: '#bdc1c6', lineHeight: 1.5 }}>
            <span style={{ color: 'rgba(255,255,255,0.50)', marginRight: 6 }}>{TODAY} —</span>
            {seoDescription || (
              <span style={{ opacity: 0.4 }}>Tu meta descripción aparece acá.</span>
            )}
          </div>
        </div>
      </Bento>

      {/* ── Localized content ─────────────────────────────────────────── */}
      <Bento pad={isMobile ? 16 : 22}>
        <SubHead
          title="Contenido localizado"
          hint="Tu Press Kit y página pueden mostrarse en varios idiomas. Si un idioma está incompleto, StageLink usa el contenido base como fallback."
        />

        {!hasMultiLanguageAccess && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '32px 16px',
              borderRadius: 12,
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.07)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 28, opacity: 0.5 }}>🔒</div>
            <p
              style={{
                margin: 0,
                fontSize: 13.5,
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.5,
              }}
            >
              El contenido localizado está disponible en el plan{' '}
              <strong style={{ color: 'white' }}>PRO</strong> o superior.
            </p>
            {billingHref && (
              <a
                href={billingHref}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 18px',
                  borderRadius: 999,
                  background: 'linear-gradient(135deg, rgba(224,64,251,0.8), rgba(168,85,247,0.8))',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'var(--font-heading)',
                  textDecoration: 'none',
                  transition: 'opacity 0.15s ease',
                }}
              >
                Actualizar plan
              </a>
            )}
          </div>
        )}

        {hasMultiLanguageAccess && (
          <>
            {/* Base language block */}
            <div
              style={{
                borderRadius: 12,
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '14px 16px',
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.50)',
                  marginBottom: 8,
                }}
              >
                Idioma base del contenido
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <LangPill
                  flag={baseLocaleInfo.flag}
                  name={baseLocaleInfo.name}
                  state="base"
                  active
                />
                <LangPill
                  flag={otherLocaleInfo.flag}
                  name={otherLocaleInfo.name}
                  state={otherState}
                />
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', marginTop: 10 }}>
                Si otro idioma está incompleto, StageLink va a usar este contenido como fallback.
              </p>
            </div>

            {/* Auto-translate banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                borderRadius: 12,
                background: 'rgba(224,64,251,0.08)',
                border: '1px solid rgba(224,64,251,0.25)',
                marginBottom: 22,
                flexWrap: 'wrap',
              }}
            >
              <Icon.Sparkle size={20} />
              <p
                style={{
                  flex: 1,
                  minWidth: 200,
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.70)',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Completá estos campos con una traducción automática desde{' '}
                <strong style={{ color: 'white' }}>
                  {baseLocaleInfo.name} → {otherLocaleInfo.name}
                </strong>
                . Después podés editar todo antes de guardar.
              </p>
              {otherHasContent && !translateConfirm ? (
                <Btn variant="outline" size="sm" onClick={() => setTranslateConfirm(true)}>
                  Traducir automáticamente
                </Btn>
              ) : translateConfirm ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn variant="bare" size="sm" onClick={() => setTranslateConfirm(false)}>
                    Cancelar
                  </Btn>
                  <Btn
                    variant="primary"
                    size="sm"
                    onClick={handleAutoTranslate}
                    disabled={translating}
                  >
                    {translating ? 'Traduciendo…' : 'Sobreescribir y traducir'}
                  </Btn>
                </div>
              ) : (
                <Btn
                  variant="outline"
                  size="sm"
                  onClick={handleAutoTranslate}
                  disabled={translating}
                >
                  {translating ? 'Traduciendo…' : 'Traducir automáticamente'}
                </Btn>
              )}
            </div>

            {/* Localized fields */}
            <div>
              {LOCALIZED_FIELDS.map((field, idx) => {
                const val = (otherTrans as Record<string, string | undefined>)[field.key] ?? '';
                return (
                  <div
                    key={field.key}
                    style={{
                      borderTop: idx === 0 ? '1px solid rgba(255,255,255,0.06)' : undefined,
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <LocalizedField
                      label={field.label}
                      locale={otherLocale.toUpperCase()}
                      value={val}
                      onChange={(v) =>
                        setValue(`translations.${otherLocale}.${field.key}` as never, v as never, {
                          shouldDirty: true,
                        })
                      }
                      multiline={field.multiline}
                      rows={field.rows}
                      maxLength={field.maxLength}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Bento>

      {/* ── Block titles translation ──────────────────────────────────── */}
      {hasMultiLanguageAccess && pageId && (
        <BlockTitlesSection pageId={pageId} baseLocale={baseLocale} otherLocale={otherLocale} />
      )}
    </div>
  );
}
