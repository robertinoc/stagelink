'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ProfileFormValues } from '../schemas/profile.schema';

interface ProfileSeoSectionProps {
  form: UseFormReturn<ProfileFormValues>;
  disabled: boolean;
  username: string; // readonly — shown for context
}

/**
 * Derives the public base URL from the environment variable.
 * Falls back to 'stagelink.co' so the display is always meaningful.
 * The full URL is shown as read-only context — it is not editable here.
 */
function getPublicHost(): string {
  const raw = process.env['NEXT_PUBLIC_APP_URL'] ?? '';
  try {
    return new URL(raw).host;
  } catch {
    return 'stagelink.co';
  }
}

const PUBLIC_HOST = getPublicHost();

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
            {PUBLIC_HOST}/<span className="font-medium text-foreground">{username}</span>
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
          <Textarea
            id="seoDescription"
            placeholder="A short description of your music, style and what fans can find here…"
            disabled={disabled}
            className="min-h-[80px]"
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
