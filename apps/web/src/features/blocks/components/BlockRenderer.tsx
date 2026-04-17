import type {
  BlockType,
  BlockConfig,
  LinksBlockConfig,
  MusicEmbedBlockConfig,
  VideoEmbedBlockConfig,
  EmailCaptureBlockConfig,
  TextBlockConfig,
  SmartMerchBlockConfig,
  ShopifyStoreBlockConfig,
} from '@stagelink/types';
import { LinksBlockRenderer } from './LinksBlockRenderer';
import { MusicEmbedRenderer } from './MusicEmbedRenderer';
import { VideoEmbedRenderer } from './VideoEmbedRenderer';
import { EmailCaptureRenderer } from './EmailCaptureRenderer';
import { TextBlockRenderer } from './TextBlockRenderer';
import { SmartMerchRenderer } from './SmartMerchRenderer';
import { ShopifyStoreRenderer } from './ShopifyStoreRenderer';

/**
 * Minimal block shape accepted by BlockRenderer.
 * Compatible with both the authenticated `Block` type and the public `PublicBlock` type.
 */
interface RenderableBlock {
  id: string;
  type: BlockType;
  title: string | null;
  config: BlockConfig;
}

interface BlockRendererProps {
  block: RenderableBlock;
  /**
   * Analytics hook for links blocks. Receives (blockId, itemId) on click.
   * Only wired up on the public page — omit in dashboard preview.
   */
  onLinkClick?: (blockId: string, itemId: string) => void;
}

/**
 * Dispatches a block to the correct type-specific renderer.
 *
 * - Server-renderable: LinksBlock, MusicEmbed, VideoEmbed (no client state)
 * - Client component: EmailCapture (form state)
 *
 * Accepts both the authenticated `Block` and the public `PublicBlock` shape.
 *
 * Config validation: `config` arrives as `Record<string, unknown>` from the
 * public API and is cast to the expected type. Individual renderers may fail if
 * the backend returns an unexpected shape. Malformed blocks are skipped (null)
 * so one bad block doesn't crash the whole page.
 *
 * TODO: replace casts with Zod parse-or-skip per block type when validation
 * schemas are added to @stagelink/types.
 *
 * Usage (dashboard preview):
 *   <BlockRenderer block={block} />
 *
 * Usage (public page — with analytics + email submission):
 *   <BlockRenderer block={block} onLinkClick={trackClick} />
 */
export function BlockRenderer({ block, onLinkClick }: BlockRendererProps) {
  // Guard against null/undefined config — a malformed backend response shouldn't
  // crash the entire page; skip the block and log for investigation.
  if (!block.config) {
    console.error(`[BlockRenderer] Block ${block.id} (${block.type}) has no config — skipping`);
    return null;
  }

  if (block.type === 'links') {
    return (
      <LinksBlockRenderer
        title={block.title}
        config={block.config as LinksBlockConfig}
        blockId={block.id}
        onLinkClick={onLinkClick}
      />
    );
  }

  if (block.type === 'music_embed') {
    return (
      <MusicEmbedRenderer title={block.title} config={block.config as MusicEmbedBlockConfig} />
    );
  }

  if (block.type === 'video_embed') {
    return (
      <VideoEmbedRenderer title={block.title} config={block.config as VideoEmbedBlockConfig} />
    );
  }

  if (block.type === 'email_capture') {
    return (
      <EmailCaptureRenderer
        title={block.title}
        config={block.config as EmailCaptureBlockConfig}
        blockId={block.id}
      />
    );
  }

  if (block.type === 'text') {
    return <TextBlockRenderer title={block.title} config={block.config as TextBlockConfig} />;
  }

  if (block.type === 'shopify_store') {
    return (
      <ShopifyStoreRenderer title={block.title} config={block.config as ShopifyStoreBlockConfig} />
    );
  }

  if (block.type === 'smart_merch') {
    return (
      <SmartMerchRenderer title={block.title} config={block.config as SmartMerchBlockConfig} />
    );
  }

  // Unknown block type — future-proof: skip rather than crash.
  console.error(`[BlockRenderer] Unknown block type "${block.type}" for block ${block.id}`);
  return null;
}
