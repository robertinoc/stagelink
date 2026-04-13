'use client';

import { useEffect, useMemo, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Globe2, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ProfileFormValues } from '../schemas/profile.schema';

interface LocalizedProfileContentSectionProps {
  form: UseFormReturn<ProfileFormValues>;
  disabled: boolean;
  hasMultiLanguageAccess: boolean;
  billingHref: string;
}

type LocaleTab = 'en' | 'es';

const LOCALE_TABS: LocaleTab[] = ['en', 'es'];

function getDefaultTranslatedLocale(baseLocale: LocaleTab): LocaleTab {
  return LOCALE_TABS.find((locale) => locale !== baseLocale) ?? 'en';
}

export function LocalizedProfileContentSection({
  form,
  disabled,
  hasMultiLanguageAccess,
  billingHref,
}: LocalizedProfileContentSectionProps) {
  const t = useTranslations('dashboard.profile');
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const baseLocale = watch('baseLocale');
  const defaultTranslatedLocale = getDefaultTranslatedLocale(baseLocale);
  const [activeLocale, setActiveLocale] = useState<LocaleTab>(defaultTranslatedLocale);
  const baseValues = watch(['displayName', 'bio', 'seoTitle', 'seoDescription']);
  const translationsValues = watch('translations');
  const activeLocaleLabel = useMemo(
    () => t(`translations.locales.${activeLocale}`),
    [activeLocale, t],
  );
  const fieldsDisabled = disabled || !hasMultiLanguageAccess || activeLocale === baseLocale;
  const translatedValues = watch(`translations.${activeLocale}`) ?? {};
  const translatedErrors = errors.translations?.[activeLocale];

  useEffect(() => {
    if (activeLocale === baseLocale) {
      setActiveLocale(defaultTranslatedLocale);
    }
  }, [activeLocale, baseLocale, defaultTranslatedLocale]);

  const localeStatus = useMemo(() => {
    return LOCALE_TABS.reduce<Record<LocaleTab, 'base' | 'complete' | 'incomplete'>>(
      (acc, locale) => {
        if (locale === baseLocale) {
          acc[locale] = 'base';
          return acc;
        }

        const sourceFields = [baseValues[0], baseValues[1]];
        const translatedFields = [
          translationsValues?.[locale]?.displayName,
          translationsValues?.[locale]?.bio,
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

  function copyBaseContentToLocale(locale: LocaleTab) {
    setValue(`translations.${locale}.displayName`, baseValues[0] ?? '', { shouldDirty: true });
    setValue(`translations.${locale}.bio`, baseValues[1] ?? '', { shouldDirty: true });
    setValue(`translations.${locale}.seoTitle`, baseValues[2] ?? '', { shouldDirty: true });
    setValue(`translations.${locale}.seoDescription`, baseValues[3] ?? '', { shouldDirty: true });
  }

  return (
    <Card>
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
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3">
            <p className="text-sm text-muted-foreground">
              {t('translations.copy_from_base_description', { locale: activeLocaleLabel })}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyBaseContentToLocale(activeLocale)}
              disabled={disabled}
            >
              {t('translations.copy_from_base')}
            </Button>
          </div>
        )}

        <div key={activeLocale} className="grid gap-5">
          <div className="space-y-1.5">
            <label
              htmlFor={`translations.${activeLocale}.displayName`}
              className="text-sm font-medium"
            >
              {t('fields.display_name')}
            </label>
            <Input
              id={`translations.${activeLocale}.displayName`}
              placeholder={t('translations.placeholders.display_name')}
              disabled={fieldsDisabled}
              {...register(`translations.${activeLocale}.displayName`)}
            />
            {translatedErrors?.displayName && (
              <p className="text-xs text-destructive">{translatedErrors.displayName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor={`translations.${activeLocale}.bio`} className="text-sm font-medium">
              {t('fields.bio')}
            </label>
            <Textarea
              id={`translations.${activeLocale}.bio`}
              placeholder={t('translations.placeholders.bio')}
              disabled={fieldsDisabled}
              className="min-h-[100px]"
              {...register(`translations.${activeLocale}.bio`)}
            />
            <div className="flex justify-between">
              {translatedErrors?.bio ? (
                <p className="text-xs text-destructive">{translatedErrors.bio.message}</p>
              ) : (
                <span />
              )}
              <span
                className={`text-xs ${
                  (translatedValues.bio?.length ?? 0) > 480
                    ? 'text-amber-500'
                    : 'text-muted-foreground'
                }`}
              >
                {translatedValues.bio?.length ?? 0}/500
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`translations.${activeLocale}.seoTitle`}
              className="text-sm font-medium"
            >
              {t('fields.seo_title')}
            </label>
            <Input
              id={`translations.${activeLocale}.seoTitle`}
              placeholder={t('translations.placeholders.seo_title')}
              disabled={fieldsDisabled}
              {...register(`translations.${activeLocale}.seoTitle`)}
            />
            <div className="flex justify-between">
              {translatedErrors?.seoTitle ? (
                <p className="text-xs text-destructive">{translatedErrors.seoTitle.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">{t('fields.seo_title_hint')}</p>
              )}
              <span
                className={`text-xs ${
                  (translatedValues.seoTitle?.length ?? 0) > 50
                    ? 'text-amber-500'
                    : 'text-muted-foreground'
                }`}
              >
                {translatedValues.seoTitle?.length ?? 0}/60
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`translations.${activeLocale}.seoDescription`}
              className="text-sm font-medium"
            >
              {t('fields.seo_description')}
            </label>
            <Textarea
              id={`translations.${activeLocale}.seoDescription`}
              placeholder={t('translations.placeholders.seo_description')}
              disabled={fieldsDisabled}
              className="min-h-[80px]"
              {...register(`translations.${activeLocale}.seoDescription`)}
            />
            <div className="flex justify-between">
              {translatedErrors?.seoDescription ? (
                <p className="text-xs text-destructive">
                  {translatedErrors.seoDescription.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">{t('fields.seo_description_hint')}</p>
              )}
              <span
                className={`text-xs ${
                  (translatedValues.seoDescription?.length ?? 0) > 140
                    ? 'text-amber-500'
                    : 'text-muted-foreground'
                }`}
              >
                {translatedValues.seoDescription?.length ?? 0}/160
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
