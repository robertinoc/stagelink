'use client';

import { Bento } from '@/components/sl/Bento';
import { Pill } from '@/components/sl/SlPrimitives';

interface SoundCloudComingSoonProps {
  title: string;
  description: string;
  comingSoonLabel: string;
}

export function SoundCloudComingSoon({
  title,
  description,
  comingSoonLabel,
}: SoundCloudComingSoonProps) {
  return (
    <div style={{ opacity: 0.85 }}>
      <Bento pad={22}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-2xl"
              style={{
                background: 'rgba(255,136,0,0.12)',
                border: '1px solid rgba(255,136,0,0.25)',
              }}
            >
              ☁️
            </span>
            <div>
              <div className="font-[family-name:var(--font-heading)] text-[16px] font-bold text-white">
                {title}
              </div>
              <p className="mt-1 text-[12.5px] text-white/50 max-w-[460px]">{description}</p>
            </div>
          </div>
          <Pill tone="yellow">⏳ {comingSoonLabel}</Pill>
        </div>
      </Bento>
    </div>
  );
}
