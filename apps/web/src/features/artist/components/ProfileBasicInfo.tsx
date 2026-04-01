'use client';

import type { UseFormReturn } from 'react-hook-form';
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

// Native <select> — shadcn Select (Radix-based) is not yet installed.
// Tracked as P2 tech debt. This class mirrors shadcn Input styles.
const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

export function ProfileBasicInfo({ form, disabled }: ProfileBasicInfoProps) {
  const {
    register,
    formState: { errors },
    watch,
  } = form;

  const bioValue = watch('bio') ?? '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Artist name */}
        <div className="space-y-1.5">
          <label htmlFor="displayName" className="text-sm font-medium">
            Artist name <span className="text-destructive">*</span>
          </label>
          <Input
            id="displayName"
            placeholder="e.g. The Midnight, DJ Snake, Rosalía…"
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
            Short bio
          </label>
          <Textarea
            id="bio"
            placeholder="Tell your fans a bit about yourself…"
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

        {/* Category */}
        <div className="space-y-1.5">
          <label htmlFor="category" className="text-sm font-medium">
            Category <span className="text-destructive">*</span>
          </label>
          <select
            id="category"
            disabled={disabled}
            className={selectClass}
            {...register('category')}
          >
            {ARTIST_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {ARTIST_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
