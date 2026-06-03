'use client';

// Tab 1 — Identity
// Hero images (cover + avatar) + bio selector (short or full, from artist
// profile) + headline + press quote + contacts.

import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import type { EpkInheritedArtistSnapshot } from '@stagelink/types';
import { Bento } from '@/components/sl/Bento';
import { EpkBioGenerator } from '../EpkBioGenerator';
import { EpkImagesHero } from '../EpkImagesHero';
import { SubHead } from '@/features/artist/components/SubHead';
import { useIsMobile } from '@/features/artist/hooks/useIsMobile';
import type { EpkFormValues } from '../../schemas/epk.schema';
import type { EpkGenerateBioResponse } from '@stagelink/types';

// ── Field helpers ──────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label
      style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 6,
        fontFamily: 'var(--font-heading)',
      }}
    >
      {children}
      {required && <span style={{ color: '#E040FB', marginLeft: 3 }}>*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p style={{ fontSize: 11, color: '#ff6b6b', marginTop: 4 }}>{message}</p>;
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  color: 'white',
  fontSize: 13.5,
  fontFamily: 'var(--font-body)',
  outline: 'none',
  boxSizing: 'border-box',
};

const TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  resize: 'vertical',
  lineHeight: 1.6,
};

// ── Bio picker ────────────────────────────────────────────────────────────────

function BioPicker({
  label,
  content,
  checked,
  onToggle,
  disabled,
}: {
  label: string;
  content: string | null;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  disabled: boolean;
}) {
  const available = !!content;
  return (
    <div style={{ marginBottom: 10 }}>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: available && !disabled ? 'pointer' : 'default',
          marginBottom: 6,
          userSelect: 'none',
        }}
      >
        <input
          type="checkbox"
          checked={checked && available}
          disabled={disabled || !available}
          onChange={(e) => onToggle(e.target.checked)}
          style={{ accentColor: '#E040FB', width: 15, height: 15, flexShrink: 0 }}
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: available ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {label}
        </span>
        {!available && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>
            — No disponible en tu perfil
          </span>
        )}
      </label>
      {available && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: checked ? 'rgba(224,64,251,0.07)' : 'rgba(0,0,0,0.12)',
            border: `1px solid ${checked ? 'rgba(224,64,251,0.3)' : 'rgba(255,255,255,0.07)'}`,
            fontSize: 12.5,
            color: checked ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.3)',
            lineHeight: 1.6,
            maxHeight: 110,
            overflowY: 'auto',
            transition: 'all 0.15s ease',
            whiteSpace: 'pre-wrap',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface EpkIdentityTabProps {
  form: UseFormReturn<EpkFormValues>;
  disabled: boolean;
  artistId: string;
  locale: string;
  inherited: EpkInheritedArtistSnapshot;
  /** Raw DB value of epk.shortBio — null if never set. Used to init checkbox state. */
  initialShortBio: string | null;
  /** Raw DB value of epk.fullBio — null if never set. Used to init checkbox state. */
  initialFullBio: string | null;
  displayedCoverImage: string;
  displayedArtistImage: string;
  onSetCoverImage: (url: string) => void;
  onSetAvatarImage: (url: string) => void;
}

export function EpkIdentityTab({
  form,
  disabled,
  artistId,
  locale,
  inherited,
  initialShortBio,
  initialFullBio,
  displayedCoverImage,
  displayedArtistImage,
  onSetCoverImage,
  onSetAvatarImage,
}: EpkIdentityTabProps) {
  const t = useTranslations('dashboard.epk.editor');
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const isMobile = useIsMobile();
  const watchedHighlights = watch('highlights');

  // Bio selector state — tracks which bios the artist wants in their EPK.
  // Initialized from whether the DB already had a saved value for each field.
  const [useShortBio, setUseShortBio] = useState(() => !!initialShortBio);
  const [useFullBio, setUseFullBio] = useState(() => !!initialFullBio);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Images hero (cover band + overlapping avatar) ── */}
      <EpkImagesHero
        artistId={artistId}
        disabled={disabled}
        inheritedCoverUrl={inherited.coverUrl}
        inheritedAvatarUrl={inherited.avatarUrl}
        displayedCoverImage={displayedCoverImage}
        displayedArtistImage={displayedArtistImage}
        onSetCoverImage={onSetCoverImage}
        onSetAvatarImage={onSetAvatarImage}
      />

      {/* ── Contacts ── */}
      <Bento pad={isMobile ? 16 : 20}>
        <SubHead title={t('identity.contactsTitle')} hint={t('identity.contactsHint')} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 14,
          }}
        >
          <div>
            <FieldLabel required>{t('identity.bookingEmail')}</FieldLabel>
            <input
              type="email"
              placeholder={inherited.contactEmail ?? 'booking@artist.com'}
              disabled={disabled}
              style={INPUT_STYLE}
              {...register('bookingEmail')}
            />
            <FieldError message={errors.bookingEmail?.message} />
          </div>
          <div>
            <FieldLabel>{t('identity.managementContact')}</FieldLabel>
            <input
              type="text"
              placeholder={t('identity.contactPlaceholder')}
              disabled={disabled}
              style={INPUT_STYLE}
              {...register('managementContact')}
            />
          </div>
          <div>
            <FieldLabel>{t('identity.pressContact')}</FieldLabel>
            <input
              type="text"
              placeholder={t('identity.contactPlaceholder')}
              disabled={disabled}
              style={INPUT_STYLE}
              {...register('pressContact')}
            />
          </div>
          <div>
            <FieldLabel>{t('identity.location')}</FieldLabel>
            <input
              type="text"
              placeholder={t('identity.locationPlaceholder')}
              disabled={disabled}
              style={INPUT_STYLE}
              {...register('location')}
            />
          </div>
        </div>
      </Bento>

      {/* ── Bio ── */}
      <Bento pad={isMobile ? 16 : 20}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <SubHead title={t('identity.bioTitle')} hint={t('identity.bioHint')} />
          </div>
          {!disabled && (
            <EpkBioGenerator
              artistId={artistId}
              existingHighlights={watchedHighlights.filter(Boolean)}
              onApply={(generated: EpkGenerateBioResponse) => {
                setValue('headline', generated.headline, { shouldDirty: true });
                setValue('shortBio', generated.shortBio, { shouldDirty: true });
                setValue('fullBio', generated.fullBio, { shouldDirty: true });
                setValue('pressQuote', generated.pressQuote, { shouldDirty: true });
                // Auto-check boxes when AI generates both bios
                if (generated.shortBio) setUseShortBio(true);
                if (generated.fullBio) setUseFullBio(true);
              }}
            />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Artist name — read-only */}
          <div>
            <FieldLabel>{t('identity.artistName')}</FieldLabel>
            <input
              type="text"
              value={inherited.displayName}
              disabled
              style={{ ...INPUT_STYLE, opacity: 0.5, cursor: 'not-allowed' }}
            />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
              {t('identity.artistNameNote')}
            </p>
          </div>

          {/* Headline */}
          <div>
            <FieldLabel required>{t('identity.headline')}</FieldLabel>
            <input
              type="text"
              placeholder={t('identity.headlinePlaceholder')}
              disabled={disabled}
              style={INPUT_STYLE}
              {...register('headline')}
            />
            <FieldError message={errors.headline?.message} />
          </div>

          {/* Bio selector — from artist profile */}
          <div>
            <div style={{ marginBottom: 10 }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: 4,
                  fontFamily: 'var(--font-heading)',
                }}
              >
                Bio <span style={{ color: '#E040FB' }}>*</span>
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.4)',
                    marginLeft: 6,
                  }}
                >
                  Elegí al menos una. Se sincroniza desde tu{' '}
                  <a
                    href={`/${locale}/dashboard/profile`}
                    style={{
                      color: '#C084FC',
                      textDecoration: 'underline',
                      textUnderlineOffset: 3,
                    }}
                  >
                    Perfil
                  </a>
                  .
                </span>
              </p>
            </div>

            <BioPicker
              label="Bio corta"
              content={inherited.bio}
              checked={useShortBio}
              disabled={disabled}
              onToggle={(checked) => {
                setUseShortBio(checked);
                setValue('shortBio', checked ? (inherited.bio ?? '') : '', { shouldDirty: true });
              }}
            />

            <BioPicker
              label="Bio completa"
              content={inherited.fullBio ?? null}
              checked={useFullBio}
              disabled={disabled}
              onToggle={(checked) => {
                setUseFullBio(checked);
                setValue('fullBio', checked ? (inherited.fullBio ?? '') : '', {
                  shouldDirty: true,
                });
              }}
            />

            {!useShortBio && !useFullBio && (
              <p style={{ fontSize: 11, color: '#FBBF24', marginTop: 4 }}>
                Seleccioná al menos una bio para poder publicar tu press kit.
              </p>
            )}
          </div>

          {/* Press quote */}
          <div>
            <FieldLabel>{t('identity.pressQuote')}</FieldLabel>
            <textarea
              rows={3}
              placeholder={t('identity.pressQuotePlaceholder')}
              disabled={disabled}
              style={TEXTAREA_STYLE}
              {...register('pressQuote')}
            />
          </div>
        </div>
      </Bento>
    </div>
  );
}
