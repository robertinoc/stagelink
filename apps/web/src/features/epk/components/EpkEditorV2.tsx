'use client';

// EpkEditorV2 — 4-tab EPK editor using the SL design system.
// Replaces EpkEditor.tsx. Same props, same API surface, no schema changes.
//
// Tabs:
//   1. Identity — hero, bio, headline, highlights, links, location
//   2. Media    — gallery, featured media, record labels
//   3. Booking  — contacts, rider info, tech requirements
//   4. Locales  — EN/ES translations (multi-language entitlement gate)
//
// Bug fix: "Booking info & rider" no longer appears twice. The duplicate was
// caused by EpkEditor rendering it directly AND via LocalizedEpkContentSection.
// EpkEditorV2 renders booking fields only in EpkBookingTab; EpkLocalesTab
// delegates to LocalizedEpkContentSection which still includes the rider
// translations — but the base-language rider fields are now in Booking only.

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { getEpkPublishReadiness } from '@stagelink/types';
import type {
  AssetDto,
  EpkBrand,
  EpkEditorResponse,
  EpkFeaturedLinkItem,
  EpkFeaturedMediaItem,
  EpkTemplateId,
  PlanCode,
  SmartLink,
  UpdateEpkPayload,
} from '@stagelink/types';
import {
  publishArtistEpk,
  unpublishArtistEpk,
  updateArtistEpk,
  updateEpkBrand,
  updateEpkTemplate,
} from '@/lib/api/epk';
import { SectionHeader } from '@/components/sl/SlPrimitives';
import { Btn } from '@/components/sl/Btn';
import { Icon } from '@/components/sl/Icon';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { epkFormSchema, type EpkFormValues } from '../schemas/epk.schema';
import { PublishBanner } from './PublishBanner';
import { EpkTabBar, type EpkTab } from './EpkTabBar';
import { EpkLockedBanner } from './EpkLockedBanner';
import { EpkSaveBar } from './EpkSaveBar';
import { EpkIdentityTab } from './tabs/EpkIdentityTab';
import { EpkMediaTab } from './tabs/EpkMediaTab';
import { EpkBookingTab } from './tabs/EpkBookingTab';
import { EpkLocalesTab } from './tabs/EpkLocalesTab';
import { EpkTemplateTab } from './tabs/EpkTemplateTab';

interface EpkEditorV2Props {
  artistId: string;
  username: string;
  locale: string;
  initialData: EpkEditorResponse;
  smartLinks: SmartLink[];
  assets: AssetDto[];
  hasMultiLanguageAccess: boolean;
  billingHref: string;
  maxVisibleLinks: number;
  userPlan: PlanCode;
}

// ── Helpers (same as EpkEditor.tsx) ──────────────────────────────────────────

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
    .map((item) => ({ ...item, label: labelByUrl.get(item.url) ?? item.label }));
}

function areFeaturedLinksEqual(a: EpkFeaturedLinkItem[], b: EpkFeaturedLinkItem[]) {
  if (a.length !== b.length) return false;
  return a.every(
    (item, i) => item.id === b[i]?.id && item.label === b[i]?.label && item.url === b[i]?.url,
  );
}

function buildLocalizedFieldMap(
  values: Record<'en' | 'es', string | null | undefined>,
): Record<'en' | 'es', string> | undefined {
  const entries = Object.entries(values).filter(([, v]) => v?.trim());
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries.map(([lang, v]) => [lang, v!.trim()])) as Record<
    'en' | 'es',
    string
  >;
}

function buildTranslationsPayload(
  values: EpkFormValues,
): NonNullable<UpdateEpkPayload['translations']> {
  const otherLocale = values.baseLocale === 'en' ? 'es' : 'en';
  const other = values.translations[otherLocale];
  const fields = [
    'headline',
    'shortBio',
    'fullBio',
    'pressQuote',
    'riderInfo',
    'techRequirements',
    'availabilityNotes',
  ] as const;

  const result: NonNullable<UpdateEpkPayload['translations']> = {};
  for (const field of fields) {
    const map = buildLocalizedFieldMap({
      [otherLocale]: other[field],
    } as Record<'en' | 'es', string | null | undefined>);
    if (map) {
      (result as Record<string, unknown>)[field] = map;
    }
  }
  return result;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EpkEditorV2({
  artistId,
  username,
  locale,
  initialData,
  smartLinks,
  assets: _assets,
  hasMultiLanguageAccess,
  billingHref,
  maxVisibleLinks,
  userPlan,
}: EpkEditorV2Props) {
  void _assets;

  const t = useTranslations('dashboard.epk.editor');
  const [editorData, setEditorData] = useState(initialData);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishBusy, setPublishBusy] = useState<'publish' | 'unpublish' | null>(null);
  const [activeTab, setActiveTab] = useState<EpkTab>('identity');

  // Template + brand state — managed separately from react-hook-form (immediate PATCH endpoints)
  const [templateId, setTemplateId] = useState<EpkTemplateId>(
    editorData.epk.templateId ?? 'studio',
  );
  const [brand, setBrand] = useState<EpkBrand | null>(editorData.epk.brand ?? null);
  const [templateSaving, setTemplateSaving] = useState(false);

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
    watch,
    setValue,
    reset,
    handleSubmit,
    getValues,
    formState: { isDirty, isSubmitting },
  } = form;

  const isBusy = isSubmitting || saveStatus === 'saving';
  // EPK is always editable — saving auto-republishes when already published.
  const editorLocked = false;
  const formDisabled = isBusy;

  const watchedGallery = watch('galleryImageUrls');
  const watchedHeroImageUrl = watch('heroImageUrl');
  const watchedFeaturedLinks = watch('featuredLinks');
  const watchedFormValues = watch();
  const inherited = editorData.inherited;

  const displayedCoverImage =
    watchedHeroImageUrl || inherited.coverUrl || inherited.avatarUrl || '';
  const displayedArtistImage = watchedGallery[1] || inherited.avatarUrl || '';
  const publishReadiness = getEpkPublishReadiness(watchedFormValues);

  const profileLinkShortcuts = [
    inherited.spotifyUrl && { label: 'Spotify', url: inherited.spotifyUrl },
    inherited.appleMusicUrl && { label: 'Apple Music', url: inherited.appleMusicUrl },
    inherited.youtubeUrl && { label: 'YouTube', url: inherited.youtubeUrl },
    inherited.soundcloudUrl && { label: 'SoundCloud', url: inherited.soundcloudUrl },
    inherited.instagramUrl && { label: 'Instagram', url: inherited.instagramUrl },
    inherited.tiktokUrl && { label: 'TikTok', url: inherited.tiktokUrl },
    inherited.amazonMusicUrl && { label: 'Amazon Music', url: inherited.amazonMusicUrl },
    inherited.deezerUrl && { label: 'Deezer', url: inherited.deezerUrl },
    inherited.tidalUrl && { label: 'Tidal', url: inherited.tidalUrl },
    inherited.beatportUrl && { label: 'Beatport', url: inherited.beatportUrl },
    inherited.traxsourceUrl && { label: 'Traxsource', url: inherited.traxsourceUrl },
    inherited.websiteUrl && { label: 'Website', url: inherited.websiteUrl },
  ].filter((item): item is { label: string; url: string } => Boolean(item));

  const profileAndSmartLinks = useMemo(
    () =>
      [
        ...profileLinkShortcuts,
        ...smartLinks.map((sl) => ({ label: sl.label, url: `/go/${sl.id}` })),
      ].filter((item, idx, arr) => arr.findIndex((e) => e.url === item.url) === idx),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [smartLinks, inherited],
  );

  const normalizedFeaturedLinks = useMemo(
    () => normalizeFeaturedLinksForProfile(watchedFeaturedLinks, profileAndSmartLinks),
    [profileAndSmartLinks, watchedFeaturedLinks],
  );

  useEffect(() => {
    const current = getValues('featuredLinks') ?? [];
    if (!areFeaturedLinksEqual(current, normalizedFeaturedLinks)) {
      setValue('featuredLinks', normalizedFeaturedLinks, {
        shouldDirty: false,
        shouldTouch: false,
      });
    }
  }, [getValues, normalizedFeaturedLinks, setValue]);

  useUnsavedChangesGuard({
    enabled: isDirty && !editorLocked,
    message:
      locale === 'es'
        ? 'Tenés cambios sin guardar en el Press Kit. ¿Salir de todas formas?'
        : 'You have unsaved changes in your Press Kit. Leave anyway?',
  });

  // ── Template & brand handlers ─────────────────────────────────────────────

  async function handleSelectTemplate(id: EpkTemplateId) {
    if (id === templateId || templateSaving) return;
    setTemplateId(id); // optimistic
    setTemplateSaving(true);
    try {
      const updated = await updateEpkTemplate(artistId, id);
      setEditorData(updated);
      setTemplateId(updated.epk.templateId ?? 'studio');
      setBrand(updated.epk.brand ?? null);
    } catch {
      setTemplateId(templateId); // revert on error
    } finally {
      setTemplateSaving(false);
    }
  }

  async function handleApplyBrand(newBrand: EpkBrand) {
    setTemplateSaving(true);
    try {
      const updated = await updateEpkBrand(artistId, newBrand);
      setEditorData(updated);
      setBrand(updated.epk.brand ?? null);
    } catch {
      // keep current brand on error
    } finally {
      setTemplateSaving(false);
    }
  }

  async function handleResetBrand() {
    setTemplateSaving(true);
    try {
      const updated = await updateEpkBrand(artistId, null);
      setEditorData(updated);
      setBrand(null);
    } catch {
      // keep current brand on error
    } finally {
      setTemplateSaving(false);
    }
  }

  // ── Image handlers ────────────────────────────────────────────────────────

  function setGalleryImageAt(index: number, url: string) {
    const next = [...watchedGallery];
    next[index] = url;
    setValue('galleryImageUrls', next.filter(Boolean), { shouldDirty: true });
  }

  function setCoverImage(url: string) {
    setValue('heroImageUrl', url, { shouldDirty: true });
    setGalleryImageAt(0, url);
  }

  function setAvatarImage(url: string) {
    setGalleryImageAt(1, url);
  }

  // ── Save ──────────────────────────────────────────────────────────────────

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

  // ── Publish ───────────────────────────────────────────────────────────────

  async function togglePublish(nextPublished: boolean) {
    if (nextPublished) {
      const readiness = getEpkPublishReadiness(getValues());
      if (!readiness.ready) {
        setSaveError(
          `Add the required EPK content before publishing: ${readiness.missing.join(', ')}.`,
        );
        return;
      }

      // Save first so all unsaved changes reach the DB before publish reads the record
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

  // ── Paths ─────────────────────────────────────────────────────────────────

  const sharePath = `/${locale}/${username}/epk`;
  const printPath = `/${locale}/${username}/epk/print`;
  // Public-facing URL for the "Copiar URL" button — no protocol prefix shown in UI.
  // Assumes prod domain stagelink.art; on previews shows the same string for design
  // consistency. The clipboard copy adds `https://` at copy time.
  const publicUrl = `stagelink.art/${username}/epk`;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {/* ── Hero header ── */}
      <SectionHeader
        eyebrow={t('header.eyebrow')}
        title={t('header.title')}
        gradient={t('header.gradient')}
        subtitle={t('header.subtitle')}
        className="!px-0 !pt-2"
        right={
          editorData.epk.isPublished ? (
            <>
              <Btn
                size="sm"
                variant="ghost"
                type="button"
                icon={<Icon.Eye size={14} />}
                onClick={() => window.open(sharePath, '_blank', 'noopener,noreferrer')}
              >
                {t('header.viewPublic')}
              </Btn>
              <Btn
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => window.open(printPath, '_blank', 'noopener,noreferrer')}
                icon={
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                }
              >
                {t('header.printView')}
              </Btn>
            </>
          ) : null
        }
      />

      {/* ── Publish banner ── */}
      <PublishBanner
        isPublished={editorData.epk.isPublished}
        publishBusy={publishBusy}
        publishReadiness={publishReadiness}
        sharePath={sharePath}
        publicUrl={publicUrl}
        onToggle={() => togglePublish(!editorData.epk.isPublished)}
      />

      {/* ── Tab bar ── */}
      <EpkTabBar
        activeTab={activeTab}
        onChange={setActiveTab}
        hasMultiLanguageAccess={hasMultiLanguageAccess}
      />

      {/* ── Tab content ── */}
      {activeTab === 'template' && (
        <EpkTemplateTab
          userPlan={userPlan}
          templateId={templateId}
          brand={brand}
          isSaving={templateSaving}
          billingHref={billingHref}
          onSelectTemplate={handleSelectTemplate}
          onApplyBrand={handleApplyBrand}
          onResetBrand={handleResetBrand}
        />
      )}

      {activeTab === 'identity' && (
        <>
          {editorLocked && <EpkLockedBanner />}
          <EpkIdentityTab
            form={form}
            disabled={formDisabled}
            artistId={artistId}
            locale={locale}
            inherited={inherited}
            displayedCoverImage={displayedCoverImage}
            displayedArtistImage={displayedArtistImage}
            onSetCoverImage={setCoverImage}
            onSetAvatarImage={setAvatarImage}
          />
        </>
      )}

      {activeTab === 'media' && (
        <>
          {editorLocked && <EpkLockedBanner />}
          <EpkMediaTab
            form={form}
            disabled={formDisabled}
            artistId={artistId}
            inherited={inherited}
            profileAndSmartLinks={profileAndSmartLinks}
            maxVisibleLinks={maxVisibleLinks}
            billingHref={billingHref}
          />
        </>
      )}

      {activeTab === 'booking' && (
        <>
          {editorLocked && <EpkLockedBanner />}
          <EpkBookingTab form={form} disabled={formDisabled} inherited={inherited} />
        </>
      )}

      {activeTab === 'locales' && (
        <>
          {editorLocked && hasMultiLanguageAccess && <EpkLockedBanner />}
          <EpkLocalesTab
            form={form}
            disabled={formDisabled}
            hasMultiLanguageAccess={hasMultiLanguageAccess}
            billingHref={billingHref}
          />
        </>
      )}

      {/* ── Floating save pill (only when dirty or status non-idle) ── */}
      <EpkSaveBar
        status={saveStatus}
        errorMessage={saveError}
        isDirty={isDirty}
        locked={editorLocked}
        ready={publishReadiness.ready}
        missing={publishReadiness.missing}
        onSave={() => handleSubmit(onSubmit)()}
      />
    </form>
  );
}
