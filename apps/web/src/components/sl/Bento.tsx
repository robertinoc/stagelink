import { cn } from '@/lib/utils';

// ── Bento card primitive ────────────────────────────────────────────────────
// Five tones that map to the SL design system.
// panel  — default frosted glass card
// accent — soft purple tint (feature highlight)
// pink   — solid gradient (primary CTA card)
// blue   — cyan-tinted (info/link card)
// green  — green-tinted (success/live card)

type BentoTone = 'panel' | 'accent' | 'pink' | 'blue' | 'green';

interface BentoProps {
  children: React.ReactNode;
  tone?: BentoTone;
  id?: string;
  /** Padding in px — defaults to 24 */
  pad?: number;
  /** Glow shadow on the card */
  glow?: boolean;
  className?: string;
}

const BG: Record<BentoTone, string> = {
  panel: 'bg-[rgba(255,255,255,0.025)]',
  accent: 'bg-[linear-gradient(160deg,rgba(155,48,208,0.18)_0%,rgba(74,26,140,0.04)_100%)]',
  pink: 'bg-[linear-gradient(135deg,#9B30D0_0%,#4A1A8C_100%)]',
  blue: 'bg-[linear-gradient(160deg,rgba(0,212,255,0.14)_0%,rgba(74,144,255,0.04)_100%)]',
  green: 'bg-[linear-gradient(160deg,rgba(74,222,128,0.14)_0%,rgba(34,180,90,0.04)_100%)]',
};

const BORDER: Record<BentoTone, string> = {
  panel: 'border-white/10',
  accent: 'border-[rgba(155,48,208,0.32)]',
  pink: 'border-white/18',
  blue: 'border-[rgba(0,212,255,0.25)]',
  green: 'border-[rgba(74,222,128,0.25)]',
};

export function Bento({ children, tone = 'panel', id, pad, glow = false, className }: BentoProps) {
  return (
    <div
      id={id}
      className={cn(
        'relative overflow-hidden rounded-[20px] border',
        BG[tone],
        BORDER[tone],
        glow
          ? 'shadow-[0_0_36px_rgba(224,64,251,0.25),inset_0_1px_0_rgba(255,255,255,0.05)]'
          : 'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        className,
      )}
      style={pad !== undefined ? { padding: pad } : undefined}
    >
      {children}
    </div>
  );
}

// ── BentoLabel ──────────────────────────────────────────────────────────────
// Eyebrow / section label — Space Grotesk, 10px, 700, uppercase, letter-spacing 2.

interface BentoLabelProps {
  children: React.ReactNode;
  tint?: string;
  className?: string;
}

export function BentoLabel({ children, tint, className }: BentoLabelProps) {
  return (
    <div
      className={cn(
        'font-[family-name:var(--font-heading)] text-[10px] font-bold uppercase tracking-[2px]',
        className,
      )}
      style={{ color: tint ?? 'rgba(255,255,255,0.50)' }}
    >
      {children}
    </div>
  );
}
