'use client';

import { ImagePlus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EpkImageUploader } from './EpkImageUploader';

interface EpkGallerySectionProps {
  artistId: string;
  /** Indices 2+ from galleryImageUrls — the extra gallery photos shown in the EPK gallery section. */
  extraImageUrls: string[];
  /** Images from the artist's profile gallery (artists.galleryImageUrls), surfaced via
   *  inherited.profileGalleryUrls so the editor can offer a "pick from gallery" flow. */
  profileGalleryUrls: string[];
  /** Called whenever the extra gallery photos change. Returns the new list. */
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}

/** Maximum extra gallery photos in the EPK (slots 2–7, after hero at 0 and portrait at 1). */
const MAX_EXTRA_GALLERY = 6;

/**
 * EpkGallerySection — embedded in EpkEditor to manage the EPK photo gallery.
 *
 * Two input paths:
 *  1. Pick from profile gallery: shows the artist's existing profile gallery images
 *     as selectable tiles (checked = already in EPK gallery, unchecked = not added).
 *  2. Upload new: EpkImageUploader with assetKind="epk_image" for fresh uploads.
 *
 * Selected images are stored at galleryImageUrls[2+] in the EPK form. The first
 * two slots (hero at [0], portrait at [1]) are managed by the "Header and identity"
 * section and are never touched here.
 */
export function EpkGallerySection({
  artistId,
  extraImageUrls,
  profileGalleryUrls,
  onChange,
  disabled = false,
}: EpkGallerySectionProps) {
  const t = useTranslations('dashboard.epk.gallery');

  const isFull = extraImageUrls.length >= MAX_EXTRA_GALLERY;

  function toggleProfileImage(url: string) {
    if (disabled) return;
    const isSelected = extraImageUrls.includes(url);
    if (isSelected) {
      onChange(extraImageUrls.filter((u) => u !== url));
    } else {
      if (isFull) return;
      onChange([...extraImageUrls, url]);
    }
  }

  function addAllProfileImages() {
    if (disabled) return;
    const toAdd = profileGalleryUrls.filter((url) => !extraImageUrls.includes(url));
    const next = [...extraImageUrls, ...toAdd].slice(0, MAX_EXTRA_GALLERY);
    onChange(next);
  }

  function removeExtraImage(url: string) {
    if (disabled) return;
    onChange(extraImageUrls.filter((u) => u !== url));
  }

  function handleUploaded(url: string) {
    if (isFull || disabled) return;
    onChange([...extraImageUrls, url]);
  }

  return (
    <div className="space-y-6">
      {/* ── Pick from profile gallery ─────────────────────────────────────── */}
      {profileGalleryUrls.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">{t('pick_title')}</p>
              <p className="text-xs text-muted-foreground">{t('pick_hint')}</p>
              <p className="text-xs text-muted-foreground">
                {t('pick_selected_count', {
                  selected: extraImageUrls.filter((u) => profileGalleryUrls.includes(u)).length,
                  total: Math.min(profileGalleryUrls.length, MAX_EXTRA_GALLERY),
                })}
              </p>
            </div>
            {!isFull && (
              <button
                type="button"
                onClick={addAllProfileImages}
                disabled={disabled}
                className="rounded-full border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('pick_use_all')}
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profileGalleryUrls.map((url, index) => {
              const selected = extraImageUrls.includes(url);
              const wouldExceed = !selected && isFull;
              return (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => toggleProfileImage(url)}
                  disabled={disabled || wouldExceed}
                  className={`overflow-hidden rounded-2xl border text-left transition ${
                    selected
                      ? 'border-primary bg-primary/[0.08] ring-1 ring-primary/50'
                      : 'border-white/10 bg-white/[0.03] hover:border-primary/30'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={t('image_alt', { index: index + 1 })}
                    className="h-40 w-full object-cover"
                  />
                  <div className="flex items-center justify-between gap-3 p-3">
                    <p className="truncate text-sm font-medium text-white">
                      {t('image_alt', { index: index + 1 })}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        selected
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-white/10 bg-white/[0.04] text-muted-foreground'
                      }`}
                    >
                      {selected ? t('pick_selected') : t('pick_select')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-muted-foreground">
          <p className="font-medium text-white">{t('pick_empty')}</p>
          <p className="mt-1">{t('pick_empty_hint')}</p>
        </div>
      )}

      {/* ── Currently added gallery photos (with remove) ──────────────────── */}
      {extraImageUrls.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {extraImageUrls.map((url, index) => (
            <div
              key={`${url}-extra-${index}`}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={t('image_alt', { index: index + 1 })}
                className="h-44 w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-end gap-2 p-3 opacity-0 transition group-hover:opacity-100">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  disabled={disabled}
                  className="h-8 w-8 border-white/15 bg-black/50 text-white hover:bg-black/70"
                  onClick={() => removeExtraImage(url)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">{t('remove')}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Upload new photo ──────────────────────────────────────────────── */}
      {!isFull && (
        <EpkImageUploader
          artistId={artistId}
          assetKind="epk_image"
          helperText={t('upload_hint')}
          disabled={disabled}
          onUploaded={(asset) => {
            if (asset.deliveryUrl) {
              handleUploaded(asset.deliveryUrl);
            }
          }}
          renderTrigger={({ open, uploading, disabled: uploaderDisabled }) => (
            <button
              type="button"
              onClick={open}
              disabled={uploaderDisabled}
              className="flex h-44 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 text-center transition hover:border-primary/40 hover:bg-primary/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
                <ImagePlus className="h-5 w-5 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">
                  {uploading ? t('uploading') : t('upload_new')}
                </p>
                <p className="text-xs text-muted-foreground">{t('upload_hint')}</p>
              </div>
            </button>
          )}
        />
      )}

      <p className="text-xs text-muted-foreground">
        {t('count', { current: extraImageUrls.length, max: MAX_EXTRA_GALLERY })}
      </p>
    </div>
  );
}
