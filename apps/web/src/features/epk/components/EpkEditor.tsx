'use client';

import { useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getEpkPublishReadiness } from '@stagelink/types';
import type {
  AssetDto,
  EpkEditorResponse,
  EpkFeaturedLinkItem,
  EpkFeaturedMediaItem,
  SmartLink,
  UpdateEpkPayload,
} from '@stagelink/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { publishArtistEpk, unpublishArtistEpk, updateArtistEpk } from '@/lib/api/epk';
import { EpkImageUploader } from './EpkImageUploader';
import { LocalizedEpkContentSection } from './LocalizedEpkContentSection';
import { epkFormSchema, type EpkFormValues } from '../schemas/epk.schema';

interface EpkEditorProps {
  artistId: string;
  username: string;
  locale: string;
  initialData: EpkEditorResponse;
  smartLinks: SmartLink[];
  assets: AssetDto[];
  hasMultiLanguageAccess: boolean;
  billingHref: string;
}

function normalizeNullable(value: string | null | undefined): string {
  return value ?? '';
}

function providerFromUrl(url: string): EpkFeaturedMediaItem['provider'] {
  if (url.includes('spotify')) return 'spotify';
  if (url.includes('soundcloud')) return 'soundcloud';
  if (url.includes('youtube') || url.includes('youtu.be')) return 'youtube';
  return 'other';
}

export function EpkEditor({
  artistId,
  username,
  locale,
  initialData,
  smartLinks,
  assets: initialAssets,
  hasMultiLanguageAccess,
  billingHref,
}: EpkEditorProps) {
  const [assets, setAssets] = useState<AssetDto[]>(initialAssets);
  const [editorData, setEditorData] = useState(initialData);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishBusy, setPublishBusy] = useState<'publish' | 'unpublish' | null>(null);

  const form = useForm<EpkFormValues>({
    resolver: zodResolver(epkFormSchema),
    defaultValues: {
      baseLocale: editorData.epk.baseLocale,
      headline: editorData.epk.headline ?? '',
      shortBio: editorData.epk.shortBio ?? '',
      fullBio: editorData.epk.fullBio ?? '',
      pressQuote: editorData.epk.pressQuote ?? '',
      bookingEmail: editorData.epk.bookingEmail ?? '',
      managementContact: editorData.epk.managementContact ?? '',
      pressContact: editorData.epk.pressContact ?? '',
      heroImageUrl: editorData.epk.heroImageUrl ?? '',
      galleryImageUrls: editorData.epk.galleryImageUrls ?? [],
      featuredMedia: editorData.epk.featuredMedia ?? [],
      featuredLinks: editorData.epk.featuredLinks ?? [],
      highlights: editorData.epk.highlights ?? [],
      riderInfo: editorData.epk.riderInfo ?? '',
      techRequirements: editorData.epk.techRequirements ?? '',
      location: editorData.epk.location ?? '',
      availabilityNotes: editorData.epk.availabilityNotes ?? '',
      translations: {
        en: {
          headline: editorData.epk.translations?.headline?.en ?? '',
          shortBio: editorData.epk.translations?.shortBio?.en ?? '',
          fullBio: editorData.epk.translations?.fullBio?.en ?? '',
          pressQuote: editorData.epk.translations?.pressQuote?.en ?? '',
          riderInfo: editorData.epk.translations?.riderInfo?.en ?? '',
          techRequirements: editorData.epk.translations?.techRequirements?.en ?? '',
          availabilityNotes: editorData.epk.translations?.availabilityNotes?.en ?? '',
        },
        es: {
          headline: editorData.epk.translations?.headline?.es ?? '',
          shortBio: editorData.epk.translations?.shortBio?.es ?? '',
          fullBio: editorData.epk.translations?.fullBio?.es ?? '',
          pressQuote: editorData.epk.translations?.pressQuote?.es ?? '',
          riderInfo: editorData.epk.translations?.riderInfo?.es ?? '',
          techRequirements: editorData.epk.translations?.techRequirements?.es ?? '',
          availabilityNotes: editorData.epk.translations?.availabilityNotes?.es ?? '',
        },
      },
    },
  });

  const {
    register,
    control,
    watch,
    setValue,
    reset,
    handleSubmit,
    getValues,
    formState: { isDirty, isSubmitting },
  } = form;
  const {
    formState: { errors },
  } = form;

  const featuredMedia = useFieldArray({ control, name: 'featuredMedia' });
  const featuredLinks = useFieldArray({ control, name: 'featuredLinks' });
  const isBusy = isSubmitting || saveStatus === 'saving';

  const watchedGallery = watch('galleryImageUrls');
  const watchedHeroImageUrl = watch('heroImageUrl');
  const watchedHighlights = watch('highlights');
  const watchedFormValues = watch();
  const inherited = editorData.inherited;
  const publishReadiness = getEpkPublishReadiness(watchedFormValues);
  const profileLinkShortcuts = [
    inherited.spotifyUrl && { label: 'Spotify', url: inherited.spotifyUrl },
    inherited.youtubeUrl && { label: 'YouTube', url: inherited.youtubeUrl },
    inherited.soundcloudUrl && { label: 'SoundCloud', url: inherited.soundcloudUrl },
    inherited.websiteUrl && { label: 'Website', url: inherited.websiteUrl },
    inherited.instagramUrl && { label: 'Instagram', url: inherited.instagramUrl },
    inherited.tiktokUrl && { label: 'TikTok', url: inherited.tiktokUrl },
  ].filter((item): item is { label: string; url: string } => Boolean(item));

  function buildLocalizedFieldMap(
    values: Record<'en' | 'es', string | null | undefined>,
  ): Record<'en' | 'es', string> | undefined {
    const entries = Object.entries(values).filter(([, value]) => value?.trim());
    if (entries.length === 0) return undefined;

    return Object.fromEntries(entries.map(([lang, value]) => [lang, value!.trim()])) as Record<
      'en' | 'es',
      string
    >;
  }

  function buildTranslationsPayload(
    values: EpkFormValues,
  ): NonNullable<UpdateEpkPayload['translations']> {
    const otherLocale = values.baseLocale === 'en' ? 'es' : 'en';

    return {
      ...(buildLocalizedFieldMap({
        [otherLocale]: values.translations[otherLocale].headline,
      } as Record<'en' | 'es', string | null | undefined>) && {
        headline: buildLocalizedFieldMap({
          [otherLocale]: values.translations[otherLocale].headline,
        } as Record<'en' | 'es', string | null | undefined>),
      }),
      ...(buildLocalizedFieldMap({
        [otherLocale]: values.translations[otherLocale].shortBio,
      } as Record<'en' | 'es', string | null | undefined>) && {
        shortBio: buildLocalizedFieldMap({
          [otherLocale]: values.translations[otherLocale].shortBio,
        } as Record<'en' | 'es', string | null | undefined>),
      }),
      ...(buildLocalizedFieldMap({
        [otherLocale]: values.translations[otherLocale].fullBio,
      } as Record<'en' | 'es', string | null | undefined>) && {
        fullBio: buildLocalizedFieldMap({
          [otherLocale]: values.translations[otherLocale].fullBio,
        } as Record<'en' | 'es', string | null | undefined>),
      }),
      ...(buildLocalizedFieldMap({
        [otherLocale]: values.translations[otherLocale].pressQuote,
      } as Record<'en' | 'es', string | null | undefined>) && {
        pressQuote: buildLocalizedFieldMap({
          [otherLocale]: values.translations[otherLocale].pressQuote,
        } as Record<'en' | 'es', string | null | undefined>),
      }),
      ...(buildLocalizedFieldMap({
        [otherLocale]: values.translations[otherLocale].riderInfo,
      } as Record<'en' | 'es', string | null | undefined>) && {
        riderInfo: buildLocalizedFieldMap({
          [otherLocale]: values.translations[otherLocale].riderInfo,
        } as Record<'en' | 'es', string | null | undefined>),
      }),
      ...(buildLocalizedFieldMap({
        [otherLocale]: values.translations[otherLocale].techRequirements,
      } as Record<'en' | 'es', string | null | undefined>) && {
        techRequirements: buildLocalizedFieldMap({
          [otherLocale]: values.translations[otherLocale].techRequirements,
        } as Record<'en' | 'es', string | null | undefined>),
      }),
      ...(buildLocalizedFieldMap({
        [otherLocale]: values.translations[otherLocale].availabilityNotes,
      } as Record<'en' | 'es', string | null | undefined>) && {
        availabilityNotes: buildLocalizedFieldMap({
          [otherLocale]: values.translations[otherLocale].availabilityNotes,
        } as Record<'en' | 'es', string | null | undefined>),
      }),
    };
  }

  const availableImageAssets = useMemo(
    () =>
      assets.filter(
        (asset) => asset.kind === 'epk_image' || asset.kind === 'cover' || asset.kind === 'avatar',
      ),
    [assets],
  );

  async function onSubmit(values: EpkFormValues) {
    const readiness = getEpkPublishReadiness(values);
    if (!readiness.ready) {
      setSaveError(`Add the required EPK content before saving: ${readiness.missing.join(', ')}.`);
      setSaveStatus('error');
      return;
    }

    setSaveStatus('saving');
    setSaveError(null);

    try {
      const updated = await updateArtistEpk(artistId, {
        baseLocale: values.baseLocale,
        headline: values.headline || null,
        shortBio: values.shortBio || null,
        fullBio: values.fullBio || null,
        pressQuote: values.pressQuote || null,
        bookingEmail: values.bookingEmail || null,
        managementContact: values.managementContact || null,
        pressContact: values.pressContact || null,
        heroImageUrl: values.heroImageUrl || null,
        galleryImageUrls: values.galleryImageUrls,
        featuredMedia: values.featuredMedia,
        featuredLinks: values.featuredLinks,
        highlights: values.highlights.map((item) => item.trim()).filter(Boolean),
        riderInfo: values.riderInfo || null,
        techRequirements: values.techRequirements || null,
        location: values.location || null,
        availabilityNotes: values.availabilityNotes || null,
        ...(hasMultiLanguageAccess && {
          translations: buildTranslationsPayload(values),
        }),
      });

      setEditorData(updated);
      reset({
        baseLocale: updated.epk.baseLocale,
        headline: normalizeNullable(updated.epk.headline),
        shortBio: normalizeNullable(updated.epk.shortBio),
        fullBio: normalizeNullable(updated.epk.fullBio),
        pressQuote: normalizeNullable(updated.epk.pressQuote),
        bookingEmail: normalizeNullable(updated.epk.bookingEmail),
        managementContact: normalizeNullable(updated.epk.managementContact),
        pressContact: normalizeNullable(updated.epk.pressContact),
        heroImageUrl: normalizeNullable(updated.epk.heroImageUrl),
        galleryImageUrls: updated.epk.galleryImageUrls,
        featuredMedia: updated.epk.featuredMedia,
        featuredLinks: updated.epk.featuredLinks,
        highlights: updated.epk.highlights,
        riderInfo: normalizeNullable(updated.epk.riderInfo),
        techRequirements: normalizeNullable(updated.epk.techRequirements),
        location: normalizeNullable(updated.epk.location),
        availabilityNotes: normalizeNullable(updated.epk.availabilityNotes),
        translations: {
          en: {
            headline: updated.epk.translations?.headline?.en ?? '',
            shortBio: updated.epk.translations?.shortBio?.en ?? '',
            fullBio: updated.epk.translations?.fullBio?.en ?? '',
            pressQuote: updated.epk.translations?.pressQuote?.en ?? '',
            riderInfo: updated.epk.translations?.riderInfo?.en ?? '',
            techRequirements: updated.epk.translations?.techRequirements?.en ?? '',
            availabilityNotes: updated.epk.translations?.availabilityNotes?.en ?? '',
          },
          es: {
            headline: updated.epk.translations?.headline?.es ?? '',
            shortBio: updated.epk.translations?.shortBio?.es ?? '',
            fullBio: updated.epk.translations?.fullBio?.es ?? '',
            pressQuote: updated.epk.translations?.pressQuote?.es ?? '',
            riderInfo: updated.epk.translations?.riderInfo?.es ?? '',
            techRequirements: updated.epk.translations?.techRequirements?.es ?? '',
            availabilityNotes: updated.epk.translations?.availabilityNotes?.es ?? '',
          },
        },
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save your EPK right now.');
      setSaveStatus('error');
    }
  }

  async function togglePublish(nextPublished: boolean) {
    if (nextPublished) {
      const readiness = getEpkPublishReadiness(getValues());
      if (!readiness.ready) {
        setSaveError(
          `Add the required EPK content before publishing: ${readiness.missing.join(', ')}.`,
        );
        return;
      }
    }
    setPublishBusy(nextPublished ? 'publish' : 'unpublish');
    setSaveError(null);
    try {
      const updated = nextPublished
        ? await publishArtistEpk(artistId)
        : await unpublishArtistEpk(artistId);
      setEditorData(updated);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not update publish state.');
    } finally {
      setPublishBusy(null);
    }
  }

  function appendFeaturedMediaItem(partial: { title: string; url: string }) {
    const current = watch('featuredMedia');
    if (current.some((item) => item.url === partial.url)) return;

    featuredMedia.append({
      id: crypto.randomUUID(),
      title: partial.title,
      url: partial.url,
      provider: providerFromUrl(partial.url),
    });
  }

  function appendFeaturedLink(link: EpkFeaturedLinkItem) {
    const current = watch('featuredLinks');
    if (current.some((item) => item.url === link.url)) return;
    featuredLinks.append(link);
  }

  function toggleGalleryImage(url: string) {
    const current = watch('galleryImageUrls');
    if (current.includes(url)) {
      setValue(
        'galleryImageUrls',
        current.filter((item) => item !== url),
        { shouldDirty: true },
      );
      return;
    }

    if (current.length >= 6) return;
    setValue('galleryImageUrls', [...current, url], { shouldDirty: true });
  }

  function setHeroImage(url: string) {
    setValue('heroImageUrl', url, { shouldDirty: true });
  }

  const sharePath = `/${locale}/${username}/epk`;
  const printPath = `/${locale}/${username}/epk/print`;
  const publicRoutesEnabled = editorData.epk.isPublished;

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>EPK status</CardTitle>
              <CardDescription>
                Draft changes stay private until you publish the EPK. The public page and print view
                only use published content.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={editorData.epk.isPublished ? 'secondary' : 'outline'}>
                {editorData.epk.isPublished ? 'Published' : 'Draft'}
              </Badge>
              <Button
                type="button"
                variant={editorData.epk.isPublished ? 'outline' : 'default'}
                onClick={() => togglePublish(!editorData.epk.isPublished)}
                disabled={publishBusy !== null}
              >
                {publishBusy === 'publish'
                  ? 'Publishing…'
                  : publishBusy === 'unpublish'
                    ? 'Unpublishing…'
                    : editorData.epk.isPublished
                      ? 'Unpublish EPK'
                      : 'Publish EPK'}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!publicRoutesEnabled}
              onClick={() => window.open(sharePath, '_blank', 'noopener,noreferrer')}
            >
              Open public EPK
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!publicRoutesEnabled}
              onClick={() => window.open(printPath, '_blank', 'noopener,noreferrer')}
            >
              Open print view
            </Button>
          </div>
          {!publicRoutesEnabled ? (
            <p className="text-xs text-muted-foreground">
              Publish the EPK first to enable the public page and print view.
            </p>
          ) : null}
          {!publishReadiness.ready ? (
            <p className="text-xs text-muted-foreground">
              Required before save and publish: {publishReadiness.missing.join(', ')}.
            </p>
          ) : null}
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Header and identity</CardTitle>
          <CardDescription>
            Reuse your profile identity, but let the press kit lead with its own headline and hero
            image.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Artist name *</label>
              <Input value={inherited.displayName} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Headline *</label>
              <Input placeholder="Genre, positioning, key context…" {...register('headline')} />
              {errors.headline ? (
                <p className="text-xs text-destructive">{errors.headline.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-white">Hero image</label>
            {watchedHeroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={watchedHeroImageUrl}
                alt="EPK hero preview"
                className="h-48 w-full rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 text-sm text-muted-foreground">
                No hero image selected yet.
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {inherited.coverUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setHeroImage(inherited.coverUrl!)}
                >
                  Use profile cover
                </Button>
              ) : null}
              {inherited.avatarUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setHeroImage(inherited.avatarUrl!)}
                >
                  Use profile avatar
                </Button>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {availableImageAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setHeroImage(asset.deliveryUrl ?? '')}
                  className={`overflow-hidden rounded-2xl border ${
                    watchedHeroImageUrl === asset.deliveryUrl ? 'border-primary' : 'border-white/10'
                  } bg-white/5 text-left transition hover:border-white/30`}
                >
                  {asset.deliveryUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={asset.deliveryUrl} alt="" className="h-28 w-full object-cover" />
                  ) : null}
                  <div className="px-3 py-2 text-xs text-muted-foreground">{asset.kind}</div>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Custom hero image URL</label>
              <Input placeholder="https://..." {...register('heroImageUrl')} />
            </div>
            <EpkImageUploader
              artistId={artistId}
              onUploaded={(asset) => {
                setAssets((current) => [asset, ...current]);
                if (asset.deliveryUrl) {
                  setHeroImage(asset.deliveryUrl);
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bio</CardTitle>
          <CardDescription>
            The short bio can stay close to your profile. The full bio is for press-ready context.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Short bio *</label>
            <Textarea
              rows={4}
              placeholder={inherited.bio ?? 'Short artist summary'}
              {...register('shortBio')}
            />
            {errors.shortBio ? (
              <p className="text-xs text-destructive">{errors.shortBio.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Full bio *</label>
            <Textarea
              rows={8}
              placeholder="Longer artist story, recent releases, background, positioning…"
              {...register('fullBio')}
            />
            {errors.fullBio ? (
              <p className="text-xs text-destructive">{errors.fullBio.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Press quote</label>
            <Textarea
              rows={3}
              placeholder="Optional quote from media, curator or promoter"
              {...register('pressQuote')}
            />
          </div>
        </CardContent>
      </Card>

      <LocalizedEpkContentSection
        form={form}
        disabled={isBusy}
        hasMultiLanguageAccess={hasMultiLanguageAccess}
        billingHref={billingHref}
      />

      <Card>
        <CardHeader>
          <CardTitle>Featured media and gallery *</CardTitle>
          <CardDescription>
            Reuse the media and links you already loaded in your profile, then choose what you want
            to highlight in this Press Kit (EPK). Add at least one media item or one gallery image
            before publishing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Choose from profile platforms</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                You do not need to retype these links. Pick the profile platforms you want to show
                in the featured media section.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {inherited.spotifyUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    appendFeaturedMediaItem({ title: 'Spotify', url: inherited.spotifyUrl! })
                  }
                >
                  Add Spotify
                </Button>
              ) : null}
              {inherited.youtubeUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    appendFeaturedMediaItem({ title: 'YouTube', url: inherited.youtubeUrl! })
                  }
                >
                  Add YouTube
                </Button>
              ) : null}
              {inherited.soundcloudUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    appendFeaturedMediaItem({ title: 'SoundCloud', url: inherited.soundcloudUrl! })
                  }
                >
                  Add SoundCloud
                </Button>
              ) : null}
            </div>
            <div className="space-y-3">
              {featuredMedia.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-2xl border border-white/10 p-4 md:grid-cols-[1fr,1.4fr,auto]"
                >
                  <Input placeholder="Title" {...register(`featuredMedia.${index}.title`)} />
                  <Input placeholder="https://..." {...register(`featuredMedia.${index}.url`)} />
                  <div className="flex items-center gap-2">
                    <select
                      className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white"
                      {...register(`featuredMedia.${index}.provider`)}
                    >
                      <option value="spotify">Spotify</option>
                      <option value="soundcloud">SoundCloud</option>
                      <option value="youtube">YouTube</option>
                      <option value="other">Other</option>
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => featuredMedia.remove(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {featuredMedia.fields.length < 6 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  featuredMedia.append({
                    id: crypto.randomUUID(),
                    title: '',
                    url: '',
                    provider: 'other',
                  })
                }
              >
                Add media item
              </Button>
            ) : null}
            {errors.featuredMedia ? (
              <p className="text-xs text-destructive">{errors.featuredMedia.message as string}</p>
            ) : null}
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Gallery images</h3>
                <p className="text-xs text-muted-foreground">
                  Select up to 6 uploaded assets for the press kit gallery. Your profile cover and
                  avatar are already available here when they exist.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{watchedGallery.length}/6 selected</Badge>
                <Badge variant="secondary">{availableImageAssets.length} available</Badge>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {availableImageAssets.map((asset) => {
                const selected = asset.deliveryUrl
                  ? watchedGallery.includes(asset.deliveryUrl)
                  : false;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => asset.deliveryUrl && toggleGalleryImage(asset.deliveryUrl)}
                    className={`overflow-hidden rounded-2xl border ${
                      selected ? 'border-primary' : 'border-white/10'
                    } bg-white/5 text-left transition hover:border-white/30`}
                  >
                    {asset.deliveryUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={asset.deliveryUrl} alt="" className="h-28 w-full object-cover" />
                    ) : null}
                    <div className="flex items-center justify-between px-3 py-2 text-xs">
                      <span className="text-muted-foreground">{asset.kind}</span>
                      {selected ? <span className="text-primary">Selected</span> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Highlights and links</CardTitle>
          <CardDescription>
            Start from links you already keep in Profile, then decide which ones deserve extra
            attention inside your Press Kit (EPK).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Choose from existing links</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Reuse your profile links and smart links here, instead of loading the same
                destinations twice.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {profileLinkShortcuts.map((link) => (
                <Button
                  key={link.url}
                  type="button"
                  variant="outline"
                  onClick={() =>
                    appendFeaturedLink({
                      id: crypto.randomUUID(),
                      label: link.label,
                      url: link.url,
                    })
                  }
                >
                  Add {link.label}
                </Button>
              ))}
              {smartLinks.map((smartLink) => (
                <Button
                  key={smartLink.id}
                  type="button"
                  variant="outline"
                  onClick={() =>
                    appendFeaturedLink({
                      id: crypto.randomUUID(),
                      label: smartLink.label,
                      url: `${window.location.origin}/go/${smartLink.id}`,
                    })
                  }
                >
                  Add smart link: {smartLink.label}
                </Button>
              ))}
            </div>

            {featuredLinks.fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-2xl border border-white/10 p-4 md:grid-cols-[1fr,1.6fr,auto]"
              >
                <Input placeholder="Label" {...register(`featuredLinks.${index}.label`)} />
                <Input placeholder="https://..." {...register(`featuredLinks.${index}.url`)} />
                <Button type="button" variant="outline" onClick={() => featuredLinks.remove(index)}>
                  Remove
                </Button>
              </div>
            ))}

            {featuredLinks.fields.length < 8 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  featuredLinks.append({
                    id: crypto.randomUUID(),
                    label: '',
                    url: '',
                  })
                }
              >
                Add featured link
              </Button>
            ) : null}
          </div>

          <Separator />

          <div className="space-y-3">
            {watchedHighlights.map((highlight, index) => (
              <div key={`highlight-${index}`} className="flex gap-2">
                <Input
                  placeholder="Notable release, venue, quote or press mention"
                  {...register(`highlights.${index}`)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setValue(
                      'highlights',
                      watchedHighlights.filter((_, itemIndex) => itemIndex !== index),
                      { shouldDirty: true },
                    )
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
            {watchedHighlights.length < 8 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setValue('highlights', [...watchedHighlights, ''], { shouldDirty: true })
                }
              >
                Add highlight
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacts and practical info *</CardTitle>
          <CardDescription>
            These fields are public in the Press Kit (EPK). Add at least one contact before
            publishing, and only expose the information you want bookers and press contacts to see.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Booking email</label>
            <Input
              placeholder={inherited.contactEmail ?? 'booking@artist.com'}
              {...register('bookingEmail')}
            />
            {errors.bookingEmail ? (
              <p className="text-xs text-destructive">{errors.bookingEmail.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Management contact</label>
            <Input placeholder="Name / email / phone" {...register('managementContact')} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Press contact</label>
            <Input placeholder="Name / email / phone" {...register('pressContact')} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Location / base</label>
            <Input placeholder="Buenos Aires, AR" {...register('location')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Availability and logistics</CardTitle>
          <CardDescription>
            Use this for timing, travel, in/out logistics, and any practical notes promoters should
            read before booking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Availability and logistics</label>
            <Textarea
              rows={4}
              placeholder="Touring windows, airport transfers, hotel needs, in/out logistics, or event timing notes…"
              {...register('availabilityNotes')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Artist requirements and technical rider</CardTitle>
          <CardDescription>
            Split what the artist needs from what the technical production needs. This keeps the EPK
            clearer for promoters, production, and hospitality teams.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Artist requirements</label>
            <Textarea
              rows={4}
              placeholder="Hospitality, staff, guest list, catering, dressing room notes, or other artist-side requirements…"
              {...register('riderInfo')}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Technical rider</label>
            <Textarea
              rows={5}
              placeholder="DJ setup, mixers, CDJs, sound system, monitors, lights, screens, stage plot, or production notes…"
              {...register('techRequirements')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          {saveStatus === 'success' ? (
            <span className="text-green-400">EPK saved successfully.</span>
          ) : saveStatus === 'error' ? (
            <span className="text-destructive">{saveError}</span>
          ) : !publishReadiness.ready ? (
            <span className="text-muted-foreground">
              Complete the required EPK fields before saving: {publishReadiness.missing.join(', ')}.
            </span>
          ) : isDirty ? (
            <span className="text-muted-foreground">You have unsaved EPK changes.</span>
          ) : (
            <span className="text-muted-foreground">Public EPK: {sharePath}</span>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting || !publishReadiness.ready}>
          {isSubmitting ? 'Saving…' : 'Save EPK'}
        </Button>
      </div>
    </form>
  );
}
