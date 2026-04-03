'use client';

import { useState } from 'react';
import type { ArtistCategory } from '@stagelink/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CATEGORIES: { value: ArtistCategory; label: string; emoji: string }[] = [
  { value: 'musician', label: 'Musician', emoji: '🎸' },
  { value: 'dj', label: 'DJ', emoji: '🎧' },
  { value: 'band', label: 'Band', emoji: '🎵' },
  { value: 'producer', label: 'Producer', emoji: '🎛️' },
  { value: 'actor', label: 'Actor', emoji: '🎭' },
  { value: 'painter', label: 'Painter', emoji: '🎨' },
  { value: 'visual_artist', label: 'Visual Artist', emoji: '🖼️' },
  { value: 'performer', label: 'Performer', emoji: '🌟' },
  { value: 'creator', label: 'Creator', emoji: '✨' },
  { value: 'other', label: 'Other', emoji: '🎤' },
];

interface StepCategoryProps {
  initialValues?: ArtistCategory[];
  onNext: (categories: ArtistCategory[]) => void;
  onBack: () => void;
}

export function StepCategory({
  initialValues = [],
  onNext,
  onBack,
}: StepCategoryProps) {
  const [selected, setSelected] = useState<ArtistCategory[]>(initialValues);

  function toggleCategory(category: ArtistCategory) {
    setSelected((current) => {
      if (current.includes(category)) {
        return current.filter((value) => value !== category);
      }

      if (current.length >= 3) return current;

      return [...current, category];
    });
  }

  function categoryNumber(category: ArtistCategory): number | null {
    const index = selected.indexOf(category);
    return index === -1 ? null : index + 1;
  }

  const canContinue = selected.length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">What kind of artist are you?</h2>
        <p className="text-muted-foreground">Choose up to 3 categories that fit. You can update this later.</p>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Selected</span>
          <span className="text-muted-foreground">{selected.length}/3</span>
        </div>
        <div className="mt-3 flex min-h-11 flex-wrap gap-2">
          {selected.length > 0 ? (
            selected.map((category, index) => {
              const cat = CATEGORIES.find((item) => item.value === category)!;
              return (
                <span
                  key={`selected-${category}`}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {index + 1}
                  </span>
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </span>
              );
            })
          ) : (
            <span className="text-sm text-muted-foreground">Pick at least one category to continue.</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const selectedNumber = categoryNumber(cat.value);
          const blocked = !selectedNumber && selected.length >= 3;
          return (
            <button
              key={cat.value}
              type="button"
              disabled={blocked}
              onClick={() => toggleCategory(cat.value)}
              className={cn(
                'relative flex items-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors',
                selectedNumber
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-foreground hover:bg-accent',
                blocked && 'cursor-not-allowed opacity-50',
              )}
            >
              {selectedNumber && (
                <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
                  {selectedNumber}
                </span>
              )}
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button className="flex-1" disabled={!canContinue} onClick={() => onNext(selected)}>
          Continue
        </Button>
      </div>
    </div>
  );
}
