'use client';

// Tab 1 — Identity
// Hero image, headline, short bio, press quote, career highlights, featured links,
// location, availability notes. EpkBioGenerator lives here too.

import type { UseFormReturn } from 'react-hook-form';
import type { EpkInheritedArtistSnapshot, EpkFeaturedLinkItem } from '@stagelink/types';
import { Bento } from '@/components/sl/Bento';
import { Btn } from '@/components/sl/Btn';
import { EpkBioGenerator } from '../EpkBioGenerator';
import { EpkImageUploader } from '../EpkImageUploader';
import { SubHead, Chip } from '@/features/artist/components/SubHead';
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

// ── Image slot ─────────────────────────────────────────────────────────────────

interface ImageSlotProps {
  label: string;
  hint: string;
  imageUrl: string;
  altText: string;
  artistId: string;
  disabled: boolean;
  profileBtnLabel?: string;
  onProfileBtn?: () => void;
  onUploaded: (url: string) => void;
}

function ImageSlot({
  label,
  hint,
  imageUrl,
  altText,
  artistId,
  disabled,
  profileBtnLabel,
  onProfileBtn,
  onUploaded,
}: ImageSlotProps) {
  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{label}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{hint}</div>
        </div>
        {profileBtnLabel && onProfileBtn && (
          <Btn size="sm" variant="ghost" type="button" disabled={disabled} onClick={onProfileBtn}>
            {profileBtnLabel}
          </Btn>
        )}
      </div>
      <EpkImageUploader
        artistId={artistId}
        disabled={disabled}
        helperText="JPEG, PNG or WebP · max 8 MB"
        onUploaded={(asset) => {
          if (asset.deliveryUrl) onUploaded(asset.deliveryUrl);
        }}
        renderTrigger={({ open, uploading, disabled: d }) => (
          <button
            type="button"
            onClick={open}
            disabled={d}
            style={{
              display: 'block',
              width: '100%',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
              cursor: d ? 'not-allowed' : 'pointer',
            }}
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={altText}
                style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div
                style={{
                  height: 160,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                No image yet — click to upload
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0')}
            >
              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  fontSize: 11,
                  color: 'white',
                  fontWeight: 600,
                }}
              >
                {uploading ? 'Uploading…' : 'Replace image'}
              </span>
            </div>
          </button>
        )}
      />
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
  profileAndSmartLinks: { label: string; url: string }[];
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
  profileAndSmartLinks,
  displayedCoverImage,
  displayedArtistImage,
  onSetCoverImage,
  onSetAvatarImage,
}: EpkIdentityTabProps) {
  void locale;
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const isMobile = useIsMobile();
  const watchedHighlights = watch('highlights');
  const watchedFeaturedLinks = watch('featuredLinks');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Images ── */}
      <Bento pad={isMobile ? 16 : 20}>
        <SubHead
          title="Photos"
          hint="Hero photo shown at the top of your EPK, plus your artist portrait"
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 12,
          }}
        >
          <ImageSlot
            label="Hero image"
            hint="Full-width cover at the top of your EPK"
            imageUrl={displayedCoverImage}
            altText="EPK hero"
            artistId={artistId}
            disabled={disabled}
            profileBtnLabel={inherited.coverUrl ? 'Use profile cover' : undefined}
            onProfileBtn={
              inherited.coverUrl ? () => onSetCoverImage(inherited.coverUrl!) : undefined
            }
            onUploaded={(url) => {
              onSetCoverImage(url);
            }}
          />
          <ImageSlot
            label="Artist image"
            hint="Your main artist photo"
            imageUrl={displayedArtistImage}
            altText="EPK artist"
            artistId={artistId}
            disabled={disabled}
            profileBtnLabel={inherited.avatarUrl ? 'Use profile avatar' : undefined}
            onProfileBtn={
              inherited.avatarUrl ? () => onSetAvatarImage(inherited.avatarUrl!) : undefined
            }
            onUploaded={onSetAvatarImage}
          />
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
            <SubHead
              title="Bio & headline"
              hint="The short bio and headline appear at the top of your EPK"
            />
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
            <FieldLabel>Artist name</FieldLabel>
            <input
              type="text"
              value={inherited.displayName}
              disabled
              style={{ ...INPUT_STYLE, opacity: 0.5, cursor: 'not-allowed' }}
            />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
              Managed in your artist profile.
            </p>
          </div>

          {/* Headline */}
          <div>
            <FieldLabel required>Headline</FieldLabel>
            <input
              type="text"
              placeholder="Genre, positioning, key context…"
              disabled={disabled}
              style={INPUT_STYLE}
              {...register('headline')}
            />
            <FieldError message={errors.headline?.message} />
          </div>

          {/* Short bio */}
          <div>
            <FieldLabel required>Short bio</FieldLabel>
            <textarea
              rows={4}
              placeholder={inherited.bio ?? 'Short artist summary'}
              disabled={disabled}
              style={TEXTAREA_STYLE}
              {...register('shortBio')}
            />
            <FieldError message={errors.shortBio?.message} />
          </div>

          {/* Full bio — link to profile */}
          <div>
            <FieldLabel>Full bio</FieldLabel>
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
              The full bio is managed in your{' '}
              <a
                href={`/${locale}/dashboard/profile`}
                style={{ color: '#C084FC', textDecoration: 'underline', textUnderlineOffset: 3 }}
              >
                Profile
              </a>
              . Edit it there and it will update here automatically.
            </div>
          </div>

          {/* Press quote */}
          <div>
            <FieldLabel>Press quote</FieldLabel>
            <textarea
              rows={3}
              placeholder="Optional quote from media, curator or promoter"
              disabled={disabled}
              style={TEXTAREA_STYLE}
              {...register('pressQuote')}
            />
          </div>
        </div>
      </Bento>

      {/* ── Location & availability ── */}
      <Bento pad={isMobile ? 16 : 20}>
        <SubHead title="Location & availability" hint="Displayed on your public EPK" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 12,
          }}
        >
          <div>
            <FieldLabel>Base location</FieldLabel>
            <input
              type="text"
              placeholder="Buenos Aires, AR"
              disabled={disabled}
              style={INPUT_STYLE}
              {...register('location')}
            />
          </div>
          <div>
            <FieldLabel>Availability notes</FieldLabel>
            <textarea
              rows={3}
              placeholder="e.g. Available for bookings across South America and Europe…"
              disabled={disabled}
              style={TEXTAREA_STYLE}
              {...register('availabilityNotes')}
            />
          </div>
        </div>
      </Bento>

      {/* ── Career highlights ── */}
      <Bento pad={isMobile ? 16 : 20}>
        <SubHead
          title="Career highlights"
          hint="Notable releases, venues, press mentions, or milestones"
          right={<Chip>{watchedHighlights.length}/8</Chip>}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {watchedHighlights.map((_, index) => (
            <div key={`highlight-${index}`} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Notable release, venue, quote or press mention"
                disabled={disabled}
                style={{ ...INPUT_STYLE, flex: 1 }}
                {...register(`highlights.${index}`)}
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  setValue(
                    'highlights',
                    watchedHighlights.filter((_, i) => i !== index),
                    { shouldDirty: true },
                  )
                }
                style={{
                  padding: '0 12px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 12,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Remove
              </button>
            </div>
          ))}
          {watchedHighlights.length < 8 && !disabled && (
            <button
              type="button"
              onClick={() =>
                setValue('highlights', [...watchedHighlights, ''], { shouldDirty: true })
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                height: 40,
                borderRadius: 10,
                border: '1px dashed rgba(255,255,255,0.15)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.45)',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
              {watchedHighlights.length === 0 ? 'Add a highlight' : 'Add another highlight'}
            </button>
          )}
          {watchedHighlights.length === 0 && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
              No highlights yet. Each highlight becomes a card on your public EPK.
            </p>
          )}
        </div>
      </Bento>

      {/* ── Links ── */}
      <Bento pad={isMobile ? 16 : 20}>
        <SubHead
          title="Featured links"
          hint="Choose which links from your profile appear on your EPK"
          right={
            <Chip>
              {watchedFeaturedLinks.length}/{profileAndSmartLinks.length}
            </Chip>
          }
        />
        {profileAndSmartLinks.length === 0 ? (
          <p
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.35)',
              textAlign: 'center',
              padding: '12px 0',
            }}
          >
            No links found. Add social or streaming links to your profile first.
          </p>
        ) : (
          <div
            style={{
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}
          >
            {profileAndSmartLinks.map((link, i) => {
              const visible = watchedFeaturedLinks.some(
                (item: EpkFeaturedLinkItem) => item.url === link.url,
              );
              return (
                <div
                  key={link.url}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderBottom:
                      i < profileAndSmartLinks.length - 1
                        ? '1px solid rgba(255,255,255,0.06)'
                        : 'none',
                    background: 'rgba(255,255,255,0.01)',
                  }}
                >
                  <span style={{ fontSize: 13, color: 'white', fontWeight: 500 }}>
                    {link.label}
                  </span>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      const currentLinks = watchedFeaturedLinks;
                      const exists = currentLinks.some(
                        (item: EpkFeaturedLinkItem) => item.url === link.url,
                      );
                      if (exists) {
                        setValue(
                          'featuredLinks',
                          currentLinks.filter((item: EpkFeaturedLinkItem) => item.url !== link.url),
                          { shouldDirty: true },
                        );
                      } else {
                        setValue(
                          'featuredLinks',
                          [
                            ...currentLinks,
                            { id: crypto.randomUUID(), label: link.label, url: link.url },
                          ],
                          { shouldDirty: true },
                        );
                      }
                    }}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 999,
                      border: visible
                        ? '1px solid rgba(224,64,251,0.4)'
                        : '1px solid rgba(255,255,255,0.12)',
                      background: visible ? 'rgba(224,64,251,0.12)' : 'transparent',
                      color: visible ? '#E040FB' : 'rgba(255,255,255,0.5)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {visible ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Bento>
    </div>
  );
}
