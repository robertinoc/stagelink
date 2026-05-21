'use client';

// Tab 2 — Media
// Photo gallery (extra slots 2+), featured media (Spotify/YouTube/SoundCloud),
// and inherited record labels (read-only, managed from Profile).

import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type {
  EpkFeaturedMediaItem,
  EpkInheritedArtistSnapshot,
  RecordLabel,
} from '@stagelink/types';
import { Bento } from '@/components/sl/Bento';
import { Btn } from '@/components/sl/Btn';
import { EpkGallerySection } from '../EpkGallerySection';
import { RecordLabelLogo } from '../RecordLabelLogo';
import { SubHead, Chip } from '@/features/artist/components/SubHead';
import { useIsMobile } from '@/features/artist/hooks/useIsMobile';
import type { EpkFormValues } from '../../schemas/epk.schema';

function detectMediaProvider(url: string): EpkFeaturedMediaItem['provider'] {
  if (url.includes('spotify.com')) return 'spotify';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('soundcloud.com')) return 'soundcloud';
  return 'other';
}

const PROVIDER_LABELS: Record<EpkFeaturedMediaItem['provider'], string> = {
  spotify: 'Spotify',
  youtube: 'YouTube',
  soundcloud: 'SoundCloud',
  other: 'Other',
};

interface EpkMediaTabProps {
  form: UseFormReturn<EpkFormValues>;
  disabled: boolean;
  artistId: string;
  inherited: EpkInheritedArtistSnapshot;
}

export function EpkMediaTab({ form, disabled, artistId, inherited }: EpkMediaTabProps) {
  const { watch, setValue, getValues } = form;
  const isMobile = useIsMobile();
  const watchedGallery = watch('galleryImageUrls');
  const watchedFeaturedMedia = watch('featuredMedia');
  const [draftMedia, setDraftMedia] = useState<{
    title: string;
    url: string;
    provider: EpkFeaturedMediaItem['provider'];
  } | null>(null);

  function setExtraGalleryImages(urls: string[]) {
    const systemSlots = watchedGallery.slice(0, 2);
    setValue('galleryImageUrls', [...systemSlots, ...urls].filter(Boolean), { shouldDirty: true });
  }

  function removeFeaturedMediaItem(index: number) {
    setValue(
      'featuredMedia',
      (getValues('featuredMedia') ?? []).filter((_, i) => i !== index),
      { shouldDirty: true },
    );
  }

  function confirmDraftMedia() {
    if (!draftMedia || !draftMedia.title.trim() || !draftMedia.url.trim()) return;
    const current = getValues('featuredMedia') ?? [];
    setValue('featuredMedia', [...current, { id: crypto.randomUUID(), ...draftMedia }], {
      shouldDirty: true,
    });
    setDraftMedia(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Photo gallery ── */}
      <Bento pad={isMobile ? 16 : 20}>
        <SubHead
          title="Photo gallery"
          hint="Add photos that appear in the Gallery section of your public EPK"
          right={<Chip>{watchedGallery.slice(2).filter(Boolean).length}/6</Chip>}
        />
        <EpkGallerySection
          artistId={artistId}
          extraImageUrls={watchedGallery.slice(2)}
          profileGalleryUrls={inherited.profileGalleryUrls}
          onChange={setExtraGalleryImages}
          disabled={disabled}
        />
      </Bento>

      {/* ── Featured media ── */}
      <Bento pad={isMobile ? 16 : 20}>
        <SubHead
          title="Featured media"
          hint="Music, video, or audio links shown in the Media section of your EPK"
          right={<Chip>{watchedFeaturedMedia.length}/6</Chip>}
        />

        {watchedFeaturedMedia.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {watchedFeaturedMedia.map((item, index) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'white',
                      marginBottom: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.title}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.4)',
                      marginBottom: 6,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.url}
                  </p>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.5)',
                      fontWeight: 600,
                      fontFamily: 'var(--font-heading)',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {PROVIDER_LABELS[item.provider]}
                  </span>
                </div>
                <Btn
                  size="sm"
                  variant="ghost"
                  type="button"
                  disabled={disabled}
                  onClick={() => removeFeaturedMediaItem(index)}
                >
                  Remove
                </Btn>
              </div>
            ))}
          </div>
        )}

        {/* Draft media form */}
        {draftMedia !== null && (
          <div
            style={{
              padding: 14,
              borderRadius: 12,
              background: 'rgba(224,64,251,0.06)',
              border: '1px solid rgba(224,64,251,0.2)',
              marginBottom: 12,
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.7)',
                marginBottom: 10,
              }}
            >
              New media link
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.5)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Title
                </label>
                <input
                  type="text"
                  placeholder="New Single, Live Set, Album…"
                  value={draftMedia.title}
                  onChange={(e) => setDraftMedia({ ...draftMedia, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 9,
                    color: 'white',
                    fontSize: 13,
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.5)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  URL
                </label>
                <input
                  type="text"
                  placeholder="https://open.spotify.com/…"
                  value={draftMedia.url}
                  onChange={(e) => {
                    const url = e.target.value;
                    setDraftMedia({ ...draftMedia, url, provider: detectMediaProvider(url) });
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 9,
                    color: 'white',
                    fontSize: 13,
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {(['spotify', 'youtube', 'soundcloud', 'other'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDraftMedia({ ...draftMedia, provider: p })}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 999,
                    border:
                      draftMedia.provider === p
                        ? '1px solid rgba(224,64,251,0.4)'
                        : '1px solid rgba(255,255,255,0.12)',
                    background: draftMedia.provider === p ? 'rgba(224,64,251,0.12)' : 'transparent',
                    color: draftMedia.provider === p ? '#E040FB' : 'rgba(255,255,255,0.5)',
                    fontSize: 11,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 600,
                  }}
                >
                  {PROVIDER_LABELS[p]}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn
                size="sm"
                variant="primary"
                type="button"
                disabled={!draftMedia.title.trim() || !draftMedia.url.trim()}
                onClick={confirmDraftMedia}
              >
                Add
              </Btn>
              <Btn size="sm" variant="ghost" type="button" onClick={() => setDraftMedia(null)}>
                Cancel
              </Btn>
            </div>
          </div>
        )}

        {watchedFeaturedMedia.length < 6 && draftMedia === null && !disabled && (
          <button
            type="button"
            onClick={() => setDraftMedia({ title: '', url: '', provider: 'other' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              width: '100%',
              height: 44,
              borderRadius: 10,
              border: '1px dashed rgba(255,255,255,0.15)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            Add media link
          </button>
        )}
      </Bento>

      {/* ── Record labels (inherited) ── */}
      {inherited.recordLabels.length > 0 && (
        <Bento pad={isMobile ? 16 : 20}>
          <SubHead
            title="Record labels"
            hint="Inherited from your artist profile — manage them in Profile"
            right={<Chip>{inherited.recordLabels.length}</Chip>}
          />
          <div
            style={{
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}
          >
            {inherited.recordLabels.map((label: RecordLabel, i: number) => {
              const logoSrc =
                label.logoUrl ??
                (() => {
                  try {
                    return `https://logo.clearbit.com/${new URL(label.websiteUrl ?? '').hostname}`;
                  } catch {
                    return null;
                  }
                })();
              return (
                <div
                  key={label.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderBottom:
                      i < inherited.recordLabels.length - 1
                        ? '1px solid rgba(255,255,255,0.06)'
                        : 'none',
                  }}
                >
                  <RecordLabelLogo
                    logoSrc={logoSrc}
                    alt={label.name}
                    className="h-8 w-8 flex-shrink-0 rounded-md border border-white/10 bg-white object-contain p-0.5"
                  />
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'white',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label.name}
                    </p>
                    {label.websiteUrl && (
                      <p
                        style={{
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.4)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {label.websiteUrl}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Bento>
      )}
    </div>
  );
}
