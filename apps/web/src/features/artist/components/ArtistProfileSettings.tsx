'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { updateArtist, type Artist, type UpdateArtistPayload } from '@/lib/api/artists';
import { profileSchema, type ProfileFormValues } from '../schemas/profile.schema';
import { ProfileBasicInfo } from './ProfileBasicInfo';
import { ProfileGallerySection } from './ProfileGallerySection';
import { ProfileImagesSection } from './ProfileImagesSection';
import { ProfileSocialLinks } from './ProfileSocialLinks';
import { ProfileSeoSection } from './ProfileSeoSection';
import { LocalizedProfileContentSection } from './LocalizedProfileContentSection';

interface ArtistProfileSettingsProps {
  artist: Artist;
  hasMultiLanguageAccess: boolean;
  billingHref: string;
}

/**
 * Artist profile editor — orchestrates all profile sections.
 *
 * Architecture:
 * - Form fields (basic info, social links, SEO) are managed by react-hook-form
 *   with zod validation. Saved together on "Save profile".
 * - Images (avatar, cover) are uploaded immediately via the presigned URL
 *   pipeline — they are NOT part of the form submit flow.
 *
 * Artist determination:
 * - The artist is resolved server-side by the page component (via /api/auth/me
 *   → artistIds[0] → GET /api/artists/:id) and passed as a prop.
 * - Multi-artist support: when a user can manage multiple artists, the page
 *   component would pass the selected artist; this component stays the same.
 */
export function ArtistProfileSettings({
  artist: initialArtist,
  hasMultiLanguageAccess,
  billingHref,
}: ArtistProfileSettingsProps) {
  const t = useTranslations('dashboard.profile');
  const [artist, setArtist] = useState<Artist>(initialArtist);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: artist.displayName,
      bio: artist.bio ?? '',
      baseLocale: artist.baseLocale,
      categories: [artist.category, ...(artist.secondaryCategories ?? [])],
      tags: artist.tags ?? [],
      galleryImageUrls: artist.galleryImageUrls ?? [],
      instagramUrl: artist.instagramUrl ?? '',
      tiktokUrl: artist.tiktokUrl ?? '',
      youtubeUrl: artist.youtubeUrl ?? '',
      spotifyUrl: artist.spotifyUrl ?? '',
      soundcloudUrl: artist.soundcloudUrl ?? '',
      websiteUrl: artist.websiteUrl ?? '',
      contactEmail: artist.contactEmail ?? '',
      seoTitle: artist.seoTitle ?? '',
      seoDescription: artist.seoDescription ?? '',
      translations: {
        en: {
          displayName: artist.translations?.displayName?.en ?? '',
          bio: artist.translations?.bio?.en ?? '',
          seoTitle: artist.translations?.seoTitle?.en ?? '',
          seoDescription: artist.translations?.seoDescription?.en ?? '',
        },
        es: {
          displayName: artist.translations?.displayName?.es ?? '',
          bio: artist.translations?.bio?.es ?? '',
          seoTitle: artist.translations?.seoTitle?.es ?? '',
          seoDescription: artist.translations?.seoDescription?.es ?? '',
        },
      },
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = form;
  const isBusy = isSubmitting || saveStatus === 'saving';

  function buildLocalizedFieldMap(
    values: Record<'en' | 'es', string | undefined>,
  ): Record<'en' | 'es', string> | undefined {
    const entries = Object.entries(values).filter(([, value]) => value?.trim());
    if (entries.length === 0) return undefined;

    return Object.fromEntries(entries.map(([locale, value]) => [locale, value!.trim()])) as Record<
      'en' | 'es',
      string
    >;
  }

  function buildTranslationsPayload(
    values: ProfileFormValues,
  ): NonNullable<UpdateArtistPayload['translations']> {
    const otherLocale = values.baseLocale === 'en' ? 'es' : 'en';

    return {
      ...(buildLocalizedFieldMap({
        [otherLocale]: values.translations[otherLocale].displayName,
      } as Record<'en' | 'es', string | undefined>) && {
        displayName: buildLocalizedFieldMap({
          [otherLocale]: values.translations[otherLocale].displayName,
        } as Record<'en' | 'es', string | undefined>),
      }),
      ...(buildLocalizedFieldMap({
        [otherLocale]: values.translations[otherLocale].bio,
      } as Record<'en' | 'es', string | undefined>) && {
        bio: buildLocalizedFieldMap({
          [otherLocale]: values.translations[otherLocale].bio,
        } as Record<'en' | 'es', string | undefined>),
      }),
      ...(buildLocalizedFieldMap({
        [otherLocale]: values.translations[otherLocale].seoTitle,
      } as Record<'en' | 'es', string | undefined>) && {
        seoTitle: buildLocalizedFieldMap({
          [otherLocale]: values.translations[otherLocale].seoTitle,
        } as Record<'en' | 'es', string | undefined>),
      }),
      ...(buildLocalizedFieldMap({
        [otherLocale]: values.translations[otherLocale].seoDescription,
      } as Record<'en' | 'es', string | undefined>) && {
        seoDescription: buildLocalizedFieldMap({
          [otherLocale]: values.translations[otherLocale].seoDescription,
        } as Record<'en' | 'es', string | undefined>),
      }),
    };
  }

  async function onSubmit(values: ProfileFormValues) {
    setSaveStatus('saving');
    setSaveError(null);

    const [category, ...secondaryCategories] = values.categories;
    if (!category) {
      setSaveError('Choose at least one category.');
      setSaveStatus('error');
      return;
    }

    // Transform empty strings → null so the backend can clear optional fields
    const payload = {
      displayName: values.displayName,
      bio: values.bio || null,
      baseLocale: values.baseLocale,
      category,
      secondaryCategories,
      tags: values.tags,
      galleryImageUrls: values.galleryImageUrls,
      instagramUrl: values.instagramUrl || null,
      tiktokUrl: values.tiktokUrl || null,
      youtubeUrl: values.youtubeUrl || null,
      spotifyUrl: values.spotifyUrl || null,
      soundcloudUrl: values.soundcloudUrl || null,
      websiteUrl: values.websiteUrl || null,
      contactEmail: values.contactEmail || null,
      seoTitle: values.seoTitle || null,
      seoDescription: values.seoDescription || null,
      ...(hasMultiLanguageAccess && {
        translations: buildTranslationsPayload(values),
      }),
    };

    try {
      const updated = await updateArtist(artist.id, payload);
      setArtist(updated);
      // Reset form with new values so isDirty becomes false
      reset({
        displayName: updated.displayName,
        bio: updated.bio ?? '',
        baseLocale: updated.baseLocale,
        categories: [updated.category, ...(updated.secondaryCategories ?? [])],
        tags: updated.tags ?? [],
        galleryImageUrls: updated.galleryImageUrls ?? [],
        instagramUrl: updated.instagramUrl ?? '',
        tiktokUrl: updated.tiktokUrl ?? '',
        youtubeUrl: updated.youtubeUrl ?? '',
        spotifyUrl: updated.spotifyUrl ?? '',
        soundcloudUrl: updated.soundcloudUrl ?? '',
        websiteUrl: updated.websiteUrl ?? '',
        contactEmail: updated.contactEmail ?? '',
        seoTitle: updated.seoTitle ?? '',
        seoDescription: updated.seoDescription ?? '',
        translations: {
          en: {
            displayName: updated.translations?.displayName?.en ?? '',
            bio: updated.translations?.bio?.en ?? '',
            seoTitle: updated.translations?.seoTitle?.en ?? '',
            seoDescription: updated.translations?.seoDescription?.en ?? '',
          },
          es: {
            displayName: updated.translations?.displayName?.es ?? '',
            bio: updated.translations?.bio?.es ?? '',
            seoTitle: updated.translations?.seoTitle?.es ?? '',
            seoDescription: updated.translations?.seoDescription?.es ?? '',
          },
        },
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 4000);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to save changes. Please try again.',
      );
      setSaveStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-6">
        {/* 1 — Images (outside form submit — immediate upload) */}
        <ProfileImagesSection
          artistId={artist.id}
          avatarUrl={artist.avatarUrl}
          coverUrl={artist.coverUrl}
          onAvatarChange={(url) => setArtist((a) => ({ ...a, avatarUrl: url }))}
          onCoverChange={(url) => setArtist((a) => ({ ...a, coverUrl: url }))}
        />

        <ProfileGallerySection
          artistId={artist.id}
          galleryImageUrls={form.watch('galleryImageUrls')}
          onChange={(galleryImageUrls) =>
            form.setValue('galleryImageUrls', galleryImageUrls, { shouldDirty: true })
          }
        />

        {/* 2 — Basic info */}
        <ProfileBasicInfo form={form} disabled={isBusy} />

        {/* 3 — Social links */}
        <ProfileSocialLinks form={form} disabled={isBusy} />

        {/* 4 — SEO */}
        <ProfileSeoSection form={form} disabled={isBusy} username={artist.username} />

        {/* 5 — Additional locale content */}
        <LocalizedProfileContentSection
          form={form}
          disabled={isBusy}
          hasMultiLanguageAccess={hasMultiLanguageAccess}
          billingHref={billingHref}
        />

        {/* Save bar */}
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            {saveStatus === 'success' && (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-green-600">{t('saved')}</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-destructive">{saveError}</span>
              </>
            )}
            {saveStatus === 'idle' && isDirty && (
              <span className="text-muted-foreground">{t('unsaved')}</span>
            )}
          </div>

          <Button type="submit" disabled={isBusy || !isDirty} className="w-full sm:w-auto">
            {isBusy ? t('saving') : t('save')}
          </Button>
        </div>
      </div>
    </form>
  );
}
