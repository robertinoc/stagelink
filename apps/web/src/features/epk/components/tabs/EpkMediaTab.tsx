'use client';

// Tab 2 — Media & galería
// Three sections:
//   1. Photo gallery — pick which profile photos appear in the EPK
//   2. Featured media — Spotify/YouTube/SoundCloud links shown as branded rows
//   3. Links visibility — toggle which profile/smartlink URLs appear on the EPK

import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type {
  EpkFeaturedLinkItem,
  EpkFeaturedMediaItem,
  EpkInheritedArtistSnapshot,
} from '@stagelink/types';
import { Bento } from '@/components/sl/Bento';
import { Btn } from '@/components/sl/Btn';
import { Icon } from '@/components/sl/Icon';
import { EpkGallerySection } from '../EpkGallerySection';
import { EpkMediaRow } from '../EpkMediaRow';
import { EpkLinkRow } from '../EpkLinkRow';
import { SubHead, Chip } from '@/features/artist/components/SubHead';
import { useIsMobile } from '@/features/artist/hooks/useIsMobile';
import type { EpkFormValues } from '../../schemas/epk.schema';

function detectMediaProvider(url: string): EpkFeaturedMediaItem['provider'] {
  if (url.includes('spotify.com')) return 'spotify';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('soundcloud.com')) return 'soundcloud';
  return 'other';
}

interface EpkMediaTabProps {
  form: UseFormReturn<EpkFormValues>;
  disabled: boolean;
  artistId: string;
  inherited: EpkInheritedArtistSnapshot;
  profileAndSmartLinks: { label: string; url: string }[];
}

export function EpkMediaTab({
  form,
  disabled,
  artistId,
  inherited,
  profileAndSmartLinks,
}: EpkMediaTabProps) {
  const { watch, setValue, getValues } = form;
  const isMobile = useIsMobile();
  const watchedGallery = watch('galleryImageUrls');
  const watchedFeaturedMedia = watch('featuredMedia');
  const watchedFeaturedLinks = watch('featuredLinks');
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

  function toggleLink(link: { label: string; url: string }) {
    const current = watchedFeaturedLinks;
    const exists = current.some((item: EpkFeaturedLinkItem) => item.url === link.url);
    if (exists) {
      setValue(
        'featuredLinks',
        current.filter((item: EpkFeaturedLinkItem) => item.url !== link.url),
        { shouldDirty: true },
      );
    } else {
      setValue(
        'featuredLinks',
        [...current, { id: crypto.randomUUID(), label: link.label, url: link.url }],
        { shouldDirty: true },
      );
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Photo gallery ────────────────────────────────────────────────── */}
      <Bento pad={isMobile ? 16 : 20}>
        <SubHead
          title="Galería de fotos"
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

      {/* ── Featured media ───────────────────────────────────────────────── */}
      <Bento pad={0}>
        <div style={{ padding: isMobile ? '16px 16px 6px' : '20px 24px 10px' }}>
          <SubHead
            title="Media destacada"
            hint="Music, video, or audio links shown in the Media section of your EPK"
            right={
              <>
                <Chip>{watchedFeaturedMedia.length}/6</Chip>
                {!disabled && watchedFeaturedMedia.length < 6 && draftMedia === null && (
                  <Btn
                    size="sm"
                    variant="outline"
                    type="button"
                    icon={<Icon.Plus size={12} />}
                    onClick={() => setDraftMedia({ title: '', url: '', provider: 'other' })}
                  >
                    Agregar media
                  </Btn>
                )}
              </>
            }
          />
        </div>

        {/* Existing rows */}
        {watchedFeaturedMedia.map((item, index) => (
          <EpkMediaRow
            key={item.id}
            media={item}
            locked={disabled}
            last={index === watchedFeaturedMedia.length - 1 && draftMedia === null}
            onRemove={() => removeFeaturedMediaItem(index)}
          />
        ))}

        {/* Empty state */}
        {watchedFeaturedMedia.length === 0 && draftMedia === null && (
          <div
            style={{
              padding: '36px 24px',
              textAlign: 'center',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              fontSize: 12.5,
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.5 }}>🎧</div>
            Sumá un link de Spotify, YouTube o SoundCloud.
          </div>
        )}

        {/* Draft media form */}
        {draftMedia !== null && (
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(224,64,251,0.04)',
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.7)',
                marginBottom: 10,
                fontFamily: 'var(--font-heading)',
              }}
            >
              Nuevo link de media
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 10,
                marginBottom: 10,
              }}
            >
              <input
                type="text"
                placeholder="Título — New Single, Live Set, Album…"
                value={draftMedia.title}
                onChange={(e) => setDraftMedia({ ...draftMedia, title: e.target.value })}
                style={DRAFT_INPUT_STYLE}
              />
              <input
                type="text"
                placeholder="https://open.spotify.com/…"
                value={draftMedia.url}
                onChange={(e) => {
                  const url = e.target.value;
                  setDraftMedia({ ...draftMedia, url, provider: detectMediaProvider(url) });
                }}
                style={DRAFT_INPUT_STYLE}
              />
            </div>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}
            >
              <span
                style={{
                  alignSelf: 'center',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                Detectado: {draftMedia.provider}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn size="sm" variant="ghost" type="button" onClick={() => setDraftMedia(null)}>
                  Cancelar
                </Btn>
                <Btn
                  size="sm"
                  variant="primary"
                  type="button"
                  disabled={!draftMedia.title.trim() || !draftMedia.url.trim()}
                  onClick={confirmDraftMedia}
                >
                  Agregar
                </Btn>
              </div>
            </div>
          </div>
        )}
      </Bento>

      {/* ── Links visibility ────────────────────────────────────────────── */}
      <Bento pad={0}>
        <div style={{ padding: isMobile ? '16px 16px 6px' : '20px 24px 10px' }}>
          <SubHead
            title="Visibilidad de links"
            hint="Tus links existen en tu Perfil. Elegí cuáles aparecen como pills en tu EPK. Todos los visibles se muestran con el mismo peso."
            right={
              <Chip>
                {watchedFeaturedLinks.length}/{profileAndSmartLinks.length}
              </Chip>
            }
          />
        </div>

        {profileAndSmartLinks.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              fontSize: 12.5,
              color: 'rgba(255,255,255,0.4)',
              fontStyle: 'italic',
            }}
          >
            Sin links en tu Perfil todavía. Agregalos primero desde Profile.
          </div>
        ) : (
          <>
            {/* Header row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                padding: '8px 24px 10px',
                fontSize: 10,
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                gap: 14,
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div>Plataforma · URL</div>
              <div>Visibilidad</div>
            </div>

            {profileAndSmartLinks.map((link, i) => {
              const visible = watchedFeaturedLinks.some(
                (item: EpkFeaturedLinkItem) => item.url === link.url,
              );
              return (
                <EpkLinkRow
                  key={link.url}
                  label={link.label}
                  url={link.url}
                  visible={visible}
                  locked={disabled}
                  last={i === profileAndSmartLinks.length - 1}
                  onToggle={() => toggleLink(link)}
                />
              );
            })}
          </>
        )}
      </Bento>
    </div>
  );
}

const DRAFT_INPUT_STYLE: React.CSSProperties = {
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
};
