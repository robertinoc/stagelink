'use client';

import { useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type {
  AssetDto,
  EpkEditorResponse,
  EpkFeaturedLinkItem,
  EpkFeaturedMediaItem,
  SmartLink,
} from '@stagelink/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { publishArtistEpk, unpublishArtistEpk, updateArtistEpk } from '@/lib/api/epk';
import { EpkImageUploader } from './EpkImageUploader';
import { epkFormSchema, type EpkFormValues } from '../schemas/epk.schema';

interface EpkEditorProps {
  artistId: string;
  username: string;
  initialData: EpkEditorResponse;
  smartLinks: SmartLink[];
  assets: AssetDto[];
}

interface PublishReadiness {
  ready: boolean;
  missing: string[];
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

function evaluatePublishReadiness(values: EpkFormValues): PublishReadiness {
  const missing: string[] = [];

  if (!values.headline?.trim()) missing.push('Headline');
  if (!values.shortBio?.trim()) missing.push('Short bio');
  if (!values.fullBio?.trim()) missing.push('Full bio');

  const hasFeaturedVisualContent =
    values.featuredMedia.some((item) => item.title.trim() && item.url.trim()) ||
    values.galleryImageUrls.length > 0;
  if (!hasFeaturedVisualContent) missing.push('Featured media or gallery image');

  const hasPublicContact = Boolean(
    values.bookingEmail?.trim() || values.managementContact?.trim() || values.pressContact?.trim(),
  );
  if (!hasPublicContact) missing.push('At least one public contact');

  return {
    ready: missing.length === 0,
    missing,
  };
}

export function EpkEditor({
  artistId,
  username,
  initialData,
  smartLinks,
  assets: initialAssets,
}: EpkEditorProps) {
  const [assets, setAssets] = useState<AssetDto[]>(initialAssets);
  const [editorData, setEditorData] = useState(initialData);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishBusy, setPublishBusy] = useState<'publish' | 'unpublish' | null>(null);

  const form = useForm<EpkFormValues>({
    resolver: zodResolver(epkFormSchema),
    defaultValues: {
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

  const featuredMedia = useFieldArray({ control, name: 'featuredMedia' });
  const featuredLinks = useFieldArray({ control, name: 'featuredLinks' });

  const watchedGallery = watch('galleryImageUrls');
  const watchedHeroImageUrl = watch('heroImageUrl');
  const watchedHighlights = watch('highlights');
  const watchedFormValues = watch();
  const inherited = editorData.inherited;
  const publishReadiness = evaluatePublishReadiness(watchedFormValues);

  const availableImageAssets = useMemo(
    () =>
      assets.filter(
        (asset) => asset.kind === 'epk_image' || asset.kind === 'cover' || asset.kind === 'avatar',
      ),
    [assets],
  );

  async function onSubmit(values: EpkFormValues) {
    setSaveStatus('saving');
    setSaveError(null);

    try {
      const updated = await updateArtistEpk(artistId, {
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
      });

      setEditorData(updated);
      reset({
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
      const readiness = evaluatePublishReadiness(getValues());
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

  const sharePath = `/p/${username}/epk`;
  const printPath = `/p/${username}/epk/print`;
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
              Required before publish: {publishReadiness.missing.join(', ')}.
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
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Full bio *</label>
            <Textarea
              rows={8}
              placeholder="Longer artist story, recent releases, background, positioning…"
              {...register('fullBio')}
            />
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

      <Card>
        <CardHeader>
          <CardTitle>Featured media and gallery *</CardTitle>
          <CardDescription>
            Highlight the most relevant embeds and images. Add at least one media item or one
            gallery image before publishing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
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
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Gallery images</h3>
                <p className="text-xs text-muted-foreground">
                  Select up to 6 uploaded assets for the press kit gallery.
                </p>
              </div>
              <Badge variant="outline">{watchedGallery.length}/6</Badge>
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
            Keep this concise: notable releases, press mentions, appearances and the links you want
            bookers to open first.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
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
              {inherited.websiteUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    appendFeaturedLink({
                      id: crypto.randomUUID(),
                      label: 'Website',
                      url: inherited.websiteUrl!,
                    })
                  }
                >
                  Add website
                </Button>
              ) : null}
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
            These fields are public in the EPK. Add at least one contact before publishing, and only
            put contacts you explicitly want to expose.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Booking email</label>
            <Input
              placeholder={inherited.contactEmail ?? 'booking@artist.com'}
              {...register('bookingEmail')}
            />
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
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-white">Availability notes</label>
            <Textarea
              rows={3}
              placeholder="Touring, festival-ready, available for private events…"
              {...register('availabilityNotes')}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-white">Rider summary</label>
            <Textarea
              rows={4}
              placeholder="Optional hospitality or stage notes."
              {...register('riderInfo')}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-white">Tech requirements</label>
            <Textarea
              rows={4}
              placeholder="Optional technical requirements or production notes."
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
          ) : isDirty ? (
            <span className="text-muted-foreground">You have unsaved EPK changes.</span>
          ) : (
            <span className="text-muted-foreground">Public EPK: {sharePath}</span>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save EPK'}
        </Button>
      </div>
    </form>
  );
}
