'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { ArtistCategory } from '@stagelink/types';
import type {
  CompleteOnboardingPayload,
  CompleteOnboardingActionResult,
} from '@/lib/api/onboarding';
import { StepAvatar } from './StepAvatar';
import { StepCategory } from './StepCategory';
import { StepName } from './StepName';
import { StepUsername } from './StepUsername';

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
  categories: ArtistCategory[];
}

interface OnboardingWizardProps {
  locale: string;
  completeOnboardingAction: (
    payload: CompleteOnboardingPayload,
  ) => Promise<CompleteOnboardingActionResult>;
}

export function OnboardingWizard({
  locale,
  completeOnboardingAction,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);
  const [data, setData] = useState<WizardState>({
    displayName: '',
    username: '',
    categories: [],
  });
  const [createdArtistId, setCreatedArtistId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const TOTAL_STEPS = 4;

  async function handleCategoryComplete(categories: ArtistCategory[]) {
    setData((prev) => ({ ...prev, categories }));
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const [category, ...secondaryCategories] = categories;
      if (!category) {
        setSubmitError('Choose at least one category to continue.');
        return;
      }

      const result = await completeOnboardingAction({
        displayName: data.displayName,
        username: data.username,
        category,
        secondaryCategories,
      });

      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }

      setCreatedArtistId(result.data.artistId);
      setStep(4);
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
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">StageLink</h1>
          <p className="mt-1 text-sm text-muted-foreground">Let&apos;s set up your artist page</p>
        </div>

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

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          {step === 1 && (
            <StepName
              initialValue={data.displayName}
              onNext={(displayName) => {
                setData((prev) => ({
                  ...prev,
                  displayName,
                  username: prev.username || suggestUsername(displayName),
                }));
                setStep(2);
              }}
            />
          )}

          {step === 2 && (
            <StepUsername
              initialValue={data.username}
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
                    initialValues={data.categories}
                    onNext={handleCategoryComplete}
                    onBack={() => setStep(2)}
                  />
                  {submitError && (
                    <p className="mt-3 text-center text-sm text-destructive">{submitError}</p>
                  )}
                </>
              )}
            </>
          )}

          {step === 4 && createdArtistId && (
            <StepAvatar
              artistId={createdArtistId}
              onComplete={handleAvatarComplete}
              onSkip={handleSkipAvatar}
            />
          )}
        </div>

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
