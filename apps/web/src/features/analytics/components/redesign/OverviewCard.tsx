'use client';

import { Bento, BentoLabel } from '@/components/sl/Bento';
import { Glow } from '@/components/sl/SlPrimitives';
import { Btn } from '@/components/sl/Btn';
import { Eye, Plus } from 'lucide-react';
import { PlatformStat } from './PlatformStat';

interface OverviewCardProps {
  eyebrow: string;
  heroNumber: number;
  heroTotal: number;
  heroSuffix: string;
  body: { plain: string; bold: string; tail: string };
  buttons: { viewSnapshots: string; connect: string };
  stats: Array<{ label: string; value: string; icon: string; hint?: string }>;
}

export function OverviewCard({
  eyebrow,
  heroNumber,
  heroTotal,
  heroSuffix,
  body,
  buttons,
  stats,
}: OverviewCardProps) {
  return (
    <Bento tone="accent" pad={22}>
      <Glow x="100%" y="0%" size={400} />
      <div className="sl-platforms-hero relative z-[1] grid gap-6 sm:grid-cols-[1.2fr_1fr]">
        <div>
          <BentoLabel tint="#E040FB">{eyebrow}</BentoLabel>
          <div
            className="mt-3 font-[family-name:var(--font-heading)] font-bold leading-none tracking-[-0.025em]"
            style={{ fontSize: 'clamp(36px, 5cqw, 52px)' }}
          >
            <span
              style={{
                background: 'linear-gradient(135deg, #fff 0%, #E040FB 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {heroNumber}
            </span>
            <span className="font-normal text-white/50">
              {' '}
              {heroSuffix.replace('{total}', String(heroTotal))}
            </span>
          </div>
          <p className="mt-4 text-[13.5px] leading-[1.55] text-white/70">
            <span className="font-semibold text-white">{body.bold}</span> {body.plain}
            {body.tail && <> {body.tail}</>}
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Btn variant="ghost" icon={<Eye size={14} />}>
              {buttons.viewSnapshots}
            </Btn>
            <Btn variant="outline" icon={<Plus size={14} />}>
              {buttons.connect}
            </Btn>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <PlatformStat
              key={s.label}
              label={s.label}
              value={s.value}
              icon={<span className="text-base">{s.icon}</span>}
              hint={s.hint}
            />
          ))}
        </div>
      </div>
    </Bento>
  );
}
