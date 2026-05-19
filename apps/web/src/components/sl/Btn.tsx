// SL Design System — Btn primitive
// Four variants: primary (gradient), ghost, outline (magenta), bare

import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type BtnVariant = 'primary' | 'ghost' | 'outline' | 'bare';
type BtnSize = 'sm' | 'md';

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  full?: boolean;
  children?: ReactNode;
}

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-xl font-[family-name:var(--font-body)] font-semibold whitespace-nowrap cursor-pointer transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E040FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0A1A]';

const VARIANT: Record<BtnVariant, string> = {
  primary:
    'bg-[linear-gradient(135deg,#E040FB_0%,#9B30D0_45%,#4A1A8C_100%)] text-white border-0 shadow-[0_0_24px_rgba(224,64,251,0.3)] hover:opacity-90',
  ghost: 'bg-white/[0.05] text-white border border-white/10 hover:bg-white/10',
  outline:
    'bg-transparent text-[#E040FB] border border-[rgba(224,64,251,0.4)] hover:bg-[rgba(224,64,251,0.08)]',
  bare: 'bg-transparent text-white/70 border border-transparent hover:text-white hover:bg-white/[0.05]',
};

const SIZE: Record<BtnSize, string> = {
  sm: 'px-3 py-1.5 text-[12px]',
  md: 'px-4 py-2.5 text-[13px]',
};

export function Btn({
  variant = 'ghost',
  size = 'md',
  icon,
  iconRight,
  full,
  children,
  className,
  ...props
}: BtnProps) {
  return (
    <button
      className={cn(BASE, VARIANT[variant], SIZE[size], full && 'w-full', className)}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}
