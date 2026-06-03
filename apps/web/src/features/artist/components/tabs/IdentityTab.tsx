'use client';

// Tab 1 — Identidad y galería
// Hero card (cover + avatar + name) + categories + descriptors + bios + gallery

import { useRef, useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useController, type UseFormReturn } from 'react-hook-form';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Bento } from '@/components/sl/Bento';
import { Icon } from '@/components/sl/Icon';
import { Btn } from '@/components/sl/Btn';
import { confirmUpload, requestUploadIntent, resolveMimeType, uploadToS3 } from '@/lib/api/assets';
import { SubHead, Chip } from '../SubHead';
import { MarkdownEditor } from '../MarkdownEditor';
import { GalleryThumb } from '../GalleryThumb';
import type { ProfileFormValues } from '../../schemas/profile.schema';
import type { ARTIST_CATEGORIES } from '../../schemas/profile.schema';

const CATEGORY_LABELS: Record<(typeof ARTIST_CATEGORIES)[number], string> = {
  musician: 'Músico',
  dj: 'DJ',
  actor: 'Actor',
  painter: 'Pintor',
  visual_artist: 'Artista visual',
  performer: 'Performer',
  creator: 'Creador',
  band: 'Banda',
  producer: 'Productor',
  other: 'Otro',
};

const DESCRIPTOR_SUGGESTIONS = [
  'acid',
  'underground',
  'driving',
  'melodic',
  'industrial',
  'minimal',
  'progressive',
  'tech house',
];

const DEFAULT_COVER_BG = `
  radial-gradient(ellipse 60% 50% at 30% 50%, rgba(224,64,251,0.45) 0%, transparent 70%),
  radial-gradient(ellipse 60% 50% at 80% 60%, rgba(0,212,255,0.28) 0%, transparent 70%),
  linear-gradient(135deg, #2a0e4f 0%, #0a0612 100%)
`.trim();

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface IdentityTabProps {
  form: UseFormReturn<ProfileFormValues>;
  artistId: string;
  currentAvatarUrl?: string | null;
  currentCoverUrl?: string | null;
  onAvatarChange: (url: string) => void;
  onCoverChange: (url: string) => void;
}

export function IdentityTab({
  form,
  artistId,
  currentAvatarUrl,
  currentCoverUrl,
  onAvatarChange,
  onCoverChange,
}: IdentityTabProps) {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = form;

  const displayName = watch('displayName');
  const categories = watch('categories') ?? [];
  const tags = watch('tags') ?? [];
  const galleryImageUrls = watch('galleryImageUrls') ?? [];
  const bio = watch('bio') ?? '';
  const fullBio = watch('fullBio') ?? '';

  // ── Upload helpers ────────────────────────────────────────────────────
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);
  const [localCoverPreview, setLocalCoverPreview] = useState<string | null>(null);

  async function uploadImage(
    file: File,
    type: 'avatar' | 'cover' | 'profile_gallery',
    onStart: () => void,
    onDone: (url: string) => void,
    onEnd: () => void,
  ) {
    const mime = resolveMimeType(file);
    if (!ALLOWED_IMAGE_TYPES.includes(mime)) return;
    const maxMb = type === 'cover' ? 8 : 5;
    if (file.size > maxMb * 1024 * 1024) return;
    onStart();
    try {
      const intent = await requestUploadIntent(artistId, type, file);
      await uploadToS3(intent.uploadUrl, file, () => {});
      const asset = await confirmUpload(intent.assetId);
      if (asset.deliveryUrl) onDone(asset.deliveryUrl);
    } catch (err) {
      console.error(`[profile] Image upload failed (${type}):`, err);
    } finally {
      onEnd();
    }
  }

  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const blob = URL.createObjectURL(file);
    setLocalAvatarPreview(blob);
    void uploadImage(
      file,
      'avatar',
      () => setAvatarUploading(true),
      (url) => {
        onAvatarChange(url);
        setLocalAvatarPreview(null);
      },
      () => setAvatarUploading(false),
    );
    e.target.value = '';
  }

  function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const blob = URL.createObjectURL(file);
    setLocalCoverPreview(blob);
    void uploadImage(
      file,
      'cover',
      () => setCoverUploading(true),
      (url) => {
        onCoverChange(url);
        setLocalCoverPreview(null);
      },
      () => setCoverUploading(false),
    );
    e.target.value = '';
  }

  function handleGalleryFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (galleryImageUrls.length >= 6) return;
    void uploadImage(
      file,
      'profile_gallery',
      () => setGalleryUploading(true),
      (url) => setValue('galleryImageUrls', [...galleryImageUrls, url], { shouldDirty: true }),
      () => setGalleryUploading(false),
    );
    e.target.value = '';
  }

  // ── Categories ────────────────────────────────────────────────────────
  function toggleCategory(cat: (typeof ARTIST_CATEGORIES)[number]) {
    if (categories.includes(cat)) {
      setValue(
        'categories',
        categories.filter((c) => c !== cat),
        { shouldDirty: true },
      );
    } else if (categories.length < 3) {
      setValue('categories', [...categories, cat], { shouldDirty: true });
    }
  }

  // ── Descriptors ───────────────────────────────────────────────────────
  const [tagDraft, setTagDraft] = useState('');
  function addTag(raw: string) {
    const t = raw.trim().toLowerCase();
    if (!t || tags.includes(t) || tags.length >= 6) return;
    setValue('tags', [...tags, t], { shouldDirty: true });
    setTagDraft('');
  }
  function removeTag(t: string) {
    setValue(
      'tags',
      tags.filter((x) => x !== t),
      { shouldDirty: true },
    );
  }

  // ── Gallery drag-and-drop ─────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const galleryIds = galleryImageUrls.map((_, i) => `g${i}`);

  function handleGalleryDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = galleryIds.indexOf(String(active.id));
    const newIdx = galleryIds.indexOf(String(over.id));
    const reordered = arrayMove(galleryImageUrls, oldIdx, newIdx);
    setValue('galleryImageUrls', reordered, { shouldDirty: true });
  }

  function deleteGalleryItem(idx: number) {
    setValue(
      'galleryImageUrls',
      galleryImageUrls.filter((_, i) => i !== idx),
      { shouldDirty: true },
    );
  }

  // ── Responsive ───────────────────────────────────────────────────────
  const isMobile = useIsMobile();

  // ── Artwork url ───────────────────────────────────────────────────────
  const avatarDisplay = localAvatarPreview ?? currentAvatarUrl;
  const coverDisplay = localCoverPreview ?? currentCoverUrl;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Hero card ─────────────────────────────────────────────────── */}
      <Bento pad={0}>
        {/* Cover */}
        <div
          style={{
            height: 180,
            borderRadius: '20px 20px 0 0',
            background: coverDisplay ? 'none' : DEFAULT_COVER_BG,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {coverDisplay && (
            <img
              src={coverDisplay}
              alt="Cover"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
          {/* Cover label pill */}
          <span
            style={{
              position: 'absolute',
              top: 12,
              left: 14,
              fontFamily: 'var(--font-heading)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              color: 'rgba(255,255,255,0.85)',
            }}
          >
            Cover · 1500×500
          </span>
          {/* Change cover button */}
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={coverUploading}
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 999,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.85)',
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Icon.Upload size={12} />
            {coverUploading ? 'Subiendo…' : 'Cambiar cover'}
          </button>
          {/* Format hint */}
          <span
            style={{
              position: 'absolute',
              bottom: 10,
              right: 14,
              fontFamily: 'var(--font-heading)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            JPEG · PNG · WebP · máx 8MB
          </span>
        </div>

        {/* Identity row: avatar + name + URL chip */}
        <div
          style={{
            display: 'grid',
            // Mobile: 2 cols (avatar + name). Desktop: 3 cols (avatar + name + button pill).
            gridTemplateColumns: isMobile ? 'auto 1fr' : 'auto 1fr auto',
            gap: isMobile ? 14 : 24,
            padding: isMobile ? '0 18px 22px' : '0 28px 26px',
            marginTop: isMobile ? -44 : -56,
            alignItems: 'flex-end',
          }}
        >
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: isMobile ? 90 : 120,
                height: isMobile ? 90 : 120,
                borderRadius: '50%',
                border: '4px solid #0D0A1A',
                outline: '1px solid rgba(255,255,255,0.10)',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #2a0e4f, #0a0612)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
              }}
            >
              {avatarDisplay && (
                <img
                  src={avatarDisplay}
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
            {/* Avatar upload button */}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg,#E040FB,#9B30D0)',
                border: '3px solid #0D0A1A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
              }}
              title="Cambiar foto"
            >
              <Icon.Camera size={14} />
            </button>
          </div>

          {/* Name */}
          <div style={{ paddingTop: isMobile ? 48 : 64, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: '#E040FB',
                marginBottom: 4,
              }}
            >
              Nombre artístico *
            </div>
            <input
              {...register('displayName')}
              placeholder="Tu nombre artístico"
              style={{
                fontFamily: 'var(--font-heading)',
                // On mobile: fixed 22px so it doesn't overflow. Desktop: fluid clamp.
                fontSize: isMobile ? 22 : 'clamp(22px,3cqw,38px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'white',
                background: 'transparent',
                border: '1px solid transparent',
                borderRadius: 8,
                padding: '4px 12px',
                width: '100%',
                outline: 'none',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.background = 'rgba(0,0,0,0.3)';
                (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)';
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.background = 'transparent';
                (e.target as HTMLInputElement).style.borderColor = 'transparent';
              }}
            />
            {errors.displayName && (
              <p style={{ fontSize: 11, color: '#ff6b6b', marginTop: 4, paddingLeft: 12 }}>
                {errors.displayName.message}
              </p>
            )}
          </div>

          {/* "Cambiar foto" pill — desktop only (mobile uses camera icon on avatar) */}
          {!isMobile && (
            <div style={{ paddingTop: 64 }}>
              <Btn
                variant="ghost"
                size="sm"
                icon={<Icon.Camera size={13} />}
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                style={{ borderRadius: 10 }}
              >
                Cambiar foto
              </Btn>
            </div>
          )}
        </div>

        {/* Hidden inputs */}
        <input
          ref={avatarInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          onChange={handleAvatarFile}
          className="hidden"
        />
        <input
          ref={coverInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          onChange={handleCoverFile}
          className="hidden"
        />
      </Bento>

      {/* ── Categories + Descriptors — 2-col desktop / 1-col mobile ──── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        {/* Categories */}
        <Bento pad={isMobile ? 16 : 22}>
          <SubHead
            title="Categoría *"
            hint="Hasta 3. Tocá para seleccionar; tocá de nuevo para quitar."
            right={<Chip>{categories.length}/3</Chip>}
          />

          {/* Selected preview */}
          {categories.length > 0 && (
            <div
              style={{
                background: 'rgba(224,64,251,0.06)',
                border: '1px solid rgba(224,64,251,0.18)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.40)',
                  marginBottom: 8,
                }}
              >
                Seleccionadas
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {categories.map((cat, idx) => (
                  <span
                    key={cat}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 10px 5px 6px',
                      borderRadius: 999,
                      background:
                        'linear-gradient(135deg,rgba(224,64,251,0.25),rgba(74,26,140,0.20))',
                      border: '1px solid rgba(224,64,251,0.30)',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'white',
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.18)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-heading)',
                        fontSize: 9,
                        fontWeight: 700,
                      }}
                    >
                      {idx + 1}
                    </span>
                    {CATEGORY_LABELS[cat]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Options grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(Object.keys(CATEGORY_LABELS) as Array<(typeof ARTIST_CATEGORIES)[number]>).map(
              (cat) => {
                const selected = categories.includes(cat);
                const disabled = !selected && categories.length >= 3;
                const idx = categories.indexOf(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    disabled={disabled}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '11px 14px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: selected ? 600 : 500,
                      fontFamily: 'var(--font-body)',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      background: selected ? 'rgba(224,64,251,0.15)' : 'rgba(0,0,0,0.25)',
                      border: selected
                        ? '1px solid rgba(224,64,251,0.5)'
                        : '1px solid rgba(255,255,255,0.08)',
                      color: selected
                        ? 'white'
                        : disabled
                          ? 'rgba(255,255,255,0.30)'
                          : 'rgba(255,255,255,0.70)',
                      opacity: disabled ? 0.5 : 1,
                      transition: 'all 0.12s',
                    }}
                  >
                    {CATEGORY_LABELS[cat]}
                    {selected && (
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: '#E040FB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-heading)',
                          fontSize: 10,
                          fontWeight: 700,
                          color: 'white',
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </span>
                    )}
                  </button>
                );
              },
            )}
          </div>
        </Bento>

        {/* Descriptors */}
        <Bento pad={isMobile ? 16 : 22}>
          <SubHead
            title="Descriptores"
            hint="Géneros, estilos o nichos. Hasta 6."
            right={<Chip>{tags.length}/6</Chip>}
          />

          {/* Tag list */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              minHeight: 36,
              marginBottom: 12,
            }}
          >
            {tags.length === 0 && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.30)' }}>
                Sin descriptores. Agregá abajo.
              </span>
            )}
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 6px 6px 12px',
                  borderRadius: 999,
                  background: 'rgba(224,64,251,0.12)',
                  border: '1px solid rgba(224,64,251,0.25)',
                  color: '#E040FB',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: 'rgba(224,64,251,0.22)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#E040FB',
                    fontSize: 12,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* Input row */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            <input
              type="text"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag(tagDraft);
                }
              }}
              placeholder="Escribí un género, nicho o estilo..."
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'white',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <Btn
              variant="ghost"
              size="sm"
              icon={<Icon.Plus size={13} />}
              onClick={() => addTag(tagDraft)}
              disabled={tags.length >= 6}
            >
              Agregar
            </Btn>
          </div>

          {/* Suggestions */}
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: 14,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}>Sugerencias:</span>
            {DESCRIPTOR_SUGGESTIONS.filter((s) => !tags.includes(s))
              .slice(0, 6)
              .map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addTag(s)}
                  disabled={tags.length >= 6}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 999,
                    background: 'transparent',
                    border: '1px dashed rgba(255,255,255,0.14)',
                    color: 'rgba(255,255,255,0.70)',
                    fontSize: 11,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  + {s}
                </button>
              ))}
          </div>
        </Bento>
      </div>

      {/* ── Bios ─────────────────────────────────────────────────────── */}
      <Bento pad={22}>
        <SubHead
          title="Bio corta"
          hint="Se muestra en la cabecera de tu página pública. Soporta **negrita** e _italica_."
          right={
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{bio.length}/1000</span>
          }
        />
        <MarkdownEditor
          value={bio}
          onChange={(v) => setValue('bio', v, { shouldDirty: true })}
          rows={3}
          maxLength={1000}
          placeholder="Una línea impactante sobre tu música y tu historia…"
        />
      </Bento>

      <Bento pad={22}>
        <SubHead
          title="Bio completa"
          hint="Aparece en tu Press Kit y en el bloque About de tu página."
          right={
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
              {fullBio.length}/5000
            </span>
          }
        />
        <MarkdownEditor
          value={fullBio}
          onChange={(v) => setValue('fullBio', v, { shouldDirty: true })}
          rows={9}
          maxLength={5000}
          placeholder="Tu historia en detalle…"
        />
      </Bento>

      {/* ── Photo gallery ─────────────────────────────────────────────── */}
      <Bento pad={22}>
        <SubHead
          title="Galería de fotos"
          hint="Subí hasta 6 fotos artísticas. Las reusás en el bloque Image Gallery de tu página."
          right={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Chip>{galleryImageUrls.length}/6</Chip>
              <Btn
                variant="outline"
                size="sm"
                icon={<Icon.Plus size={13} />}
                onClick={() => galleryInputRef.current?.click()}
                disabled={galleryImageUrls.length >= 6 || galleryUploading}
              >
                {galleryUploading ? 'Subiendo…' : 'Subir foto'}
              </Btn>
            </div>
          }
        />

        <input
          ref={galleryInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          onChange={handleGalleryFile}
          className="hidden"
        />

        {galleryImageUrls.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleGalleryDragEnd}
          >
            <SortableContext items={galleryIds} strategy={rectSortingStrategy}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {galleryImageUrls.map((url, idx) => (
                  <GalleryThumb
                    key={galleryIds[idx] ?? `g${idx}`}
                    id={galleryIds[idx] ?? `g${idx}`}
                    index={idx}
                    url={url}
                    onReplace={() => galleryInputRef.current?.click()}
                    onDelete={() => deleteGalleryItem(idx)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                onClick={() => galleryInputRef.current?.click()}
                style={{
                  aspectRatio: '16/10',
                  borderRadius: 12,
                  border: '1px dashed rgba(255,255,255,0.12)',
                  background: `linear-gradient(135deg, hsl(${260 + i * 12},55%,${18 + i * 2}%) 0%, hsl(${280 + i * 8},45%,${8 + i * 3}%) 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  opacity: 0.6,
                }}
              >
                <Icon.Plus size={20} className="text-white/30" />
              </div>
            ))}
          </div>
        )}

        {/* Tip strip */}
        <div
          style={{
            marginTop: 14,
            borderRadius: 10,
            padding: '10px 14px',
            background: 'rgba(0,212,255,0.08)',
            border: '1px solid rgba(0,212,255,0.2)',
            fontSize: 12,
            color: 'rgba(255,255,255,0.70)',
          }}
        >
          💡 <strong>Tip:</strong> imágenes horizontales 16:10 funcionan mejor en grid. Arrastrá
          para reordenar.
        </div>
      </Bento>
    </div>
  );
}
