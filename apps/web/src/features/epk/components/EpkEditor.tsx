'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getEpkPublishReadiness } from '@stagelink/types';
import { ChevronDown, ChevronUp, Star } from 'lucide-react';
import type {
  AssetDto,
  EpkEditorResponse,
  EpkFeaturedLinkItem,
  SmartLink,
  UpdateEpkPayload,
} from '@stagelink/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

function dedupeLinks(items: EpkFeaturedLinkItem[]): EpkFeaturedLinkItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
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
  const [showHowItWorks, setShowHowItWorks] = useState(false);

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

  const isBusy = isSubmitting || saveStatus === 'saving';
  const editorLocked = editorData.epk.isPublished;
  const formDisabled = isBusy || editorLocked;

  const watchedGallery = watch('galleryImageUrls');
  const watchedHeroImageUrl = watch('heroImageUrl');
  const watchedHighlights = watch('highlights');
  const watchedFeaturedLinks = watch('featuredLinks');
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
  const profileAndSmartLinks = useMemo(
    () =>
      [
        ...profileLinkShortcuts,
        ...smartLinks.map((smartLink) => ({
          label: smartLink.label,
          url: `/go/${smartLink.id}`,
        })),
      ].filter(
        (item, index, current) => current.findIndex((entry) => entry.url === item.url) === index,
      ),
    [profileLinkShortcuts, smartLinks],
  );
  const sectionCardClass =
    'border-white/10 bg-white/[0.04] shadow-[0_18px_65px_rgba(10,7,20,0.18)] transition duration-200 hover:border-primary/30 hover:bg-primary/[0.04] hover:shadow-[0_18px_80px_rgba(155,48,208,0.14)]';

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

  function setGalleryImageAt(index: number, url: string) {
    const next = [...watchedGallery];
    next[index] = url;
    setValue('galleryImageUrls', next.filter(Boolean).slice(0, 2), { shouldDirty: true });
  }

  function setHeroImage(url: string) {
    setValue('heroImageUrl', url, { shouldDirty: true });
  }

  function toggleFeaturedLinkVisibility(link: { label: string; url: string }) {
    const exists = watchedFeaturedLinks.some((item) => item.url === link.url);
    if (exists) {
      setValue(
        'featuredLinks',
        watchedFeaturedLinks.filter((item) => item.url !== link.url),
        { shouldDirty: true },
      );
      return;
    }

    setValue(
      'featuredLinks',
      dedupeLinks([
        ...watchedFeaturedLinks,
        {
          id: crypto.randomUUID(),
          label: link.label,
          url: link.url,
        },
      ]),
      { shouldDirty: true },
    );
  }

  function setHighlightedLink(url: string) {
    const existing = watchedFeaturedLinks.find((item) => item.url === url);
    const next = existing
      ? [existing, ...watchedFeaturedLinks.filter((item) => item.url !== url)]
      : [
          {
            id: crypto.randomUUID(),
            label: profileAndSmartLinks.find((item) => item.url === url)?.label ?? 'Link',
            url,
          },
          ...watchedFeaturedLinks,
        ];
    setValue('featuredLinks', dedupeLinks(next), { shouldDirty: true });
  }

  const sharePath = `/${locale}/${username}/epk`;
  const printPath = `/${locale}/${username}/epk/print`;
  const publicRoutesEnabled = editorData.epk.isPublished;

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card className={sectionCardClass}>
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
              <Badge
                variant={editorData.epk.isPublished ? 'secondary' : 'outline'}
                className={editorData.epk.isPublished ? 'bg-emerald-500/90 text-white' : undefined}
              >
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
                      ? 'Unpublish and edit'
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
          {editorLocked ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              This Press Kit is currently published. Unpublish it first if you want to edit the
              fields below.
            </div>
          ) : null}
        </CardHeader>
      </Card>

      <Card className={sectionCardClass}>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setShowHowItWorks((current) => !current)}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>How this Press Kit (EPK) works</CardTitle>
              <CardDescription>
                Keep this as a quick guide. Open it when you need context, hide it when you do not.
              </CardDescription>
            </div>
            <Button type="button" variant="ghost" size="icon">
              {showHowItWorks ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {showHowItWorks ? (
          <CardContent className="pt-0 text-sm text-muted-foreground">
            Your profile is the base. This Press Kit adds the extra material promoters, media, and
            collaborators need. Keep the essentials in Profile, then use this space for the public
            version, practical details, visuals, and the links you want to highlight.
          </CardContent>
        ) : null}
      </Card>

      <Card className={sectionCardClass}>
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
              <Input
                placeholder="Genre, positioning, key context…"
                disabled={formDisabled}
                {...register('headline')}
              />
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
                  disabled={formDisabled}
                  onClick={() => setHeroImage(inherited.coverUrl!)}
                >
                  Use profile cover
                </Button>
              ) : null}
              {inherited.avatarUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={formDisabled}
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
                  disabled={formDisabled}
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
              disabled={formDisabled}
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

      <Card className={sectionCardClass}>
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
              disabled={formDisabled}
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
              disabled={formDisabled}
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
              disabled={formDisabled}
              {...register('pressQuote')}
            />
          </div>
        </CardContent>
      </Card>

      <LocalizedEpkContentSection
        form={form}
        disabled={formDisabled}
        hasMultiLanguageAccess={hasMultiLanguageAccess}
        billingHref={billingHref}
      />

      <Card className={sectionCardClass}>
        <CardHeader>
          <CardTitle>Gallery images</CardTitle>
          <CardDescription>
            Start with your profile cover and avatar. If you want, replace either one with a more
            specific image for this Press Kit (EPK).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="grid gap-4 lg:grid-cols-2">
              {[
                {
                  key: 'cover',
                  title: 'Cover image',
                  fallback: inherited.coverUrl ?? watchedHeroImageUrl,
                  current: watchedGallery[0] ?? inherited.coverUrl ?? watchedHeroImageUrl ?? '',
                  profileLabel: 'Use profile cover',
                  profileValue: inherited.coverUrl,
                  index: 0,
                },
                {
                  key: 'avatar',
                  title: 'Artist avatar',
                  fallback: inherited.avatarUrl,
                  current: watchedGallery[1] ?? inherited.avatarUrl ?? '',
                  profileLabel: 'Use profile avatar',
                  profileValue: inherited.avatarUrl,
                  index: 1,
                },
              ].map((slot) => (
                <div
                  key={slot.key}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">{slot.title}</h3>
                    {slot.profileValue ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={formDisabled}
                        onClick={() => setGalleryImageAt(slot.index, slot.profileValue!)}
                      >
                        {slot.profileLabel}
                      </Button>
                    ) : null}
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    {slot.current ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={slot.current} alt="" className="h-44 w-full object-cover" />
                    ) : (
                      <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
                        No image selected yet.
                      </div>
                    )}
                  </div>
                  <div className="mt-3 space-y-2">
                    <Input
                      placeholder="https://..."
                      disabled={formDisabled}
                      value={slot.current}
                      onChange={(event) => setGalleryImageAt(slot.index, event.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <EpkImageUploader
              artistId={artistId}
              disabled={formDisabled}
              onUploaded={(asset) => {
                setAssets((current) => [asset, ...current]);
                if (asset.deliveryUrl) {
                  const nextIndex = watchedGallery[0] ? 1 : 0;
                  setGalleryImageAt(nextIndex, asset.deliveryUrl);
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className={sectionCardClass}>
        <CardHeader>
          <CardTitle>Highlights and links</CardTitle>
          <CardDescription>
            Start from the links you already keep in Profile. Decide which ones stay visible here,
            and choose one to highlight first.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-[1.4fr,0.8fr,0.8fr] gap-0 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span>Existing links</span>
              <span className="text-center">Visible on my EPK</span>
              <span className="text-center">Highlighted link</span>
            </div>
            {profileAndSmartLinks.map((link) => {
              const visible = watchedFeaturedLinks.some((item) => item.url === link.url);
              const highlighted = watchedFeaturedLinks[0]?.url === link.url;

              return (
                <div
                  key={link.url}
                  className="grid grid-cols-[1.4fr,0.8fr,0.8fr] items-center gap-0 border-b border-white/10 px-4 py-4 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white">{link.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{link.url}</p>
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-white/20"
                      disabled={formDisabled}
                      checked={visible}
                      onChange={() => toggleFeaturedLinkVisibility(link)}
                    />
                  </div>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      disabled={formDisabled}
                      onClick={() => setHighlightedLink(link.url)}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                        highlighted
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-white/15 bg-white/[0.03] text-muted-foreground hover:border-primary/30 hover:text-primary'
                      }`}
                    >
                      <Star className={`h-4 w-4 ${highlighted ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {watchedHighlights.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-white">Career highlights</p>
              {watchedHighlights.map((highlight, index) => (
                <div key={`highlight-${index}`} className="flex gap-2">
                  <Input
                    placeholder="Notable release, venue, quote or press mention"
                    disabled={formDisabled}
                    {...register(`highlights.${index}`)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={formDisabled}
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
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className={sectionCardClass}>
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
              disabled={formDisabled}
              {...register('bookingEmail')}
            />
            {errors.bookingEmail ? (
              <p className="text-xs text-destructive">{errors.bookingEmail.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Management contact</label>
            <Input
              placeholder="Name / email / phone"
              disabled={formDisabled}
              {...register('managementContact')}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Press contact</label>
            <Input
              placeholder="Name / email / phone"
              disabled={formDisabled}
              {...register('pressContact')}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Location / base</label>
            <Input
              placeholder="Buenos Aires, AR"
              disabled={formDisabled}
              {...register('location')}
            />
          </div>
        </CardContent>
      </Card>

      <Card className={sectionCardClass}>
        <CardHeader>
          <CardTitle>Availability, logistics, and rider details</CardTitle>
          <CardDescription>
            Keep the practical information clear and separated so promoters know what is logistics,
            what is artist-side, and what belongs to the technical setup.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Availability and logistics</label>
            <Textarea
              rows={10}
              placeholder="Touring windows, airport transfers, hotel needs, in/out logistics, or event timing notes…"
              disabled={formDisabled}
              {...register('availabilityNotes')}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Artist requirements</label>
            <Textarea
              rows={10}
              placeholder="Hospitality, staff, guest list, catering, dressing room notes, or other artist-side requirements…"
              disabled={formDisabled}
              {...register('riderInfo')}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Technical rider</label>
            <Textarea
              rows={10}
              placeholder="DJ setup, mixers, CDJs, sound system, monitors, lights, screens, stage plot, or production notes…"
              disabled={formDisabled}
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
          ) : editorLocked ? (
            <span className="text-muted-foreground">
              Unpublish this Press Kit (EPK) first to edit and save changes.
            </span>
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
        <Button type="submit" disabled={isSubmitting || !publishReadiness.ready || editorLocked}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
