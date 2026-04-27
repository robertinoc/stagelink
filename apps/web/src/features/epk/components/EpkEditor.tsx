'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getEpkPublishReadiness } from '@stagelink/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type {
  AssetDto,
  EpkEditorResponse,
  EpkFeaturedLinkItem,
  EpkFeaturedMediaItem,
  EpkGenerateBioResponse,
  SmartLink,
  UpdateEpkPayload,
} from '@stagelink/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { publishArtistEpk, unpublishArtistEpk, updateArtistEpk } from '@/lib/api/epk';
import { EpkBioGenerator } from './EpkBioGenerator';
import { EpkGallerySection } from './EpkGallerySection';
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

function normalizeFeaturedLinksForProfile(
  items: EpkFeaturedLinkItem[],
  availableLinks: { label: string; url: string }[],
): EpkFeaturedLinkItem[] {
  const labelByUrl = new Map(availableLinks.map((item) => [item.url, item.label]));

  return dedupeLinks(items)
    .filter((item) => labelByUrl.has(item.url))
    .map((item) => ({
      ...item,
      label: labelByUrl.get(item.url) ?? item.label,
    }));
}

function areFeaturedLinksEqual(a: EpkFeaturedLinkItem[], b: EpkFeaturedLinkItem[]) {
  if (a.length !== b.length) return false;

  return a.every(
    (item, index) =>
      item.id === b[index]?.id && item.label === b[index]?.label && item.url === b[index]?.url,
  );
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
  void initialAssets;
  const [editorData, setEditorData] = useState(initialData);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [draftMedia, setDraftMedia] = useState<{
    title: string;
    url: string;
    provider: EpkFeaturedMediaItem['provider'];
  } | null>(null);
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
      recordLabels: editorData.epk.recordLabels ?? '',
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
  const watchedFeaturedMedia = watch('featuredMedia');
  const watchedFormValues = watch();
  const inherited = editorData.inherited;
  const displayedCoverImage =
    watchedHeroImageUrl || inherited.coverUrl || inherited.avatarUrl || '';
  const displayedArtistImage = watchedGallery[1] || inherited.avatarUrl || '';
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
  const normalizedFeaturedLinks = useMemo(
    () => normalizeFeaturedLinksForProfile(watchedFeaturedLinks, profileAndSmartLinks),
    [profileAndSmartLinks, watchedFeaturedLinks],
  );
  const sectionCardClass =
    'border-white/10 bg-white/[0.04] shadow-[0_18px_65px_rgba(10,7,20,0.18)] transition duration-200 hover:border-primary/30 hover:bg-primary/[0.04] hover:shadow-[0_18px_80px_rgba(155,48,208,0.14)]';

  useEffect(() => {
    const current = getValues('featuredLinks') ?? [];
    if (!areFeaturedLinksEqual(current, normalizedFeaturedLinks)) {
      setValue('featuredLinks', normalizedFeaturedLinks, {
        shouldDirty: false,
        shouldTouch: false,
      });
    }
  }, [getValues, normalizedFeaturedLinks, setValue]);

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
        featuredLinks: normalizeFeaturedLinksForProfile(values.featuredLinks, profileAndSmartLinks),
        highlights: values.highlights.map((item) => item.trim()).filter(Boolean),
        riderInfo: values.riderInfo || null,
        techRequirements: values.techRequirements || null,
        location: values.location || null,
        availabilityNotes: values.availabilityNotes || null,
        recordLabels: values.recordLabels || null,
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
        recordLabels: normalizeNullable(updated.epk.recordLabels),
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

  /**
   * Fix: save current form state first, then publish.
   * Previously, publish called publishArtistEpk() directly without saving,
   * which meant any unsaved form changes (e.g. newly added media) were lost.
   */
  async function togglePublish(nextPublished: boolean) {
    if (nextPublished) {
      const readiness = getEpkPublishReadiness(getValues());
      if (!readiness.ready) {
        setSaveError(
          `Add the required EPK content before publishing: ${readiness.missing.join(', ')}.`,
        );
        return;
      }

      // Save first so all unsaved changes (including featuredMedia) reach the DB
      // before the publish call reads the stored record.
      const saveOk = await new Promise<boolean>((resolve) => {
        handleSubmit(
          async (values) => {
            await onSubmit(values);
            resolve(true);
          },
          () => resolve(false),
        )();
      });

      if (!saveOk) return;
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
    setValue('galleryImageUrls', next.filter(Boolean), { shouldDirty: true });
  }

  /** Replace extra gallery photos (indices 2+) while keeping the hero/portrait slots. */
  function setExtraGalleryImages(urls: string[]) {
    const systemSlots = watchedGallery.slice(0, 2);
    setValue('galleryImageUrls', [...systemSlots, ...urls].filter(Boolean), { shouldDirty: true });
  }

  function setHeroImage(url: string) {
    setValue('heroImageUrl', url, { shouldDirty: true });
  }

  function setCoverImage(url: string) {
    setHeroImage(url);
    setGalleryImageAt(0, url);
  }

  function setAvatarImage(url: string) {
    setGalleryImageAt(1, url);
  }

  function toggleFeaturedLinkVisibility(link: { label: string; url: string }) {
    const currentLinks = normalizeFeaturedLinksForProfile(
      getValues('featuredLinks') ?? [],
      profileAndSmartLinks,
    );
    const exists = currentLinks.some((item) => item.url === link.url);
    if (exists) {
      setValue(
        'featuredLinks',
        currentLinks.filter((item) => item.url !== link.url),
        { shouldDirty: true, shouldTouch: true },
      );
      return;
    }

    setValue(
      'featuredLinks',
      normalizeFeaturedLinksForProfile(
        [
          ...currentLinks,
          {
            id: crypto.randomUUID(),
            label: link.label,
            url: link.url,
          },
        ],
        profileAndSmartLinks,
      ),
      { shouldDirty: true, shouldTouch: true },
    );
  }

  function detectMediaProvider(url: string): EpkFeaturedMediaItem['provider'] {
    if (url.includes('spotify.com')) return 'spotify';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('soundcloud.com')) return 'soundcloud';
    return 'other';
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

  const sharePath = `/${locale}/${username}/epk`;
  const printPath = `/${locale}/${username}/epk/print`;
  const publicRoutesEnabled = editorData.epk.isPublished;

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* ── Status ── */}
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

      {/* ── How it works ── */}
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

      {/* ── Header and identity ── */}
      <Card className={sectionCardClass}>
        <CardHeader>
          <CardTitle>Header and identity</CardTitle>
          <CardDescription>
            Keep this simple: one hero image and one artist image. Both can start from Profile and
            be replaced here whenever you want.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Hero image</h3>
                  <p className="text-xs text-muted-foreground">
                    Click the image to upload a new cover.
                  </p>
                </div>
                {inherited.coverUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={formDisabled}
                    onClick={() => setCoverImage(inherited.coverUrl!)}
                  >
                    Use profile cover
                  </Button>
                ) : null}
              </div>
              <EpkImageUploader
                artistId={artistId}
                disabled={formDisabled}
                helperText="JPEG, PNG or WebP · max 8 MB"
                onUploaded={(asset) => {
                  if (asset.deliveryUrl) {
                    setCoverImage(asset.deliveryUrl);
                  }
                }}
                renderTrigger={({ open, uploading, disabled }) => (
                  <button
                    type="button"
                    onClick={open}
                    disabled={disabled}
                    className="group relative block w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left transition hover:border-primary/35"
                  >
                    {displayedCoverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={displayedCoverImage}
                        alt="EPK hero preview"
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
                        No hero image selected yet.
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition group-hover:opacity-100">
                      <span className="rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-xs font-medium text-white">
                        {uploading ? 'Uploading…' : 'Replace image'}
                      </span>
                    </div>
                  </button>
                )}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Artist image</h3>
                  <p className="text-xs text-muted-foreground">
                    Click the image to upload a new artist photo.
                  </p>
                </div>
                {inherited.avatarUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={formDisabled}
                    onClick={() => setAvatarImage(inherited.avatarUrl!)}
                  >
                    Use profile avatar
                  </Button>
                ) : null}
              </div>
              <EpkImageUploader
                artistId={artistId}
                disabled={formDisabled}
                helperText="JPEG, PNG or WebP · max 8 MB"
                onUploaded={(asset) => {
                  if (asset.deliveryUrl) {
                    setAvatarImage(asset.deliveryUrl);
                  }
                }}
                renderTrigger={({ open, uploading, disabled }) => (
                  <button
                    type="button"
                    onClick={open}
                    disabled={disabled}
                    className="group relative block w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left transition hover:border-primary/35"
                  >
                    {displayedArtistImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={displayedArtistImage}
                        alt="EPK artist preview"
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
                        No artist image selected yet.
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition group-hover:opacity-100">
                      <span className="rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-xs font-medium text-white">
                        {uploading ? 'Uploading…' : 'Replace image'}
                      </span>
                    </div>
                  </button>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Contacts and practical info ── */}
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

      {/* ── Bio ── */}
      <Card className={sectionCardClass}>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Bio</CardTitle>
              <CardDescription>
                The short bio can stay close to your profile. The full bio is for press-ready
                context.
              </CardDescription>
            </div>
            {!formDisabled ? (
              <div className="shrink-0">
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
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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

      {/* ── Photo gallery ── */}
      <Card className={sectionCardClass}>
        <CardHeader>
          <CardTitle>Photo gallery</CardTitle>
          <CardDescription>
            Add photos to your Press Kit. Pick from your profile gallery or upload new images. These
            appear in the Gallery section of your public Press Kit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EpkGallerySection
            artistId={artistId}
            extraImageUrls={watchedGallery.slice(2)}
            profileGalleryUrls={inherited.profileGalleryUrls}
            onChange={setExtraGalleryImages}
            disabled={formDisabled}
          />
        </CardContent>
      </Card>

      {/* ── Highlights ── */}
      <Card className={sectionCardClass}>
        <CardHeader>
          <CardTitle>Career highlights</CardTitle>
          <CardDescription>
            Notable releases, venues, press mentions, or milestones. Each highlight appears as a
            card on your public EPK.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {editorLocked ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              This Press Kit is published. Click{' '}
              <span className="font-semibold">Unpublish and edit</span> above to make changes.
            </div>
          ) : null}
          {watchedHighlights.length > 0 ? (
            <div className="space-y-3">
              {watchedHighlights.map((_, index) => (
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
          {watchedHighlights.length < 8 && !formDisabled ? (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setValue('highlights', [...watchedHighlights, ''], { shouldDirty: true })
              }
            >
              {watchedHighlights.length === 0 ? 'Add highlight' : 'Add another highlight'}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {/* ── Links ── */}
      <Card className={sectionCardClass}>
        <CardHeader>
          <CardTitle>Links</CardTitle>
          <CardDescription>
            Choose which links from your profile appear in your public Press Kit. All visible links
            are shown as equal pills — no single link is highlighted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {editorLocked ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              This Press Kit is published. Click{' '}
              <span className="font-semibold">Unpublish and edit</span> above to change the visible
              links.
            </div>
          ) : null}
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_16px_50px_rgba(10,7,20,0.18)]">
            <div className="hidden grid-cols-[minmax(0,1fr)_160px] gap-0 border-b border-white/10 bg-white/[0.04] px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45 md:grid">
              <span>Platform</span>
              <span className="text-center">Visible</span>
            </div>
            {profileAndSmartLinks.map((link) => {
              const visible = watchedFeaturedLinks.some((item) => item.url === link.url);

              return (
                <div
                  key={link.url}
                  className="grid gap-4 border-b border-white/10 px-5 py-4 transition hover:bg-white/[0.03] last:border-b-0 md:grid-cols-[minmax(0,1fr)_160px] md:items-center md:gap-0"
                >
                  <div className="min-w-0">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/35 md:hidden">
                      Platform
                    </p>
                    <p className="font-medium text-white">{link.label}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:justify-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/35 md:hidden">
                      Visible
                    </p>
                    <button
                      type="button"
                      disabled={formDisabled}
                      onClick={() => toggleFeaturedLinkVisibility(link)}
                      aria-pressed={visible}
                      className={`inline-flex min-w-[120px] items-center justify-center rounded-full border px-3 py-2 text-xs font-medium transition ${
                        visible
                          ? 'border-primary/40 bg-primary/15 text-white shadow-[0_0_18px_rgba(155,48,208,0.12)]'
                          : 'border-white/12 bg-black/10 text-white/60 hover:border-white/25 hover:text-white'
                      } ${formDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      {visible ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Featured media ── */}
      <Card className={sectionCardClass}>
        <CardHeader>
          <CardTitle>Featured media</CardTitle>
          <CardDescription>
            Add music, video, or audio links from Spotify, YouTube, SoundCloud, or any other
            platform. These appear in the Media section of your public Press Kit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {watchedFeaturedMedia.length > 0 ? (
            <div className="space-y-3">
              {watchedFeaturedMedia.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium text-white">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.url}</p>
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
                      {item.provider === 'soundcloud'
                        ? 'SoundCloud'
                        : item.provider === 'youtube'
                          ? 'YouTube'
                          : item.provider.charAt(0).toUpperCase() + item.provider.slice(1)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={formDisabled}
                    onClick={() => removeFeaturedMediaItem(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          {draftMedia !== null ? (
            <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
              <p className="text-sm font-medium text-white">New media link</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Title</label>
                  <Input
                    placeholder="New Single, Live Set, Album…"
                    value={draftMedia.title}
                    onChange={(e) => setDraftMedia({ ...draftMedia, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">URL</label>
                  <Input
                    placeholder="https://open.spotify.com/…"
                    value={draftMedia.url}
                    onChange={(e) => {
                      const url = e.target.value;
                      setDraftMedia({ ...draftMedia, url, provider: detectMediaProvider(url) });
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Platform</p>
                <div className="flex flex-wrap gap-2">
                  {(['spotify', 'youtube', 'soundcloud', 'other'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setDraftMedia({ ...draftMedia, provider: p })}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        draftMedia.provider === p
                          ? 'border-primary/40 bg-primary/15 text-white shadow-[0_0_14px_rgba(155,48,208,0.12)]'
                          : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:border-primary/30 hover:text-white'
                      }`}
                    >
                      {p === 'soundcloud'
                        ? 'SoundCloud'
                        : p === 'youtube'
                          ? 'YouTube'
                          : p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={!draftMedia.title.trim() || !draftMedia.url.trim()}
                  onClick={confirmDraftMedia}
                >
                  Add
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDraftMedia(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          {watchedFeaturedMedia.length < 6 && draftMedia === null && !formDisabled ? (
            <button
              type="button"
              onClick={() => setDraftMedia({ title: '', url: '', provider: 'other' })}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-primary/[0.05] hover:text-white"
            >
              <span className="text-base leading-none">+</span>
              Add media link
            </button>
          ) : null}

          <p className="text-xs text-muted-foreground">
            {watchedFeaturedMedia.length} of 6 media links added
          </p>
        </CardContent>
      </Card>

      {/* ── Record labels ── */}
      <Card className={sectionCardClass}>
        <CardHeader>
          <CardTitle>Record labels</CardTitle>
          <CardDescription>
            Optional. Add the label or labels the artist is signed to or has released through.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={3}
            placeholder="e.g. Independent / Domino Records / XL Recordings…"
            disabled={formDisabled}
            {...register('recordLabels')}
          />
        </CardContent>
      </Card>

      {/* ── Availability, logistics, and rider ── */}
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

      {/* ── Save bar ── */}
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
