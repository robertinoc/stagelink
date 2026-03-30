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

interface PublicPageClientProps {
  page: PublicPageResponse;
}

export function PublicPageClient({ page }: PublicPageClientProps) {
  const { artist, blocks } = page;

  /**
   * Called by BlockRenderer → LinksBlockRenderer when a link is clicked.
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

    // NOTE: The public API intentionally omits internal UUIDs from PublicPageResponse.
    // For this client-side event, `artist_id` is the username (the stable public key).
    // The backend's `public_page_view` event uses the real UUID — PostHog dashboards
    // can join these events by `username` which is immutable and present in both.
    trackPublicLinkClick({
      artist_id: artist.username,
      username: artist.username,
      environment: process.env.NODE_ENV ?? 'production',
      // page_id is not exposed in PublicPageResponse; the backend's page_view event
      // has the real page UUID. block_id provides sufficient scoping here.
      page_id: 'client',
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
    <div className="space-y-4">
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} onLinkClick={handleLinkClick} />
      ))}
    </div>
  );
}
