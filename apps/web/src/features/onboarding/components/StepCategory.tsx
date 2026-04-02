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
  initialValue: ArtistCategory | '';
  initialSecondaryValues?: ArtistCategory[];
  onNext: (category: ArtistCategory, secondaryCategories: ArtistCategory[]) => void;
  onBack: () => void;
}

export function StepCategory({
  initialValue,
  initialSecondaryValues = [],
  onNext,
  onBack,
}: StepCategoryProps) {
  const [selected, setSelected] = useState<ArtistCategory | ''>(initialValue);
  const [secondary, setSecondary] = useState<ArtistCategory[]>(initialSecondaryValues);

  function toggleSecondary(category: ArtistCategory) {
    setSecondary((current) =>
      current.includes(category)
        ? current.filter((value) => value !== category)
        : [...current, category],
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">What kind of artist are you?</h2>
        <p className="text-muted-foreground">
          Choose your main category first, then add any secondary categories that also fit.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Primary category</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => {
                setSelected(cat.value);
                setSecondary((current) => current.filter((value) => value !== cat.value));
              }}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors hover:bg-accent',
                selected === cat.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-foreground',
              )}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Secondary categories</p>
          <p className="text-sm text-muted-foreground">Optional. Select all that apply.</p>
        </div>
        {CATEGORIES.map((cat) => (
          <button
            key={`secondary-${cat.value}`}
            type="button"
            disabled={selected === cat.value}
            onClick={() => toggleSecondary(cat.value)}
            className={cn(
              'mr-2 mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors',
              secondary.includes(cat.value)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-foreground hover:bg-accent',
              selected === cat.value && 'cursor-not-allowed opacity-50',
            )}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button
          className="flex-1"
          disabled={!selected}
          onClick={() => selected && onNext(selected, secondary)}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
