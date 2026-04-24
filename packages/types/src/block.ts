import type { LocalizedTextMap } from './i18n';
import type {
  SmartMerchDisplayMode,
  SmartMerchProduct,
  SmartMerchProductSelection,
  SmartMerchProvider,
  SmartMerchSourceMode,
} from './merch';
import type { ShopifySelectionMode, ShopifyStoreProduct } from './shopify';

// =============================================================
// Block types — shared between API and web.
// Must stay in sync with the Prisma BlockType enum and
// block-config.schema.ts validators in the API.
// =============================================================

export const BLOCK_TYPES = [
  'links',
  'music_embed',
  'video_embed',
  'email_capture',
  'text',
  'image_gallery',
  'shopify_store',
  'smart_merch',
] as const;
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

/**
 * Determines how a link item resolves on click.
 *   'url'        — direct external link (default, backward-compatible)
 *   'smart_link' — routes through /go/{smartLinkId} for platform-aware redirect
 */
export const LINK_ITEM_KINDS = ['url', 'smart_link'] as const;
export type LinkItemKind = (typeof LINK_ITEM_KINDS)[number];

export interface LinkItem {
  /** Stable id (UUID) — used as analytics identifier. Never changes after creation. */
  id: string;
  label: string; // max 100 chars
  /**
   * For kind 'url':        a https:// / http:// destination URL.
   * For kind 'smart_link': empty string (href is built from smartLinkId at render time).
   */
  url: string;
  icon?: LinkIcon; // optional; falls back to 'link' on render
  sortOrder: number; // 0-indexed; normalized to 0..n-1 on every save
  openInNewTab?: boolean; // default true
  /** Link item behaviour. Defaults to 'url' when absent (backward-compatible). */
  kind?: LinkItemKind;
  /** Required when kind === 'smart_link'. The SmartLink entity id. */
  smartLinkId?: string;
}

export interface LinksBlockConfig {
  items: LinkItem[];
}

/**
 * Resource types for music embed blocks.
 * Derived by the backend from the sourceUrl path — never sent by the client.
 * SoundCloud playlists (path: /sets/…) are normalized to 'playlist'.
 */
export type MusicResourceType = 'track' | 'album' | 'playlist' | 'artist' | 'episode';

export interface MusicEmbedBlockConfig {
  provider: 'spotify' | 'apple_music' | 'soundcloud' | 'youtube';
  /** URL pasted by the user (share link). Persisted as-is. */
  sourceUrl: string;
  /** Embed-safe URL derived by the backend. Never modified by the client. */
  embedUrl: string;
  /** Resource type inferred from sourceUrl path by the backend. */
  resourceType: MusicResourceType;
}

/**
 * Resource types for video embed blocks.
 *   video | short
 * Derived by the backend from the sourceUrl path — never sent by the client.
 */
export type VideoResourceType = 'video' | 'short';

export interface VideoEmbedBlockConfig {
  provider: 'youtube' | 'vimeo' | 'tiktok';
  /** URL pasted by the user (share link). Persisted as-is. */
  sourceUrl: string;
  /** Embed-safe URL derived by the backend. Never modified by the client. */
  embedUrl: string;
  /** Resource type inferred from sourceUrl path by the backend. */
  resourceType: VideoResourceType;
}

export interface EmailCaptureBlockConfig {
  headline: string;
  buttonLabel: string;
  description?: string;
  placeholder?: string;
  successMessage?: string;
  consentLabel?: string;
  requireConsent?: boolean;
}

export interface TextBlockConfig {
  body: string;
}

export interface ImageGalleryBlockConfig {
  imageUrls: string[];
}

export interface ShopifyStoreBlockConfig {
  headline?: string;
  description?: string;
  ctaLabel?: string;
  maxItems?: number;
  selectionMode?: ShopifySelectionMode;
  collectionTitle?: string | null;
  products?: ShopifyStoreProduct[];
}

export interface SmartMerchBlockConfig {
  provider: SmartMerchProvider;
  headline?: string;
  subtitle?: string;
  ctaLabel?: string;
  displayMode?: SmartMerchDisplayMode;
  sourceMode?: SmartMerchSourceMode;
  selectedProducts?: SmartMerchProductSelection[];
  maxItems?: number;
  products?: SmartMerchProduct[];
}

export interface EmailCaptureBlockTranslations {
  headline?: LocalizedTextMap;
  buttonLabel?: LocalizedTextMap;
  description?: LocalizedTextMap;
  placeholder?: LocalizedTextMap;
  successMessage?: LocalizedTextMap;
  consentLabel?: LocalizedTextMap;
}

export interface LinksBlockTranslations {
  title?: LocalizedTextMap;
  itemLabels?: Record<string, LocalizedTextMap>;
}

export interface ShopifyStoreBlockTranslations {
  headline?: LocalizedTextMap;
  description?: LocalizedTextMap;
  ctaLabel?: LocalizedTextMap;
}

export interface SmartMerchBlockTranslations {
  headline?: LocalizedTextMap;
  subtitle?: LocalizedTextMap;
  ctaLabel?: LocalizedTextMap;
}

export interface BlockLocalizedContent {
  title?: LocalizedTextMap;
  emailCapture?: EmailCaptureBlockTranslations;
  links?: LinksBlockTranslations;
  shopifyStore?: ShopifyStoreBlockTranslations;
  smartMerch?: SmartMerchBlockTranslations;
}

/** Discriminated union of all config shapes */
export type BlockConfig =
  | LinksBlockConfig
  | MusicEmbedBlockConfig
  | VideoEmbedBlockConfig
  | EmailCaptureBlockConfig
  | TextBlockConfig
  | ImageGalleryBlockConfig
  | ShopifyStoreBlockConfig
  | SmartMerchBlockConfig;

// ─── Block entity ─────────────────────────────────────────────────────────────

export interface Block {
  id: string;
  pageId: string;
  type: BlockType;
  title: string | null;
  config: BlockConfig;
  localizedContent?: BlockLocalizedContent | null;
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
  localizedContent?: BlockLocalizedContent;
}

export interface UpdateBlockPayload {
  title?: string;
  config?: Partial<BlockConfig>;
  localizedContent?: BlockLocalizedContent | null;
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

export function isTextBlock(block: Block): block is Block & { config: TextBlockConfig } {
  return block.type === 'text';
}

export function isImageGalleryBlock(
  block: Block,
): block is Block & { config: ImageGalleryBlockConfig } {
  return block.type === 'image_gallery';
}

export function isShopifyStoreBlock(
  block: Block,
): block is Block & { config: ShopifyStoreBlockConfig } {
  return block.type === 'shopify_store';
}

export function isSmartMerchBlock(
  block: Block,
): block is Block & { config: SmartMerchBlockConfig } {
  return block.type === 'smart_merch';
}
