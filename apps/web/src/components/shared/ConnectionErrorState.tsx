import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ConnectionErrorStateProps {
  href: string;
  title?: string;
  description?: string;
  actionLabel?: string;
}

export function ConnectionErrorState({
  href,
  title = 'Having trouble connecting',
  description = 'The server is temporarily unavailable. Please refresh the page in a few seconds.',
  actionLabel = 'Refresh',
}: ConnectionErrorStateProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="max-w-md space-y-2">
        <p className="text-lg font-semibold text-white">{title}</p>
        <p className="text-sm leading-6 text-white/64">{description}</p>
      </div>
      <Button asChild variant="outline">
        <Link href={href}>{actionLabel}</Link>
      </Button>
    </div>
  );
}
