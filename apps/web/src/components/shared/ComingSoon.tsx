import { Construction } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description?: string;
}

/**
 * Placeholder section for features not yet built.
 * Shows a centered card with an icon, title and optional description.
 */
export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed">
      <div className="text-center space-y-3 px-6 py-12">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Construction className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-base font-semibold">{title}</h3>
        {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
