'use client';

import { useState, useEffect, useRef } from 'react';
import { checkUsernameAvailability, type UsernameCheckResponse } from '@/lib/api/onboarding';

type CheckState = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';

interface UseUsernameCheckResult {
  state: CheckState;
  result: UsernameCheckResponse | null;
  normalizedValue: string;
}

const DEBOUNCE_MS = 500;

export function useUsernameCheck(rawValue: string): UseUsernameCheckResult {
  const [state, setState] = useState<CheckState>('idle');
  const [result, setResult] = useState<UsernameCheckResponse | null>(null);
  const [normalizedValue, setNormalizedValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = rawValue.trim().toLowerCase();
    if (trimmed.length < 3) {
      setState('idle');
      setResult(null);
      setNormalizedValue(trimmed);
      return;
    }

    setState('checking');
    setNormalizedValue(trimmed);

    timerRef.current = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailability(trimmed);
        setResult(res);
        setNormalizedValue(res.normalizedUsername);
        setState(res.available ? 'available' : 'unavailable');
      } catch {
        setState('error');
        setResult(null);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [rawValue]);

  return { state, result, normalizedValue };
}
