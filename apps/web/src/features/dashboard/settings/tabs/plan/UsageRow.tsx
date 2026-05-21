import { cn } from '@/lib/utils';

interface UsageRowProps {
  label: string;
  value: number;
  /** `null` = unlimited (renders striped magenta fill at 100%) */
  max: number | null;
  /** Optional unit (e.g. "MB") shown next to the numeric value */
  unit?: string;
  /** Human-friendly max label (e.g. "2 GB") shown after `/` */
  maxLabel?: string;
}

/**
 * Single row inside the Plan tab usage panel. Pass `max = null` for
 * unlimited counters (Smart Links resolutions, languages on Pro+) to
 * trigger the striped fill that signals infinity.
 */
export function UsageRow({ label, value, max, unit, maxLabel }: UsageRowProps) {
  const isUnlimited = max === null;
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const safeMax = isUnlimited ? 0 : Math.max(0, max);
  const pct = isUnlimited
    ? 100
    : safeMax === 0
      ? 0
      : Math.min(100, (safeValue / safeMax) * 100);
  const isOver = !isUnlimited && safeValue > safeMax;

  const valueText = isUnlimited
    ? `${formatNumber(safeValue)} / ∞`
    : `${formatNumber(safeValue)}${unit ? ` ${unit}` : ''} / ${maxLabel ?? formatNumber(safeMax)}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12px] text-white/70">{label}</span>
        <span className="font-[family-name:var(--font-heading)] text-[12px] font-semibold text-white">
          {valueText}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={isUnlimited ? 100 : safeMax}
        aria-valuenow={isUnlimited ? safeMax : Math.min(safeValue, safeMax)}
        aria-label={label}
        className="h-[6px] w-full overflow-hidden rounded-[3px] bg-white/[0.06]"
      >
        <div
          className={cn(
            'h-full transition-[width] duration-300 ease-out',
            isUnlimited
              ? 'bg-[repeating-linear-gradient(45deg,rgba(224,64,251,0.5)_0_8px,rgba(224,64,251,0.2)_8px_16px)]'
              : isOver
                ? 'bg-[linear-gradient(135deg,#ff6b6b_0%,#9B30D0_100%)]'
                : 'bg-[linear-gradient(135deg,#E040FB_0%,#9B30D0_45%,#4A1A8C_100%)]',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}
