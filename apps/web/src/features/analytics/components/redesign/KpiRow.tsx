'use client';

import { cn } from '@/lib/utils';

interface KpiRowProps {
  children: React.ReactNode;
  className?: string;
}

export function KpiRow({ children, className }: KpiRowProps) {
  return (
    <div className={cn('sl-kpi-row grid grid-cols-4 border-t border-white/[0.08]', className)}>
      {children}
    </div>
  );
}
