'use client';

import { useEffect, useMemo, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Globe2, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { autoTranslateLocalizedFields } from '@/lib/api/localization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { EpkFormValues } from '../schemas/epk.schema';

type LocaleTab = 'en' | 'es';

const LOCALE_TABS: LocaleTab[] = ['en', 'es'];

function getDefaultTranslatedLocale(baseLocale: LocaleTab): LocaleTab {
  return LOCALE_TABS.find((locale) => locale !== baseLocale) ?? 'en';
}

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
  const t = useTranslations('dashboard.epk');
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const baseLocale = watch('baseLocale');
  const defaultTranslatedLocale = getDefaultTranslatedLocale(baseLocale);
  const [activeLocale, setActiveLocale] = useState<LocaleTab>(defaultTranslatedLocale);
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
  const activeLocaleLabel = useMemo(
    () => t(`translations.locales.${activeLocale}`),
    [activeLocale, t],
  );
  const baseLocaleLabel = useMemo(() => t(`translations.locales.${baseLocale}`), [baseLocale, t]);
  const fieldsDisabled = disabled || !hasMultiLanguageAccess || activeLocale === baseLocale;
  const translatedValues = watch(`translations.${activeLocale}`) ?? {};
  const translatedErrors = errors.translations?.[activeLocale];
  const [translationStatus, setTranslationStatus] = useState<'idle' | 'loading' | 'success'>(
    'idle',
  );
  const [translationError, setTranslationError] = useState<string | null>(null);

  useEffect(() => {
    if (activeLocale === baseLocale) {
      setActiveLocale(defaultTranslatedLocale);
    }
  }, [activeLocale, baseLocale, defaultTranslatedLocale]);

  useEffect(() => {
    setTranslationStatus('idle');
    setTranslationError(null);
  }, [activeLocale, baseLocale]);

  const localeStatus = useMemo(() => {
    return LOCALE_TABS.reduce<Record<LocaleTab, 'base' | 'complete' | 'incomplete'>>(
      (acc, locale) => {
        if (locale === baseLocale) {
          acc[locale] = 'base';
          return acc;
        }

        const sourceFields = [baseValues[0], baseValues[1], baseValues[2]];
        const translatedFields = [
          translationsValues?.[locale]?.headline,
          translationsValues?.[locale]?.shortBio,
          translationsValues?.[locale]?.fullBio,
        ];
        const complete = sourceFields.every((baseValue, index) => {
          if (!baseValue?.trim()) return true;
          return Boolean(translatedFields[index]?.trim());
        });

        acc[locale] = complete ? 'complete' : 'incomplete';
        return acc;
      },
      { en: 'incomplete', es: 'incomplete' },
    );
  }, [baseLocale, baseValues, translationsValues]);

  async function autoTranslateBaseContentToLocale(locale: LocaleTab) {
    setTranslationStatus('loading');
    setTranslationError(null);

    try {
      const translations = await autoTranslateLocalizedFields({
        sourceLocale: baseLocale,
        targetLocale: locale,
        values: {
          headline: baseValues[0] ?? '',
          shortBio: baseValues[1] ?? '',
          fullBio: baseValues[2] ?? '',
          pressQuote: baseValues[3] ?? '',
          riderInfo: baseValues[4] ?? '',
          techRequirements: baseValues[5] ?? '',
          availabilityNotes: baseValues[6] ?? '',
        },
      });

      setValue(`translations.${locale}.headline`, translations.headline ?? '', {
        shouldDirty: true,
      });
      setValue(`translations.${locale}.shortBio`, translations.shortBio ?? '', {
        shouldDirty: true,
      });
      setValue(`translations.${locale}.fullBio`, translations.fullBio ?? '', { shouldDirty: true });
      setValue(`translations.${locale}.pressQuote`, translations.pressQuote ?? '', {
        shouldDirty: true,
      });
      setValue(`translations.${locale}.riderInfo`, translations.riderInfo ?? '', {
        shouldDirty: true,
      });
      setValue(`translations.${locale}.techRequirements`, translations.techRequirements ?? '', {
        shouldDirty: true,
      });
      setValue(`translations.${locale}.availabilityNotes`, translations.availabilityNotes ?? '', {
        shouldDirty: true,
      });
      setTranslationStatus('success');
    } catch (error) {
      setTranslationStatus('idle');
      setTranslationError(
        error instanceof Error ? error.message : t('translations.auto_translate_error'),
      );
    }
  }

  return (
    <Card className="border-white/10 bg-white/[0.04] shadow-[0_18px_65px_rgba(10,7,20,0.18)] transition duration-200 hover:border-primary/30 hover:bg-primary/[0.04] hover:shadow-[0_18px_80px_rgba(155,48,208,0.14)]">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="h-4 w-4" />
              {t('translations.title')}
            </CardTitle>
            <CardDescription>{t('translations.description')}</CardDescription>
          </div>
          {!hasMultiLanguageAccess && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700">
              <Lock className="h-3.5 w-3.5" />
              {t('translations.lock_badge')}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">{t('translations.base_locale_label')}</p>
            <p className="text-xs text-muted-foreground">
              {t('translations.base_locale_description')}
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
                  {t(`translations.locales.${locale}`)}
                </button>
              );
            })}
          </div>
        </div>

        {!hasMultiLanguageAccess && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-foreground">{t('translations.lock_title')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('translations.lock_description')}
            </p>
            <Button asChild className="mt-3" size="sm">
              <a href={billingHref}>{t('translations.lock_cta')}</a>
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
                  <span>{t(`translations.locales.${locale}`)}</span>
                  <span className="ml-2 text-[11px] uppercase tracking-wide opacity-80">
                    {t(`translations.status.${localeStatus[locale]}`)}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('translations.fallback_note', { locale: activeLocaleLabel })}
          </p>
        </div>

        {activeLocale === baseLocale && (
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground">
              {t('translations.base_edit_title')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('translations.base_edit_description', { locale: activeLocaleLabel })}
            </p>
          </div>
        )}

        {activeLocale !== baseLocale && hasMultiLanguageAccess && (
          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {t('translations.copy_from_base_description', {
                  locale: activeLocaleLabel,
                  sourceLocale: baseLocaleLabel,
                })}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => autoTranslateBaseContentToLocale(activeLocale)}
                disabled={disabled || translationStatus === 'loading'}
              >
                {translationStatus === 'loading'
                  ? t('translations.auto_translate_loading')
                  : t('translations.copy_from_base')}
              </Button>
            </div>
            {translationStatus === 'success' ? (
              <p className="text-xs text-emerald-500">{t('translations.auto_translate_success')}</p>
            ) : null}
            {translationError ? (
              <p className="text-xs text-destructive">{translationError}</p>
            ) : null}
          </div>
        )}

        <div key={activeLocale} className="grid gap-5">
          <div className="space-y-1.5">
            <label
              htmlFor={`translations.${activeLocale}.headline`}
              className="text-sm font-medium"
            >
              {t('fields.headline')}
            </label>
            <Input
              id={`translations.${activeLocale}.headline`}
              placeholder={t('translations.placeholders.headline')}
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
              {t('fields.short_bio')}
            </label>
            <Textarea
              id={`translations.${activeLocale}.shortBio`}
              placeholder={t('translations.placeholders.short_bio')}
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
              {t('fields.full_bio')}
            </label>
            <Textarea
              id={`translations.${activeLocale}.fullBio`}
              placeholder={t('translations.placeholders.full_bio')}
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
              {t('fields.press_quote')}
            </label>
            <Textarea
              id={`translations.${activeLocale}.pressQuote`}
              placeholder={t('translations.placeholders.press_quote')}
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
                {t('fields.availability')}
              </label>
              <Textarea
                id={`translations.${activeLocale}.availabilityNotes`}
                placeholder={t('translations.placeholders.availability')}
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
                {t('fields.rider')}
              </label>
              <Textarea
                id={`translations.${activeLocale}.riderInfo`}
                placeholder={t('translations.placeholders.rider')}
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
              {t('fields.tech_requirements')}
            </label>
            <Textarea
              id={`translations.${activeLocale}.techRequirements`}
              placeholder={t('translations.placeholders.tech_requirements')}
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
