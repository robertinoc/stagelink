'use client';

// Tab 4 — Languages / Locales
// Thin wrapper around LocalizedEpkContentSection.
// Only shown when hasMultiLanguageAccess is true.

import type { UseFormReturn } from 'react-hook-form';
import { LocalizedEpkContentSection } from '../LocalizedEpkContentSection';
import type { EpkFormValues } from '../../schemas/epk.schema';

interface EpkLocalesTabProps {
  form: UseFormReturn<EpkFormValues>;
  disabled: boolean;
  hasMultiLanguageAccess: boolean;
  billingHref: string;
}

export function EpkLocalesTab({
  form,
  disabled,
  hasMultiLanguageAccess,
  billingHref,
}: EpkLocalesTabProps) {
  return (
    <LocalizedEpkContentSection
      form={form}
      disabled={disabled}
      hasMultiLanguageAccess={hasMultiLanguageAccess}
      billingHref={billingHref}
    />
  );
}
