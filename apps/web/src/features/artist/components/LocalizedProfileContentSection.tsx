'use client';

import { useMemo, useState } from 'react';
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

export function LocalizedProfileContentSection({
  form,
  disabled,
  hasMultiLanguageAccess,
  billingHref,
}: LocalizedProfileContentSectionProps) {
  const t = useTranslations('dashboard.profile');
  const [activeLocale, setActiveLocale] = useState<LocaleTab>('es');
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const activeLocaleLabel = useMemo(
    () => t(`translations.locales.${activeLocale}`),
    [activeLocale, t],
  );
  const fieldsDisabled = disabled || !hasMultiLanguageAccess;
  const translatedValues = watch(`translations.${activeLocale}`) ?? {};
  const translatedErrors = errors.translations?.[activeLocale];

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
                  {t(`translations.locales.${locale}`)}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('translations.fallback_note', { locale: activeLocaleLabel })}
          </p>
        </div>

        <div className="grid gap-5">
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
