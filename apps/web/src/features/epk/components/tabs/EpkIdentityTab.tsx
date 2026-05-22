'use client';

// Tab 1 — Identity
// Hero images (cover + avatar) + bio (artist name, headline, short bio,
// full-bio link to Profile, press quote). Contacts will be added in Commit B.
// Highlights / availability / featured links live in Booking and Media tabs.

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

// ── Main component ─────────────────────────────────────────────────────────────

interface EpkIdentityTabProps {
  form: UseFormReturn<EpkFormValues>;
  disabled: boolean;
  artistId: string;
  locale: string;
  inherited: EpkInheritedArtistSnapshot;
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

          {/* Short bio */}
          <div>
            <FieldLabel required>{t('identity.shortBio')}</FieldLabel>
            <textarea
              rows={4}
              placeholder={inherited.bio ?? t('identity.shortBioPlaceholder')}
              disabled={disabled}
              style={TEXTAREA_STYLE}
              {...register('shortBio')}
            />
            <FieldError message={errors.shortBio?.message} />
          </div>

          {/* Full bio — link to profile */}
          <div>
            <FieldLabel>{t('identity.fullBio')}</FieldLabel>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(0,0,0,0.15)',
                border: '1px solid rgba(255,255,255,0.07)',
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.5,
              }}
            >
              {t.rich('identity.fullBioNote', {
                link: (chunks) => (
                  <a
                    href={`/${locale}/dashboard/profile`}
                    style={{
                      color: '#C084FC',
                      textDecoration: 'underline',
                      textUnderlineOffset: 3,
                    }}
                  >
                    {chunks}
                  </a>
                ),
              })}
            </div>
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
