// Re-export shared types from @stagelink/types package
// Additional frontend-specific types can be added here

export type { User, Artist, Page, Block } from '@stagelink/types';

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}
