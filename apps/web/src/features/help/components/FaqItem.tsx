'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaqItemProps {
  question: string;
  answer: string;
}

export function FaqItem({ question, answer }: FaqItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-white transition-colors hover:text-white/80"
      >
        <span>{question}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 flex-shrink-0 text-white/50 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed text-white/60">{answer}</p>}
    </div>
  );
}
