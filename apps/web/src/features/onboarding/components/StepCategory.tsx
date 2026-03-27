'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ArtistCategory } from '@stagelink/types';

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
  onNext: (category: ArtistCategory) => void;
  onBack: () => void;
}

export function StepCategory({ initialValue, onNext, onBack }: StepCategoryProps) {
  const [selected, setSelected] = useState<ArtistCategory | ''>(initialValue);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">What kind of artist are you?</h2>
        <p className="text-muted-foreground">
          Pick the one that fits best. You can always update this later.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setSelected(cat.value)}
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

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button
          className="flex-1"
          disabled={!selected}
          onClick={() => selected && onNext(selected)}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
