// useProfileAutosave — watches form values and debounces saves to the API.
// Returns { saveStatus, triggerSave, triggerDiscard } so the SaveBar can reflect state.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { ProfileFormValues } from '../schemas/profile.schema';
import { updateArtist } from '@/lib/api/artists';
import type { UpdateArtistPayload } from '@/lib/api/artists';

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

const DEBOUNCE_MS = 600;

interface UseProfileAutosaveOptions {
  form: UseFormReturn<ProfileFormValues>;
  artistId: string;
  /** When false, translations are stripped from the payload to avoid a 403 from the billing gate. */
  hasMultiLanguageAccess?: boolean;
  onSaved?: () => void;
  onError?: (err: unknown) => void;
}

export function useProfileAutosave({
  form,
  artistId,
  hasMultiLanguageAccess = false,
  onSaved,
  onError,
}: UseProfileAutosaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<ProfileFormValues | null>(null);

  // Build API payload from form values
  function buildPayload(values: ProfileFormValues): UpdateArtistPayload {
    const [category, ...secondaryCategories] = values.categories;
    const otherLocale = values.baseLocale === 'en' ? 'es' : 'en';

    function loc(field: Record<'en' | 'es', string | undefined>) {
      const entries = Object.entries(field).filter(([, v]) => v?.trim());
      if (!entries.length) return undefined;
      return Object.fromEntries(entries.map(([k, v]) => [k, v!.trim()])) as Record<
        'en' | 'es',
        string
      >;
    }

    const otherTrans = values.translations[otherLocale];
    const translations: UpdateArtistPayload['translations'] = {
      ...(loc({ [otherLocale]: otherTrans.displayName } as Record<
        'en' | 'es',
        string | undefined
      >) && {
        displayName: loc({ [otherLocale]: otherTrans.displayName } as Record<
          'en' | 'es',
          string | undefined
        >),
      }),
      ...(loc({ [otherLocale]: otherTrans.bio } as Record<'en' | 'es', string | undefined>) && {
        bio: loc({ [otherLocale]: otherTrans.bio } as Record<'en' | 'es', string | undefined>),
      }),
      ...(loc({ [otherLocale]: otherTrans.fullBio } as Record<'en' | 'es', string | undefined>) && {
        fullBio: loc({ [otherLocale]: otherTrans.fullBio } as Record<
          'en' | 'es',
          string | undefined
        >),
      }),
      ...(loc({ [otherLocale]: otherTrans.seoTitle } as Record<
        'en' | 'es',
        string | undefined
      >) && {
        seoTitle: loc({ [otherLocale]: otherTrans.seoTitle } as Record<
          'en' | 'es',
          string | undefined
        >),
      }),
      ...(loc({ [otherLocale]: otherTrans.seoDescription } as Record<
        'en' | 'es',
        string | undefined
      >) && {
        seoDescription: loc({ [otherLocale]: otherTrans.seoDescription } as Record<
          'en' | 'es',
          string | undefined
        >),
      }),
    };

    return {
      displayName: values.displayName,
      bio: values.bio || null,
      fullBio: values.fullBio || null,
      baseLocale: values.baseLocale,
      category,
      secondaryCategories,
      tags: values.tags,
      recordLabels: values.recordLabels,
      releases: values.releases,
      epsReleasedCount: values.epsReleasedCount,
      externalCollabsCount: values.externalCollabsCount,
      galleryImageUrls: values.galleryImageUrls,
      instagramUrl: values.instagramUrl || null,
      tiktokUrl: values.tiktokUrl || null,
      youtubeUrl: values.youtubeUrl || null,
      spotifyUrl: values.spotifyUrl || null,
      soundcloudUrl: values.soundcloudUrl || null,
      websiteUrl: values.websiteUrl || null,
      contactEmail: values.contactEmail || null,
      appleMusicUrl: values.appleMusicUrl || null,
      amazonMusicUrl: values.amazonMusicUrl || null,
      deezerUrl: values.deezerUrl || null,
      tidalUrl: values.tidalUrl || null,
      beatportUrl: values.beatportUrl || null,
      traxsourceUrl: values.traxsourceUrl || null,
      seoTitle: values.seoTitle || null,
      seoDescription: values.seoDescription || null,
      // Only send translations if the user's plan includes multi-language pages.
      // Otherwise the backend's billing gate would reject the entire save.
      translations:
        hasMultiLanguageAccess && Object.keys(translations).length ? translations : undefined,
    };
  }

  const doSave = useCallback(
    async (values: ProfileFormValues) => {
      const valid = await form.trigger();
      if (!valid) return;
      setSaveStatus('saving');
      try {
        const payload = buildPayload(values);
        await updateArtist(artistId, payload);
        lastSavedRef.current = values;
        form.reset(values, { keepValues: true });
        setSaveStatus('success');
        onSaved?.();
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        setSaveStatus('error');
        onError?.(err);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [artistId, form],
  );

  // Watch form values and debounce save
  useEffect(() => {
    const sub = form.watch((values) => {
      if (!form.formState.isDirty) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void doSave(values as ProfileFormValues);
      }, DEBOUNCE_MS);
    });
    return () => {
      sub.unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [form, doSave]);

  const triggerSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    void doSave(form.getValues());
  }, [form, doSave]);

  const triggerDiscard = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (lastSavedRef.current) {
      form.reset(lastSavedRef.current);
    } else {
      form.reset();
    }
    setSaveStatus('idle');
  }, [form]);

  return { saveStatus, triggerSave, triggerDiscard };
}
