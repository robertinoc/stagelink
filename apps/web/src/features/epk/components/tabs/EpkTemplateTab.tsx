'use client';

// EpkTemplateTab — template picker for the EPK editor.
// Shows 3 templates (Studio, Cinematic, Press Bureau) with plan gates.
// Selecting a template triggers an immediate PATCH (no SaveBar).
// Press Bureau + Pro+ unlocks the BrandCustomizerDrawer.

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  EPK_TEMPLATE_MIN_PLAN,
  canAccessEpkTemplate,
  type EpkBrand,
  type EpkTemplateId,
  type PlanCode,
} from '@stagelink/types';
import { BrutalistThumb, CinematicThumb, StudioThumb } from '../EpkTemplateThumbs';
import { BrandCustomizerDrawer } from './BrandCustomizerDrawer';

// ── Template definitions ──────────────────────────────────────────────────────

interface TemplateDef {
  id: EpkTemplateId;
  nameKey: string;
  descKey: string;
  Thumb: React.ComponentType<{ primary?: string; bg?: string; ink?: string }>;
}

const TEMPLATES: TemplateDef[] = [
  { id: 'studio', nameKey: 'studioName', descKey: 'studioDesc', Thumb: StudioThumb },
  { id: 'cinematic', nameKey: 'cinematicName', descKey: 'cinematicDesc', Thumb: CinematicThumb },
  { id: 'brutalist', nameKey: 'brutalistName', descKey: 'brutalistDesc', Thumb: BrutalistThumb },
];

const PLAN_BADGE: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  pro_plus: 'Pro+',
};

// ── Component ─────────────────────────────────────────────────────────────────

interface EpkTemplateTabProps {
  userPlan: PlanCode;
  templateId: EpkTemplateId;
  brand: EpkBrand | null;
  isSaving: boolean;
  billingHref: string;
  onSelectTemplate: (id: EpkTemplateId) => void;
  onApplyBrand: (brand: EpkBrand) => void;
  onResetBrand: () => void;
}

export function EpkTemplateTab({
  userPlan,
  templateId,
  brand,
  isSaving,
  billingHref,
  onSelectTemplate,
  onApplyBrand,
  onResetBrand,
}: EpkTemplateTabProps) {
  const t = useTranslations('dashboard.epk.editor.templateTab');
  const [showBrandDrawer, setShowBrandDrawer] = useState(false);

  const isBrutalistSelected = templateId === 'brutalist';
  const hasBrandAccess = userPlan === 'pro_plus';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Section header */}
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)',
            marginBottom: 6,
          }}
        >
          {t('sectionLabel')}
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
          {t('sectionHint')}
        </div>
      </div>

      {/* Template cards grid */}
      <div style={{ position: 'relative' }}>
        {/* Loading overlay while applying template or brand */}
        {isSaving && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              background: 'rgba(0,0,0,0.45)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              backdropFilter: 'blur(2px)',
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                border: '2px solid rgba(224,64,251,0.3)',
                borderTopColor: '#E040FB',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {t('saving')}
            </span>
          </div>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 16,
          }}
        >
          {TEMPLATES.map((tpl) => {
            const accessible = canAccessEpkTemplate(userPlan, tpl.id);
            const selected = templateId === tpl.id;
            const minPlan = EPK_TEMPLATE_MIN_PLAN[tpl.id];

            return (
              <div key={tpl.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => accessible && !isSaving && onSelectTemplate(tpl.id)}
                  disabled={!accessible || isSaving}
                  style={{
                    position: 'relative',
                    background: 'transparent',
                    border: `2px solid ${selected ? '#E040FB' : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: 12,
                    overflow: 'hidden',
                    padding: 0,
                    cursor: !accessible ? 'not-allowed' : isSaving ? 'wait' : 'pointer',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxShadow: selected ? '0 0 0 3px rgba(224,64,251,0.25)' : 'none',
                    opacity: !accessible ? 0.55 : 1,
                    aspectRatio: '16/10',
                  }}
                  aria-pressed={selected}
                  aria-label={t(tpl.nameKey)}
                >
                  {/* Thumbnail */}
                  <tpl.Thumb
                    primary={tpl.id === 'brutalist' ? (brand?.primary ?? undefined) : undefined}
                    bg={tpl.id === 'brutalist' ? (brand?.bg ?? undefined) : undefined}
                    ink={tpl.id === 'brutalist' ? (brand?.ink ?? undefined) : undefined}
                  />

                  {/* Selected checkmark */}
                  {selected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg,#E040FB 0%,#9B30D0 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path
                          d="M1 4.5L4 7.5L10 1"
                          stroke="white"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Lock overlay for inaccessible templates */}
                  {!accessible && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(255,255,255,0.8)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: 'rgba(224,64,251,0.25)',
                          border: '1px solid rgba(224,64,251,0.45)',
                          color: '#E040FB',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {PLAN_BADGE[minPlan] ?? minPlan}
                      </span>
                    </div>
                  )}
                </button>

                {/* Card footer: name + plan badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingLeft: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: selected ? 'white' : 'rgba(255,255,255,0.65)',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {t(tpl.nameKey)}
                  </span>
                  {minPlan !== 'free' && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: accessible ? 'rgba(255,255,255,0.08)' : 'rgba(224,64,251,0.12)',
                        color: accessible ? 'rgba(255,255,255,0.5)' : '#E040FB',
                        border: `1px solid ${accessible ? 'rgba(255,255,255,0.12)' : 'rgba(224,64,251,0.3)'}`,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {PLAN_BADGE[minPlan] ?? minPlan}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.4)',
                    lineHeight: 1.4,
                    paddingLeft: 2,
                  }}
                >
                  {t(tpl.descKey)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade note for inaccessible templates */}
      {!canAccessEpkTemplate(userPlan, 'cinematic') && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: 'rgba(224,64,251,0.06)',
            border: '1px solid rgba(224,64,251,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{t('upgradeNote')}</span>
          <a
            href={billingHref}
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#E040FB',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {t('upgradeCta')} →
          </a>
        </div>
      )}

      {/* Brand customizer section — only visible when brutalist is selected + Pro+ */}
      {isBrutalistSelected && hasBrandAccess && (
        <div
          style={{
            padding: '16px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'white',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {t('brandSectionTitle')}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
              {brand
                ? t('brandSectionCustomActive', { name: brand.name ?? 'Custom' })
                : t('brandSectionDefaultActive')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Color dot preview */}
            {brand && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {([brand.primary, brand.secondary, brand.bg] as string[]).map((color, i) => (
                  <div
                    key={i}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: color,
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  />
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowBrandDrawer(true)}
              style={{
                background: 'rgba(224,64,251,0.15)',
                border: '1px solid rgba(224,64,251,0.35)',
                borderRadius: 8,
                color: '#E040FB',
                fontWeight: 700,
                fontSize: 12,
                padding: '8px 14px',
                cursor: 'pointer',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {t('brandCustomizeCta')}
            </button>
          </div>
        </div>
      )}

      {/* Spinner keyframes for the template loading overlay */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Brand drawer */}
      {showBrandDrawer && (
        <BrandCustomizerDrawer
          currentBrand={brand}
          onApply={(newBrand) => {
            onApplyBrand(newBrand);
            setShowBrandDrawer(false);
          }}
          onReset={() => {
            onResetBrand();
            setShowBrandDrawer(false);
          }}
          onClose={() => setShowBrandDrawer(false)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
