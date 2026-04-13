'use client';

import { useEffect } from 'react';

interface AutoPrintOnMountProps {
  enabled?: boolean;
}

export function AutoPrintOnMount({ enabled = false }: AutoPrintOnMountProps) {
  useEffect(() => {
    if (!enabled) return;

    const timer = window.setTimeout(() => {
      window.print();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [enabled]);

  return null;
}
