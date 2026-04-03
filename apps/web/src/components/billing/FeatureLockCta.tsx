'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FeatureLockCtaProps {
  title: string;
  description: string;
  currentPlanLabel: string;
  requiredPlanLabel: string;
  href: string;
  ctaLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  compact?: boolean;
  className?: string;
}

export function FeatureLockCta({
  title,
  description,
  currentPlanLabel,
  requiredPlanLabel,
  href,
  ctaLabel,
  secondaryHref,
  secondaryLabel,
  compact = false,
  className,
}: FeatureLockCtaProps) {
  if (compact) {
    return (
      <div className={cn('rounded-lg border border-amber-200 bg-amber-50/70 p-3', className)}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-950">{title}</p>
            <p className="text-xs text-amber-900/80">{description}</p>
          </div>
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{currentPlanLabel}</Badge>
          <Badge variant="outline">{requiredPlanLabel}</Badge>
          <Button asChild size="sm" className="ml-auto">
            <Link href={href}>{ctaLabel}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('border-amber-200 bg-amber-50/60', className)}>
      <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-900">
          <Lock className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="outline">{requiredPlanLabel}</Badge>
          <Badge variant="secondary">{currentPlanLabel}</Badge>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href={href}>{ctaLabel}</Link>
          </Button>
          {secondaryHref && secondaryLabel ? (
            <Button asChild variant="outline">
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
