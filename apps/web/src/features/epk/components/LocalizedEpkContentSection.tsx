'use client';

import { useMemo, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Globe2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { EpkFormValues } from '../schemas/epk.schema';

type LocaleTab = 'en' | 'es';

const LOCALE_LABELS: Record<LocaleTab, string> = {
  en: 'English',
  es: 'Spanish',
};
const LOCALE_STATUS_LABELS: Record<'base' | 'complete' | 'incomplete', string> = {
  base: 'Base',
  complete: 'Ready',
  incomplete: 'Incomplete',
};

const LOCALE_TABS: LocaleTab[] = ['en', 'es'];

interface LocalizedEpkContentSectionProps {
  form: UseFormReturn<EpkFormValues>;
  disabled: boolean;
  hasMultiLanguageAccess: boolean;
  billingHref: string;
}

export function LocalizedEpkContentSection({
  form,
  disabled,
  hasMultiLanguageAccess,
  billingHref,
}: LocalizedEpkContentSectionProps) {
  const [activeLocale, setActiveLocale] = useState<LocaleTab>('en');
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const baseLocale = watch('baseLocale');
  const baseValues = watch([
    'headline',
    'shortBio',
    'fullBio',
    'pressQuote',
    'riderInfo',
    'techRequirements',
    'availabilityNotes',
  ]);
  const translationsValues = watch('translations');
  const activeLocaleLabel = useMemo(() => LOCALE_LABELS[activeLocale], [activeLocale]);
  const fieldsDisabled = disabled || !hasMultiLanguageAccess || activeLocale === baseLocale;
  const translatedValues = watch(`translations.${activeLocale}`) ?? {};
  const translatedErrors = errors.translations?.[activeLocale];
  const localeStatus = useMemo(() => {
    return LOCALE_TABS.reduce<Record<LocaleTab, 'base' | 'complete' | 'incomplete'>>(
      (acc, locale) => {
        if (locale === baseLocale) {
          acc[locale] = 'base';
          return acc;
        }

        const translatedFields = [
          translationsValues?.[locale]?.headline,
          translationsValues?.[locale]?.shortBio,
          translationsValues?.[locale]?.fullBio,
          translationsValues?.[locale]?.pressQuote,
          translationsValues?.[locale]?.riderInfo,
          translationsValues?.[locale]?.techRequirements,
          translationsValues?.[locale]?.availabilityNotes,
        ];
        const complete = baseValues.every((baseValue, index) => {
          if (!baseValue?.trim()) return true;
          return Boolean(translatedFields[index]?.trim());
        });

        acc[locale] = complete ? 'complete' : 'incomplete';
        return acc;
      },
      { en: 'incomplete', es: 'incomplete' },
    );
  }, [baseLocale, baseValues, translationsValues]);

  function copyBaseContentToLocale(locale: LocaleTab) {
    setValue(`translations.${locale}.headline`, baseValues[0] ?? '', { shouldDirty: true });
    setValue(`translations.${locale}.shortBio`, baseValues[1] ?? '', { shouldDirty: true });
    setValue(`translations.${locale}.fullBio`, baseValues[2] ?? '', { shouldDirty: true });
    setValue(`translations.${locale}.pressQuote`, baseValues[3] ?? '', { shouldDirty: true });
    setValue(`translations.${locale}.riderInfo`, baseValues[4] ?? '', { shouldDirty: true });
    setValue(`translations.${locale}.techRequirements`, baseValues[5] ?? '', { shouldDirty: true });
    setValue(`translations.${locale}.availabilityNotes`, baseValues[6] ?? '', {
      shouldDirty: true,
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="h-4 w-4" />
              Localized EPK content
            </CardTitle>
            <CardDescription>
              Add locale-specific EPK copy for public routes. Base EPK fields above remain the
              fallback.
            </CardDescription>
          </div>
          {!hasMultiLanguageAccess && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700">
              <Lock className="h-3.5 w-3.5" />
              Pro+
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Base content language</p>
            <p className="text-xs text-muted-foreground">
              Choose the language your main EPK fields are written in. If another locale is
              incomplete, public EPK routes fall back to this base content.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {LOCALE_TABS.map((locale) => {
              const selected = locale === baseLocale;
              return (
                <button
                  key={locale}
                  type="button"
                  onClick={() => form.setValue('baseLocale', locale, { shouldDirty: true })}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    selected
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {LOCALE_LABELS[locale]}
                </button>
              );
            })}
          </div>
        </div>

        {!hasMultiLanguageAccess && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-foreground">Unlock localized EPK copy</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Additional locales are available on Pro+. Your base EPK stays available, but
              locale-specific public EPK content needs the multi-language pages feature.
            </p>
            <Button asChild className="mt-3" size="sm">
              <a href={billingHref}>Upgrade plan</a>
            </Button>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {LOCALE_TABS.map((locale) => {
              const selected = locale === activeLocale;
              return (
                <button
                  key={locale}
                  type="button"
                  onClick={() => setActiveLocale(locale)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    selected
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{LOCALE_LABELS[locale]}</span>
                  <span className="ml-2 text-[11px] uppercase tracking-wide opacity-80">
                    {LOCALE_STATUS_LABELS[localeStatus[locale]]}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {activeLocaleLabel} visitors will see this copy when it exists. Otherwise StageLink
            falls back to your base EPK content.
          </p>
        </div>

        {activeLocale === baseLocale && (
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground">This is your base EPK locale</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Edit the main EPK fields above to update {activeLocaleLabel}. Additional locale tabs
              are only for translated variants.
            </p>
          </div>
        )}

        {activeLocale !== baseLocale && hasMultiLanguageAccess && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3">
            <p className="text-sm text-muted-foreground">
              Start from your base EPK copy and adapt it for {activeLocaleLabel}.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyBaseContentToLocale(activeLocale)}
              disabled={disabled}
            >
              Copy base content
            </Button>
          </div>
        )}

        <div key={activeLocale} className="grid gap-5">
          <div className="space-y-1.5">
            <label
              htmlFor={`translations.${activeLocale}.headline`}
              className="text-sm font-medium"
            >
              Headline
            </label>
            <Input
              id={`translations.${activeLocale}.headline`}
              placeholder="Genre, positioning, key context…"
              disabled={fieldsDisabled}
              {...register(`translations.${activeLocale}.headline`)}
            />
            {translatedErrors?.headline && (
              <p className="text-xs text-destructive">{translatedErrors.headline.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`translations.${activeLocale}.shortBio`}
              className="text-sm font-medium"
            >
              Short bio
            </label>
            <Textarea
              id={`translations.${activeLocale}.shortBio`}
              placeholder="Localized short bio for this locale"
              disabled={fieldsDisabled}
              className="min-h-[100px]"
              {...register(`translations.${activeLocale}.shortBio`)}
            />
            <div className="flex justify-between">
              {translatedErrors?.shortBio ? (
                <p className="text-xs text-destructive">{translatedErrors.shortBio.message}</p>
              ) : (
                <span />
              )}
              <span
                className={`text-xs ${
                  (translatedValues.shortBio?.length ?? 0) > 480
                    ? 'text-amber-500'
                    : 'text-muted-foreground'
                }`}
              >
                {translatedValues.shortBio?.length ?? 0}/500
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor={`translations.${activeLocale}.fullBio`} className="text-sm font-medium">
              Full bio
            </label>
            <Textarea
              id={`translations.${activeLocale}.fullBio`}
              placeholder="Longer localized artist story for this locale"
              disabled={fieldsDisabled}
              className="min-h-[180px]"
              {...register(`translations.${activeLocale}.fullBio`)}
            />
            <div className="flex justify-between">
              {translatedErrors?.fullBio ? (
                <p className="text-xs text-destructive">{translatedErrors.fullBio.message}</p>
              ) : (
                <span />
              )}
              <span
                className={`text-xs ${
                  (translatedValues.fullBio?.length ?? 0) > 4800
                    ? 'text-amber-500'
                    : 'text-muted-foreground'
                }`}
              >
                {translatedValues.fullBio?.length ?? 0}/5000
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`translations.${activeLocale}.pressQuote`}
              className="text-sm font-medium"
            >
              Press quote
            </label>
            <Textarea
              id={`translations.${activeLocale}.pressQuote`}
              placeholder="Optional localized quote from media, curator or promoter"
              disabled={fieldsDisabled}
              className="min-h-[80px]"
              {...register(`translations.${activeLocale}.pressQuote`)}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor={`translations.${activeLocale}.availabilityNotes`}
                className="text-sm font-medium"
              >
                Availability
              </label>
              <Textarea
                id={`translations.${activeLocale}.availabilityNotes`}
                placeholder="Localized availability notes"
                disabled={fieldsDisabled}
                className="min-h-[140px]"
                {...register(`translations.${activeLocale}.availabilityNotes`)}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={`translations.${activeLocale}.riderInfo`}
                className="text-sm font-medium"
              >
                Rider
              </label>
              <Textarea
                id={`translations.${activeLocale}.riderInfo`}
                placeholder="Localized rider details"
                disabled={fieldsDisabled}
                className="min-h-[140px]"
                {...register(`translations.${activeLocale}.riderInfo`)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`translations.${activeLocale}.techRequirements`}
              className="text-sm font-medium"
            >
              Tech requirements
            </label>
            <Textarea
              id={`translations.${activeLocale}.techRequirements`}
              placeholder="Localized technical requirements"
              disabled={fieldsDisabled}
              className="min-h-[160px]"
              {...register(`translations.${activeLocale}.techRequirements`)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
