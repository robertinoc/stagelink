'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { ProfileFormValues } from '../schemas/profile.schema';

interface ProfileSeoSectionProps {
  form: UseFormReturn<ProfileFormValues>;
  disabled: boolean;
  username: string; // readonly — shown for context
}

const textareaClass =
  'flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none';

export function ProfileSeoSection({ form, disabled, username }: ProfileSeoSectionProps) {
  const {
    register,
    formState: { errors },
    watch,
  } = form;

  const seoTitleValue = watch('seoTitle') ?? '';
  const seoDescValue = watch('seoDescription') ?? '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO & Discoverability</CardTitle>
        <CardDescription>
          Control how your page appears in search results. Defaults to your artist name and bio if
          left empty.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Public URL — readonly */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Your public URL</p>
          <div className="flex h-9 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
            stagelink.co/<span className="font-medium text-foreground">{username}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Username changes require identity verification and are not available yet.
          </p>
        </div>

        {/* SEO title */}
        <div className="space-y-1.5">
          <label htmlFor="seoTitle" className="text-sm font-medium">
            Page title
          </label>
          <Input
            id="seoTitle"
            placeholder={`e.g. "DJ Snake — Official Page"`}
            disabled={disabled}
            {...register('seoTitle')}
          />
          <div className="flex justify-between">
            {errors.seoTitle ? (
              <p className="text-xs text-destructive">{errors.seoTitle.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Recommended: 50–60 characters</p>
            )}
            <span
              className={`text-xs ${seoTitleValue.length > 50 ? 'text-amber-500' : 'text-muted-foreground'}`}
            >
              {seoTitleValue.length}/60
            </span>
          </div>
        </div>

        {/* SEO description */}
        <div className="space-y-1.5">
          <label htmlFor="seoDescription" className="text-sm font-medium">
            Meta description
          </label>
          <textarea
            id="seoDescription"
            placeholder="A short description of your music, style and what fans can find here…"
            disabled={disabled}
            className={textareaClass}
            {...register('seoDescription')}
          />
          <div className="flex justify-between">
            {errors.seoDescription ? (
              <p className="text-xs text-destructive">{errors.seoDescription.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Recommended: 120–160 characters</p>
            )}
            <span
              className={`text-xs ${seoDescValue.length > 140 ? 'text-amber-500' : 'text-muted-foreground'}`}
            >
              {seoDescValue.length}/160
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
