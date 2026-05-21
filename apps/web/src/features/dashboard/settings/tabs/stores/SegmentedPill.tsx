'use client';

import { cn } from '@/lib/utils';

interface SegmentedPillOption<TValue extends string> {
  value: TValue;
  label: string;
}

interface SegmentedPillProps<TValue extends string> {
  options: ReadonlyArray<SegmentedPillOption<TValue>>;
  value: TValue;
  onChange: (value: TValue) => void;
  ariaLabel: string;
  className?: string;
}

/**
 * Segmented control rendered as a single pill (e.g. Shopify "Colección /
 * Productos individuales"). The active option gets the magenta gradient
 * fill; idle options stay transparent on the panel background.
 */
export function SegmentedPill<TValue extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedPillProps<TValue>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1',
        className,
      )}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(opt.value)}
            className={cn(
              'cursor-pointer rounded-full border-0 px-4 py-1.5 text-[12px] font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E040FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0A1A]',
              isActive
                ? 'bg-[linear-gradient(135deg,#E040FB_0%,#9B30D0_45%,#4A1A8C_100%)] text-white'
                : 'bg-transparent text-white/60 hover:text-white',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
