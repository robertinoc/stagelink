'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUsernameCheck } from '../hooks/useUsernameCheck';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface StepUsernameProps {
  initialValue: string;
  accessToken: string;
  onNext: (username: string) => void;
  onBack: () => void;
}

const REASON_MESSAGES: Record<string, string> = {
  too_short: 'Username must be at least 3 characters.',
  too_long: 'Username must be 30 characters or less.',
  invalid_chars: 'Only letters, numbers, hyphens and underscores are allowed.',
  reserved: 'This username is reserved.',
  taken: 'This username is already taken.',
};

function hasValidUsernameFormat(value: string): boolean {
  return /^[a-z0-9_-]{3,30}$/.test(value);
}

export function StepUsername({ initialValue, accessToken, onNext, onBack }: StepUsernameProps) {
  const [value, setValue] = useState(initialValue);
  const { state, result, normalizedValue } = useUsernameCheck(value, accessToken);
  const fallbackAllowed = state === 'error' && hasValidUsernameFormat(normalizedValue);

  const canContinue = state === 'available' || fallbackAllowed;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Choose your username</h2>
        <p className="text-muted-foreground">
          Your public URL:{' '}
          <span className="font-medium">
            stagelink.io/<span className="text-foreground">{normalizedValue || 'yourname'}</span>
          </span>
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium leading-none">
          Username
        </label>
        <div className="relative">
          <Input
            id="username"
            placeholder="yourname"
            value={value}
            onChange={(e) => setValue(e.target.value.toLowerCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canContinue) onNext(normalizedValue);
            }}
            maxLength={30}
            autoFocus
            className="pr-10"
          />
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            {state === 'checking' && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {state === 'available' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {state === 'unavailable' && <XCircle className="h-4 w-4 text-destructive" />}
          </div>
        </div>

        {state === 'available' && (
          <p className="text-sm text-green-600">✓ {normalizedValue} is available</p>
        )}
        {state === 'unavailable' && result?.reason && (
          <p className="text-sm text-destructive">
            {REASON_MESSAGES[result.reason] ?? 'This username is not available.'}
          </p>
        )}
        {state === 'error' && (
          <p className="text-sm text-amber-600">
            Could not verify availability right now. You can continue and we&apos;ll validate it on
            the next step.
          </p>
        )}
        {state === 'idle' && value.trim().length > 0 && value.trim().length < 3 && (
          <p className="text-sm text-muted-foreground">Keep typing… (min 3 characters)</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button className="flex-1" disabled={!canContinue} onClick={() => onNext(normalizedValue)}>
          Continue
        </Button>
      </div>
    </div>
  );
}
