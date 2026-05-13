'use client';

import { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  acceptAllConsent,
  getConsentPreferences,
  hasConsentChoice,
  rejectNonEssentialConsent,
  setConsentPreferences,
  type ConsentPreferences,
} from '@/lib/analytics/consent';
import { cn } from '@/lib/utils';

type OptionalCategory = Exclude<keyof ConsentPreferences, 'necessary'>;

const OPTIONAL_CATEGORIES: OptionalCategory[] = ['analytics', 'marketing'];

export function ConsentManager() {
  const t = useTranslations('privacy.consent');
  const [ready, setReady] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const savedPreferences = getConsentPreferences();
    setPreferences(savedPreferences);
    setBannerVisible(!hasConsentChoice());
    setReady(true);
  }, []);

  if (!ready) return null;

  function acceptAll() {
    const record = acceptAllConsent();
    setPreferences(record.categories);
    setBannerVisible(false);
    setPreferencesOpen(false);
  }

  function rejectNonEssential() {
    const record = rejectNonEssentialConsent();
    setPreferences(record.categories);
    setBannerVisible(false);
    setPreferencesOpen(false);
  }

  function savePreferences() {
    const record = setConsentPreferences(preferences);
    setPreferences(record.categories);
    setBannerVisible(false);
    setPreferencesOpen(false);
  }

  function toggleCategory(category: OptionalCategory) {
    setPreferences((current) => ({
      ...current,
      [category]: !current[category],
    }));
  }

  return (
    <>
      {bannerVisible ? (
        <div
          role="region"
          aria-label={t('banner_label')}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/85 px-4 py-4 text-white shadow-2xl backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold">{t('title')}</p>
              <p className="mt-1 text-sm leading-6 text-white/72">{t('description')}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button type="button" variant="ghost" size="sm" onClick={rejectNonEssential}>
                {t('reject')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreferencesOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                {t('customize')}
              </Button>
              <Button type="button" size="sm" onClick={acceptAll}>
                {t('accept')}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="fixed bottom-4 right-4 z-40 bg-black/75 text-white shadow-lg backdrop-blur-md hover:bg-black/85"
          onClick={() => setPreferencesOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {t('settings')}
        </Button>
      )}

      <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border border-white/10 bg-[#101015] text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('modal_title')}</DialogTitle>
            <DialogDescription className="text-white/68">
              {t('modal_description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <ConsentCategoryRow
              title={t('categories.necessary.title')}
              description={t('categories.necessary.description')}
              legalBasis={t('categories.necessary.legal_basis')}
              checked
              disabled
              onToggle={() => undefined}
            />

            {OPTIONAL_CATEGORIES.map((category) => (
              <ConsentCategoryRow
                key={category}
                title={t(`categories.${category}.title`)}
                description={t(`categories.${category}.description`)}
                legalBasis={t(`categories.${category}.legal_basis`)}
                checked={preferences[category]}
                onToggle={() => toggleCategory(category)}
              />
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="ghost" onClick={rejectNonEssential}>
              {t('reject')}
            </Button>
            <Button type="button" variant="outline" onClick={savePreferences}>
              {t('save')}
            </Button>
            <Button type="button" onClick={acceptAll}>
              {t('accept')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ConsentCategoryRowProps {
  title: string;
  description: string;
  legalBasis: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

function ConsentCategoryRow({
  title,
  description,
  legalBasis,
  checked,
  disabled = false,
  onToggle,
}: ConsentCategoryRowProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm leading-6 text-white/68">{description}</p>
          <p className="mt-2 text-xs leading-5 text-white/48">{legalBasis}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={onToggle}
          className={cn(
            'relative mt-1 h-6 w-11 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
            checked ? 'border-primary bg-primary' : 'border-white/20 bg-white/10',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          <span
            className={cn(
              'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white transition-transform',
              checked ? 'translate-x-4' : 'translate-x-1',
            )}
          />
        </button>
      </div>
    </div>
  );
}
