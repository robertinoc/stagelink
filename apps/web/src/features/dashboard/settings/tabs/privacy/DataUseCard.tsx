import { Pill } from '@/components/sl/SlPrimitives';

export type DataUseTone = 'green' | 'yellow' | 'blue' | 'neutral';

interface DataUseCardProps {
  icon: string;
  label: string;
  tag: string;
  tone: DataUseTone;
  description: string;
}

export function DataUseCard({ icon, label, tag, tone, description }: DataUseCardProps) {
  return (
    <div className="rounded-[14px] border border-white/10 bg-[rgba(255,255,255,0.025)] px-[18px] py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="text-base">
            {icon}
          </span>
          <span className="text-[13.5px] font-semibold text-white">{label}</span>
        </div>
        <Pill tone={tone}>{tag}</Pill>
      </div>
      <p className="mt-2 text-[12.5px] leading-[1.55] text-white/70">{description}</p>
    </div>
  );
}
