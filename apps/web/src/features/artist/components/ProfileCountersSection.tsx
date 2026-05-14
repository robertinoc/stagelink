'use client';

import { ChartNoAxesColumn } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ProfileCountersSectionProps {
  /** Manual counter; `null` hides the row on the public page. */
  epsReleasedCount: number | null;
  /** Manual counter; `null` hides the row on the public page. */
  externalCollabsCount: number | null;
  /** Derived from the artist's `recordLabels.length` — read-only here. */
  recordLabelsCount: number;
  disabled: boolean;
  onChange: (next: {
    epsReleasedCount: number | null;
    externalCollabsCount: number | null;
  }) => void;
}

/**
 * Converts the form input value to a counter that round-trips correctly:
 *
 *   - empty string → `null` (means "hide on public page")
 *   - non-numeric  → `null` (defensive; HTML5 number inputs should already prevent this)
 *   - negative     → clamp to 0
 *   - decimal      → floor to integer
 */
function parseCounter(raw: string): number | null {
  if (raw.trim() === '') return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(99999, parsed));
}

export function ProfileCountersSection({
  epsReleasedCount,
  externalCollabsCount,
  recordLabelsCount,
  disabled,
  onChange,
}: ProfileCountersSectionProps) {
  return (
    <Card className="border-white/10 bg-white/[0.04] shadow-[0_18px_65px_rgba(10,7,20,0.18)] transition duration-200 hover:border-primary/30 hover:bg-primary/[0.04] hover:shadow-[0_18px_80px_rgba(155,48,208,0.14)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartNoAxesColumn className="h-4 w-4" />
          Public counters
        </CardTitle>
        <CardDescription>
          Small social-proof stats shown on your public landing page. Leave any field empty to hide
          that counter — there&apos;s no &ldquo;0&rdquo; shown to the public.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="counter-eps" className="text-sm font-medium leading-none">
              EPs released
            </label>
            <Input
              id="counter-eps"
              type="number"
              inputMode="numeric"
              min={0}
              max={99999}
              step={1}
              placeholder="e.g. 12"
              disabled={disabled}
              value={epsReleasedCount ?? ''}
              onChange={(e) =>
                onChange({
                  epsReleasedCount: parseCounter(e.target.value),
                  externalCollabsCount,
                })
              }
            />
            <p className="text-xs text-muted-foreground">Leave empty to hide.</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="counter-collabs" className="text-sm font-medium leading-none">
              External collabs
            </label>
            <Input
              id="counter-collabs"
              type="number"
              inputMode="numeric"
              min={0}
              max={99999}
              step={1}
              placeholder="e.g. 25"
              disabled={disabled}
              value={externalCollabsCount ?? ''}
              onChange={(e) =>
                onChange({
                  epsReleasedCount,
                  externalCollabsCount: parseCounter(e.target.value),
                })
              }
            />
            <p className="text-xs text-muted-foreground">Leave empty to hide.</p>
          </div>
        </div>

        {/* Record labels count is derived from the curated `recordLabels` list, so
         * the public number cannot drift away from what the artist has filled in. */}
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-sm font-medium text-white">Record labels</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Calculated from the record-labels card above:{' '}
            <span className="font-semibold text-foreground">{recordLabelsCount}</span>
            {recordLabelsCount === 0 ? ' — hidden on your public page until you add one.' : '.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
