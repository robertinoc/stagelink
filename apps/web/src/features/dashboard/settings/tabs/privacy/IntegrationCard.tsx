import { Pill } from '@/components/sl/SlPrimitives';

export type IntegrationPurposeTone = 'pink' | 'green' | 'yellow' | 'neutral';

interface IntegrationCardProps {
  name: string;
  purpose: string;
  purposeTone: IntegrationPurposeTone;
  description: string;
  note: string;
}

export function IntegrationCard({
  name,
  purpose,
  purposeTone,
  description,
  note,
}: IntegrationCardProps) {
  return (
    <div className="rounded-[12px] border border-white/10 bg-[rgba(255,255,255,0.025)] px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="m-0 font-[family-name:var(--font-heading)] text-[14px] font-bold text-white">
          {name}
        </h4>
        <Pill tone={purposeTone}>{purpose}</Pill>
      </div>
      <p className="mt-2 text-[12.5px] leading-[1.5] text-white/70">{description}</p>
      <p className="mt-2 border-t border-white/10 pt-2 text-[11px] leading-[1.5] text-white/50">
        <span aria-hidden="true" className="text-white/30">
          ↳{' '}
        </span>
        {note}
      </p>
    </div>
  );
}
