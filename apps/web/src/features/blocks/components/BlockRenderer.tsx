import type { Block } from '@stagelink/types';
import {
  isLinksBlock,
  isMusicEmbedBlock,
  isVideoEmbedBlock,
  isEmailCaptureBlock,
  type LinksBlockConfig,
  type MusicEmbedBlockConfig,
  type VideoEmbedBlockConfig,
  type EmailCaptureBlockConfig,
} from '@stagelink/types';
import { LinksBlockRenderer } from './LinksBlockRenderer';
import { MusicEmbedRenderer } from './MusicEmbedRenderer';
import { VideoEmbedRenderer } from './VideoEmbedRenderer';
import { EmailCaptureRenderer } from './EmailCaptureRenderer';

interface BlockRendererProps {
  block: Block;
  /**
   * Analytics hook for links blocks. Receives (blockId, itemId) on click.
   * Only wired up on the public page — omit in dashboard preview.
   */
  onLinkClick?: (blockId: string, itemId: string) => void;
}

/**
 * Dispatches a Block to the correct type-specific renderer.
 *
 * - Server-renderable: LinksBlock, MusicEmbed, VideoEmbed (no client state)
 * - Client component: EmailCapture (form state)
 *
 * Usage (dashboard preview):
 *   <BlockRenderer block={block} />
 *
 * Usage (public page — with analytics + email submission):
 *   <BlockRenderer block={block} onLinkClick={trackClick} />
 */
export function BlockRenderer({ block, onLinkClick }: BlockRendererProps) {
  if (isLinksBlock(block)) {
    return (
      <LinksBlockRenderer
        title={block.title}
        config={block.config as LinksBlockConfig}
        blockId={block.id}
        onLinkClick={onLinkClick}
      />
    );
  }

  if (isMusicEmbedBlock(block)) {
    return (
      <MusicEmbedRenderer title={block.title} config={block.config as MusicEmbedBlockConfig} />
    );
  }

  if (isVideoEmbedBlock(block)) {
    return (
      <VideoEmbedRenderer title={block.title} config={block.config as VideoEmbedBlockConfig} />
    );
  }

  if (isEmailCaptureBlock(block)) {
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
