import type {
  BlockType,
  BlockConfig,
  LinksBlockConfig,
  MusicEmbedBlockConfig,
  VideoEmbedBlockConfig,
  EmailCaptureBlockConfig,
} from '@stagelink/types';
import { LinksBlockRenderer } from './LinksBlockRenderer';
import { MusicEmbedRenderer } from './MusicEmbedRenderer';
import { VideoEmbedRenderer } from './VideoEmbedRenderer';
import { EmailCaptureRenderer } from './EmailCaptureRenderer';

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
 * Usage (dashboard preview):
 *   <BlockRenderer block={block} />
 *
 * Usage (public page — with analytics + email submission):
 *   <BlockRenderer block={block} onLinkClick={trackClick} />
 */
export function BlockRenderer({ block, onLinkClick }: BlockRendererProps) {
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

  return null;
}
