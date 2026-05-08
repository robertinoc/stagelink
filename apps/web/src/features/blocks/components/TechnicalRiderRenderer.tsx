import { useTranslations } from 'next-intl';
import type { TechnicalRiderBlockConfig } from '@stagelink/types';

interface TechnicalRiderRendererProps {
  title: string | null;
  config: TechnicalRiderBlockConfig;
}

export function TechnicalRiderRenderer({ title, config }: TechnicalRiderRendererProps) {
  if (!config.riderInfo && !config.techRequirements) {
    return null;
  }

  const t = useTranslations('blocks.renderer.technical_rider');

  return (
    <div className="neon-card-border rounded-[1.5rem] p-[1px]">
      <section className="rounded-[1.4rem] bg-[#0b0614] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
          {title ?? t('section_label')}
        </p>
        <div className="mt-4 space-y-6">
          {config.riderInfo && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-400">
                {t('rider_info_label')}
              </p>
              <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-200 sm:text-base">
                {config.riderInfo}
              </p>
            </div>
          )}
          {config.techRequirements && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-400">
                {t('tech_requirements_label')}
              </p>
              <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-200 sm:text-base">
                {config.techRequirements}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
