'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface StepNameProps {
  initialValue: string;
  onNext: (displayName: string) => void;
}

export function StepName({ initialValue, onNext }: StepNameProps) {
  const [value, setValue] = useState(initialValue);
  const trimmed = value.trim();
  const isValid = trimmed.length >= 1 && trimmed.length <= 100;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">What&apos;s your artist name?</h2>
        <p className="text-muted-foreground">This is the name your fans will see on your page.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="displayName" className="text-sm font-medium leading-none">
          Artist name
        </label>
        <Input
          id="displayName"
          placeholder="e.g. The Midnight, DJ Snake, Rosalía..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isValid) onNext(trimmed);
          }}
          maxLength={100}
          autoFocus
        />
        {value.length > 0 && trimmed.length === 0 && (
          <p className="text-sm text-destructive">Name cannot be empty.</p>
        )}
      </div>

      <Button className="w-full" disabled={!isValid} onClick={() => onNext(trimmed)}>
        Continue
      </Button>
    </div>
  );
}
