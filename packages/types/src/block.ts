// =============================================================
// Block types — shared between API and web.
// Must stay in sync with the Prisma BlockType enum and
// block-config.schema.ts validators in the API.
// =============================================================

export const BLOCK_TYPES = ['links', 'music_embed', 'video_embed', 'email_capture'] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

// ─── Config shapes per block type ────────────────────────────────────────────

/**
 * Acotado set of icon keys for link items.
 * Validated server-side; unknown values are rejected.
 * To add a new icon: add the key here, add a mapping in
 * LINK_ICON_LABELS (web) and the icon renderer in LinksBlockRenderer.
 */
export const LINK_ICONS = [
  'spotify',
  'apple_music',
  'soundcloud',
  'youtube',
  'instagram',
  'tiktok',
  'facebook',
  'x',
  'website',
  'mail',
  'ticket',
  'link',
  'generic',
] as const;

export type LinkIcon = (typeof LINK_ICONS)[number];

export interface LinkItem {
  /** Stable id (UUID) — used as analytics identifier. Never changes after creation. */
  id: string;
  label: string; // max 100 chars
  url: string; // https:// or http:// only
  icon?: LinkIcon; // optional; falls back to 'link' on render
  sortOrder: number; // 0-indexed; normalized to 0..n-1 on every save
  openInNewTab?: boolean; // default true
}

export interface LinksBlockConfig {
  items: LinkItem[];
}

export interface MusicEmbedBlockConfig {
  provider: 'spotify' | 'apple_music' | 'soundcloud' | 'youtube';
  embedUrl: string;
}

export interface VideoEmbedBlockConfig {
  provider: 'youtube' | 'vimeo' | 'tiktok';
  embedUrl: string;
}

export interface EmailCaptureBlockConfig {
  headline: string;
  buttonLabel: string;
  description?: string;
  placeholder?: string;
}

/** Discriminated union of all config shapes */
export type BlockConfig =
  | LinksBlockConfig
  | MusicEmbedBlockConfig
  | VideoEmbedBlockConfig
  | EmailCaptureBlockConfig;

// ─── Block entity ─────────────────────────────────────────────────────────────

export interface Block {
  id: string;
  pageId: string;
  type: BlockType;
  title: string | null;
  config: BlockConfig;
  position: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── API payloads ─────────────────────────────────────────────────────────────

export interface CreateBlockPayload {
  type: BlockType;
  title?: string;
  config: BlockConfig;
}

export interface UpdateBlockPayload {
  title?: string;
  config?: Partial<BlockConfig>;
}

export interface ReorderBlocksPayload {
  blocks: Array<{ id: string; position: number }>;
}

// ─── Type guards ──────────────────────────────────────────────────────────────

export function isLinksBlock(block: Block): block is Block & { config: LinksBlockConfig } {
  return block.type === 'links';
}

export function isMusicEmbedBlock(
  block: Block,
): block is Block & { config: MusicEmbedBlockConfig } {
  return block.type === 'music_embed';
}

export function isVideoEmbedBlock(
  block: Block,
): block is Block & { config: VideoEmbedBlockConfig } {
  return block.type === 'video_embed';
}

export function isEmailCaptureBlock(
  block: Block,
): block is Block & { config: EmailCaptureBlockConfig } {
  return block.type === 'email_capture';
}
