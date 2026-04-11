'use client';

/**
 * PublicPageClient — client boundary for the public artist page.
 *
 * Wraps the blocks section of ArtistPageView to enable:
 *   - public_link_click tracking (requires onClick, which is client-only)
 *
 * ArtistPageView remains a Server Component (header, metadata, JSON-LD).
 * Only the interactive block section is delegated here.
 *
 * Usage in ArtistPageView:
 *   <PublicPageClient page={page} />
 *
 * Design notes:
 *   - Tracks clicks before navigation (fire-and-forget — PostHog queues the
 *     event even if the page unloads immediately after).
 *   - Referrer domain is extracted client-side from `document.referrer` to
 *     avoid sending full URLs to PostHog.
 *   - Smart link items also carry `?from=<blockId>:<itemId>` so the backend
 *     resolve endpoint can correlate the click via the audit log.
 */

import { BlockRenderer } from '@/features/blocks/components/BlockRenderer';
import { trackPublicLinkClick } from '@/lib/analytics/track';
import type { PublicPageResponse, LinksBlockConfig } from '@stagelink/types';
import { cn } from '@/lib/utils';

interface PublicPageClientProps {
  page: PublicPageResponse;
  blocks?: PublicPageResponse['blocks'];
  className?: string;
}

export function PublicPageClient({ page, blocks: scopedBlocks, className }: PublicPageClientProps) {
  const { artistId, pageId, artist } = page;
  const blocks = scopedBlocks ?? page.blocks;

  /**
   * Called by BlockRenderer → LinksBlockRenderer when a link is clicked.
   * NOTE: PostHog funnels between public_page_view (backend, distinctId=artist_id)
   * and public_link_click (frontend, distinctId=anonymous cookie) must use
   * "match by event property" on page_id — not person-based matching.
   *
   * @param blockId  ID of the links block that was clicked.
   * @param itemId   ID of the individual link item.
   */
  function handleLinkClick(blockId: string, itemId: string): void {
    // Find the clicked block and item to build a complete event payload.
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;

    const config = block.config as LinksBlockConfig | undefined;
    const item = config?.items?.find((i) => i.id === itemId);
    if (!item) return;

    // Extract destination URL for domain-only extraction in trackPublicLinkClick.
    // Smart links have a destination set by the backend on resolution; for tracking
    // we use the configured URL (the domain is what matters for attribution).
    const destinationUrl = item.url || undefined;

    trackPublicLinkClick({
      artist_id: artistId,
      username: artist.username,
      environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV ?? 'development',
      page_id: pageId,
      block_id: blockId,
      block_type: 'links',
      link_item_id: itemId,
      label: item.label,
      destination_url: destinationUrl,
      is_smart_link: item.kind === 'smart_link',
      ...(item.kind === 'smart_link' && item.smartLinkId && { smart_link_id: item.smartLinkId }),
    });
  }

  if (blocks.length === 0) return null;

  return (
    <div className={cn('space-y-4', className)}>
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} onLinkClick={handleLinkClick} />
      ))}
    </div>
  );
}
