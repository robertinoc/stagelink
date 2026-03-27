'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StepName } from './StepName';
import { StepUsername } from './StepUsername';
import { StepCategory } from './StepCategory';
import { StepAvatar } from './StepAvatar';
import { completeOnboarding } from '@/lib/api/onboarding';
import type { ArtistCategory } from '@stagelink/types';
import { Loader2 } from 'lucide-react';

/**
 * Suggests a username from a display name.
 * Mirrors backend normalization: lowercase, replace invalid chars with hyphens,
 * strip leading/trailing hyphens, max 30 chars.
 */
function suggestUsername(displayName: string): string {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

type WizardStep = 1 | 2 | 3 | 4;

interface WizardState {
  displayName: string;
  username: string;
  category: ArtistCategory | '';
}

interface OnboardingWizardProps {
  accessToken: string;
  locale: string;
}

export function OnboardingWizard({ accessToken, locale }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);
  const [data, setData] = useState<WizardState>({ displayName: '', username: '', category: '' });
  const [createdArtistId, setCreatedArtistId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const TOTAL_STEPS = 4;

  async function handleCategoryComplete(category: ArtistCategory) {
    setData((prev) => ({ ...prev, category }));
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await completeOnboarding(
        {
          displayName: data.displayName,
          username: data.username,
          category,
        },
        accessToken,
      );
      setCreatedArtistId(result.artistId);
      setStep(4);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAvatarComplete() {
    router.push(`/${locale}/dashboard`);
  }

  function handleSkipAvatar() {
    router.push(`/${locale}/dashboard`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo / Brand */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">StageLink</h1>
          <p className="mt-1 text-sm text-muted-foreground">Let&apos;s set up your artist page</p>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Step {step} of {TOTAL_STEPS}
            </span>
            <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          {step === 1 && (
            <StepName
              initialValue={data.displayName}
              onNext={(displayName) => {
                setData((prev) => ({
                  ...prev,
                  displayName,
                  // Pre-suggest username only if the user hasn't typed one yet
                  username: prev.username || suggestUsername(displayName),
                }));
                setStep(2);
              }}
            />
          )}

          {step === 2 && (
            <StepUsername
              initialValue={data.username}
              accessToken={accessToken}
              onNext={(username) => {
                setData((prev) => ({ ...prev, username }));
                setStep(3);
              }}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && (
            <>
              {isSubmitting ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Creating your artist page…</p>
                </div>
              ) : (
                <>
                  <StepCategory
                    initialValue={data.category}
                    onNext={handleCategoryComplete}
                    onBack={() => setStep(2)}
                  />
                  {submitError && (
                    <p className="mt-3 text-sm text-destructive text-center">{submitError}</p>
                  )}
                </>
              )}
            </>
          )}

          {step === 4 && createdArtistId && (
            <StepAvatar
              artistId={createdArtistId}
              accessToken={accessToken}
              onComplete={handleAvatarComplete}
              onSkip={handleSkipAvatar}
            />
          )}
        </div>

        {/* Step dot indicators */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i + 1 <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
