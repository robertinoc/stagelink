'use client';

import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ARTIST_CATEGORIES,
  ARTIST_CATEGORY_LABELS,
  type ProfileFormValues,
} from '../schemas/profile.schema';

interface ProfileBasicInfoProps {
  form: UseFormReturn<ProfileFormValues>;
  disabled: boolean;
}

const chipClass =
  'relative flex items-center gap-2 rounded-lg border px-3 py-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50';

export function ProfileBasicInfo({ form, disabled }: ProfileBasicInfoProps) {
  const t = useTranslations('dashboard.profile');
  const {
    setValue,
    register,
    formState: { errors },
    watch,
  } = form;

  const bioValue = watch('bio') ?? '';
  const selectedCategories = watch('categories') ?? [];

  function toggleCategory(category: (typeof ARTIST_CATEGORIES)[number]) {
    const next = selectedCategories.includes(category)
      ? selectedCategories.filter((value) => value !== category)
      : selectedCategories.length >= 3
        ? selectedCategories
        : [...selectedCategories, category];
    setValue('categories', next, { shouldDirty: true, shouldValidate: true });
  }

  function categoryNumber(category: (typeof ARTIST_CATEGORIES)[number]): number | null {
    const index = selectedCategories.indexOf(category);
    return index === -1 ? null : index + 1;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('sections.basic')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Artist name */}
        <div className="space-y-1.5">
          <label htmlFor="displayName" className="text-sm font-medium">
            {t('fields.display_name')} <span className="text-destructive">*</span>
          </label>
          <Input
            id="displayName"
            placeholder={t('placeholders.display_name')}
            disabled={disabled}
            {...register('displayName')}
          />
          {errors.displayName && (
            <p className="text-xs text-destructive">{errors.displayName.message}</p>
          )}
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <label htmlFor="bio" className="text-sm font-medium">
            {t('fields.bio')}
          </label>
          <Textarea
            id="bio"
            placeholder={t('placeholders.bio')}
            disabled={disabled}
            className="min-h-[100px]"
            {...register('bio')}
          />
          <div className="flex justify-between">
            {errors.bio ? (
              <p className="text-xs text-destructive">{errors.bio.message}</p>
            ) : (
              <span />
            )}
            <span
              className={`text-xs ${bioValue.length > 480 ? 'text-amber-500' : 'text-muted-foreground'}`}
            >
              {bioValue.length}/500
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {t('fields.category')} <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground">{t('categories.hint')}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{t('categories.selected')}</span>
              <span className="text-muted-foreground">{selectedCategories.length}/3</span>
            </div>
            <div className="mt-3 flex min-h-11 flex-wrap gap-2">
              {selectedCategories.length > 0 ? (
                selectedCategories.map((category, index) => (
                  <span
                    key={`selected-${category}`}
                    className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {index + 1}
                    </span>
                    <span>{ARTIST_CATEGORY_LABELS[category]}</span>
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">{t('categories.empty')}</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ARTIST_CATEGORIES.map((category) => {
              const selectedNumber = categoryNumber(category);
              const blocked = !selectedNumber && selectedCategories.length >= 3;
              return (
                <button
                  key={category}
                  type="button"
                  disabled={disabled || blocked}
                  onClick={() => toggleCategory(category)}
                  className={`${chipClass} ${
                    selectedNumber
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-foreground hover:bg-accent'
                  } ${blocked ? 'opacity-50' : ''}`}
                >
                  {selectedNumber && (
                    <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
                      {selectedNumber}
                    </span>
                  )}
                  <span>{ARTIST_CATEGORY_LABELS[category]}</span>
                </button>
              );
            })}
          </div>
          {errors.categories && (
            <p className="text-xs text-destructive">{errors.categories.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
