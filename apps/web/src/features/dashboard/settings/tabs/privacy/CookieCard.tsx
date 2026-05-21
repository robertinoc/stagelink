'use client';

import { Pill } from '@/components/sl/SlPrimitives';
import { cn } from '@/lib/utils';

export type CookieCardState = 'locked' | 'on' | 'off';

interface CookieCardProps {
  label: string;
  description: string;
  state: CookieCardState;
  onChange?: (next: boolean) => void;
  lockedLabel: string;
  activeLabel: string;
  inactiveLabel: string;
  switchAriaLabel: string;
}

/**
 * Card for a single cookie category (necessary / analytics / marketing).
 * `state === 'locked'` shows the 🔒 pill (no toggle). Toggle is a custom
 * 38×22 pill with a sliding knob; gradient fill when on, w10 when off.
 * Wiring to the consent store is done by the parent (PrivacyTab).
 */
export function CookieCard({
  label,
  description,
  state,
  onChange,
  lockedLabel,
  activeLabel,
  inactiveLabel,
  switchAriaLabel,
}: CookieCardProps) {
  const isOn = state === 'on';
  const isLocked = state === 'locked';

  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 rounded-[14px] border bg-[rgba(255,255,255,0.025)] px-[18px] py-4',
        isOn ? 'border-[rgba(224,64,251,0.3)]' : 'border-white/10',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="font-[family-name:var(--font-heading)] text-[14px] font-bold text-white">
          {label}
        </div>
        {isLocked ? (
          <Pill tone="neutral">🔒 {lockedLabel}</Pill>
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={isOn}
            aria-label={switchAriaLabel}
            onClick={() => onChange?.(!isOn)}
            className={cn(
              'relative inline-flex h-[22px] w-[38px] shrink-0 cursor-pointer items-center rounded-full border-0 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E040FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0A1A]',
              isOn
                ? 'bg-[linear-gradient(135deg,#E040FB_0%,#9B30D0_45%,#4A1A8C_100%)]'
                : 'bg-white/10',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'inline-block h-[18px] w-[18px] rounded-full bg-white shadow-md transition-transform duration-150 ease-out',
                isOn ? 'translate-x-[18px]' : 'translate-x-[2px]',
              )}
            />
          </button>
        )}
      </div>
      <p className="text-[12.5px] leading-[1.5] text-white/70">{description}</p>
      {!isLocked && (
        <p
          className={cn(
            'font-[family-name:var(--font-heading)] text-[10.5px] font-bold tracking-[0.5px]',
            isOn ? 'text-[#4ADE80]' : 'text-white/50',
          )}
        >
          {isOn ? `● ${activeLabel}` : `○ ${inactiveLabel}`}
        </p>
      )}
    </div>
  );
}
