'use client';

import { ImagePlus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EpkImageUploader } from '@/features/epk/components/EpkImageUploader';
import { Button } from '@/components/ui/button';

interface ProfileGallerySectionProps {
  artistId: string;
  galleryImageUrls: string[];
  onChange: (urls: string[]) => void;
}

const MAX_GALLERY_IMAGES = 6;

export function ProfileGallerySection({
  artistId,
  galleryImageUrls,
  onChange,
}: ProfileGallerySectionProps) {
  const t = useTranslations('dashboard.profile.gallery');

  function appendImage(url: string) {
    onChange([...galleryImageUrls, url].slice(0, MAX_GALLERY_IMAGES));
  }

  function removeImage(index: number) {
    onChange(galleryImageUrls.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_65px_rgba(10,7,20,0.18)]">
      <div className="mb-5 space-y-1">
        <h2 className="text-lg font-semibold text-white">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
        <p className="text-xs text-muted-foreground">
          {t('count', { current: galleryImageUrls.length, max: MAX_GALLERY_IMAGES })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {galleryImageUrls.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={t('image_alt', { index: index + 1 })}
              className="h-44 w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition group-hover:opacity-100" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3 opacity-0 transition group-hover:opacity-100">
              <span className="rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white">
                {t('image_label', { index: index + 1 })}
              </span>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 border-white/15 bg-black/50 text-white hover:bg-black/70"
                onClick={() => removeImage(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {galleryImageUrls.length < MAX_GALLERY_IMAGES && (
          <EpkImageUploader
            artistId={artistId}
            assetKind="profile_gallery"
            helperText={t('helper')}
            onUploaded={(asset) => {
              if (asset.deliveryUrl) {
                appendImage(asset.deliveryUrl);
              }
            }}
            renderTrigger={({ open, uploading, disabled }) => (
              <button
                type="button"
                onClick={open}
                disabled={disabled}
                className="flex h-44 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 text-center transition hover:border-primary/40 hover:bg-primary/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
                  <ImagePlus className="h-5 w-5 text-white" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">
                    {uploading ? t('uploading') : t('add_image')}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('helper')}</p>
                </div>
              </button>
            )}
          />
        )}
      </div>
    </div>
  );
}
