import type { LinkIcon, LinksBlockConfig } from '@stagelink/types';
import { ExternalLink, Globe, Mail, Music, Ticket, Video, Link as LinkIcon_ } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Icon mapping ─────────────────────────────────────────────────────────────
//
// Maps each LinkIcon key to a Lucide icon component.
// Platform-specific icons (Spotify, Instagram, etc.) that don't have a Lucide
// equivalent fall back to a generic icon.
//
// To add a new icon key:
//   1. Add the key to LINK_ICONS in @stagelink/types
//   2. Add an entry here (or reuse an existing Lucide icon as proxy)
//   3. Add the validation case in block-config.schema.ts (auto-handled via LINK_ICONS)

const ICON_MAP: Record<LinkIcon, LucideIcon> = {
  spotify: Music,
  apple_music: Music,
  soundcloud: Music,
  youtube: Video,
  instagram: ExternalLink,
  tiktok: Video,
  facebook: ExternalLink,
  x: ExternalLink,
  website: Globe,
  mail: Mail,
  ticket: Ticket,
  link: LinkIcon_,
  generic: ExternalLink,
};

function BlockIcon({ icon }: { icon?: LinkIcon }) {
  const Icon = icon ? (ICON_MAP[icon] ?? LinkIcon_) : LinkIcon_;
  return <Icon className="h-4 w-4 shrink-0" aria-hidden />;
}

// ─── Single link item ─────────────────────────────────────────────────────────

interface LinkItemProps {
  id: string;
  label: string;
  url: string;
  icon?: LinkIcon;
  openInNewTab?: boolean;
  /**
   * Analytics hook — called when the user clicks this link.
   * The blockId + itemId pair is the stable key for click tracking.
   * Wire this up once the analytics pipeline is ready.
   */
  onClickTrack?: (itemId: string) => void;
}

function LinksBlockItem({
  id,
  label,
  url,
  icon,
  openInNewTab = true,
  onClickTrack,
}: LinkItemProps) {
  // Empty url means the item is not yet fully configured — skip rendering.
  if (!url) return null;

  return (
    <a
      href={url}
      target={openInNewTab ? '_blank' : '_self'}
      rel={openInNewTab ? 'noopener noreferrer' : undefined}
      onClick={() => onClickTrack?.(id)}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <BlockIcon icon={icon} />
      <span className="flex-1 text-center">{label}</span>
    </a>
  );
}

// ─── Block renderer ───────────────────────────────────────────────────────────

interface LinksBlockRendererProps {
  /** Optional block-level title */
  title?: string | null;
  config: LinksBlockConfig;
  /**
   * Optional analytics handler. Receives (blockId, itemId) on click.
   * The items already carry stable `id` fields — use those for tracking.
   */
  onLinkClick?: (blockId: string, itemId: string) => void;
  blockId?: string;
}

/**
 * Renders a links/CTA block.
 *
 * Usage (dashboard preview):
 *   <LinksBlockRenderer title={block.title} config={block.config as LinksBlockConfig} />
 *
 * Usage (public page — once that layer exists):
 *   <LinksBlockRenderer
 *     blockId={block.id}
 *     title={block.title}
 *     config={block.config as LinksBlockConfig}
 *     onLinkClick={(blockId, itemId) => trackClick({ blockId, itemId })}
 *   />
 *
 * Items are rendered in sortOrder ascending (they arrive pre-sorted from the API).
 */
export function LinksBlockRenderer({
  title,
  config,
  onLinkClick,
  blockId,
}: LinksBlockRendererProps) {
  const items = [...(config.items ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {title && <h3 className="text-center text-base font-semibold">{title}</h3>}
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          // smart_link items route through /go/[id] for platform-aware redirect.
          const href =
            item.kind === 'smart_link' && item.smartLinkId ? `/go/${item.smartLinkId}` : item.url;
          return (
            <LinksBlockItem
              key={item.id}
              id={item.id}
              label={item.label}
              url={href}
              icon={item.icon}
              openInNewTab={item.openInNewTab}
              onClickTrack={
                onLinkClick && blockId ? (itemId) => onLinkClick(blockId, itemId) : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}
