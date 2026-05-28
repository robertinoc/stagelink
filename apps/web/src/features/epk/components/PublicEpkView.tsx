// PublicEpkView — server entry point that routes to the correct template.
// Template selection is based on epk.templateId (studio | cinematic | brutalist).
// printMode is forwarded to each template for print-specific layouts.

import type { PublicEpkResponse, SupportedLocale } from '@stagelink/types';
import { DEFAULT_LOCALE } from '@stagelink/types';
import { EpkStudioTemplate } from './templates/EpkStudioTemplate';
import { EpkCinematicTemplate } from './templates/EpkCinematicTemplate';
import { EpkBrutalistTemplate } from './templates/EpkBrutalistTemplate';

interface PublicEpkViewProps {
  epk: PublicEpkResponse;
  printMode?: boolean;
  locale?: SupportedLocale;
}

export function PublicEpkView({
  epk,
  printMode = false,
  locale = DEFAULT_LOCALE,
}: PublicEpkViewProps) {
  const templateId = epk.templateId ?? 'studio';

  switch (templateId) {
    case 'cinematic':
      return <EpkCinematicTemplate epk={epk} locale={locale} printMode={printMode} />;
    case 'brutalist':
      return <EpkBrutalistTemplate epk={epk} locale={locale} printMode={printMode} />;
    case 'studio':
    default:
      return <EpkStudioTemplate epk={epk} locale={locale} printMode={printMode} />;
  }
}
