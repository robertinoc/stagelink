'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  BarChart3,
  Check,
  Copy,
  Disc3,
  GripVertical,
  Images,
  Link2,
  Mail,
  MessageSquare,
  Music2,
  Play,
  ShoppingBag,
  Shirt,
  Sliders,
  Tag,
  Trash2,
  Type,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  Block,
  BlockType,
  BlockConfig,
  BlockLocalizedContent,
  CreateBlockPayload,
  UpdateBlockPayload,
  PlanCode,
  ArtistRelease,
  RecordLabel,
} from '@stagelink/types';
import { BLOCK_TYPES, PLAN_BLOCK_LIMITS } from '@stagelink/types';
import {
  getBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
  reorderBlocks,
  publishBlock,
  unpublishBlock,
} from '@/lib/api/blocks';
import { defaultConfig, BlockConfigForm } from './BlockConfigForm';

// ─── shadcn/ui imports ────────────────────────────────────────────────────────
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface Props {
  pageId: string;
  artistId: string;
  canUseShopifyIntegration: boolean;
  canUseSmartMerch: boolean;
  /** Whether the artist has an active Shopify storefront connection. */
  shopifyIsConnected?: boolean;
  /** Whether the artist's Printful/Smart Merch store is connected. */
  smartMerchIsConnected?: boolean;
  /** Artist's effective plan — used to warn when active blocks exceed the plan's public display limit. */
  userPlan?: PlanCode;
  galleryImages?: string[];
  textSources?: Array<{
    id: string;
    label: string;
    body: string;
  }>;
  /** Artist's release catalog — source for the releases block selector + "won't render" warning. */
  releases?: ArtistRelease[];
  /** Artist's curated record labels — source for the record_labels block selector + warning. */
  recordLabels?: RecordLabel[];
  /** Artist's public counter values — for the public_counters block selector + warning. */
  counterValues?: { eps: number; labels: number; collabs: number };
  username?: string;
  /** Called after any block state change (create/update/delete/reorder/toggle).
   *  Used by the parent to know when to refresh the phone preview iframe. */
  onBlocksChanged?: () => void;
}

// ─── Block type metadata ──────────────────────────────────────────────────────

const BLOCK_TYPE_ICONS: Record<BlockType, LucideIcon> = {
  links: Link2,
  music_embed: Music2,
  video_embed: Play,
  email_capture: Mail,
  text: Type,
  image_gallery: Images,
  shopify_store: ShoppingBag,
  smart_merch: Shirt,
  technical_rider: Sliders,
  contact_form: MessageSquare,
  releases: Disc3,
  record_labels: Tag,
  public_counters: BarChart3,
};

/**
 * Block types grouped into categories for the "Add a block" selector, each with
 * its own accent. Types are filtered against availability (plan gates) at render
 * time, so a category with no available types is hidden entirely.
 */
interface BlockCategory {
  key: 'essentials' | 'music_video' | 'career' | 'connect' | 'store';
  /** Category eyebrow colour (Space Grotesk uppercase header). */
  headerText: string;
  /** Icon chip — gradient bg + ring + glyph colour. */
  iconWrap: string;
  /** Hover accent for the card (border + tint + glow). */
  cardHover: string;
  types: BlockType[];
}

// Order matters: Store last, Connect second-to-last (per product direction).
// Palette aligned to the StageLink brand (magenta #E040FB / violet #9B30D0 /
// amber #FBBF24 / cyan #00D4FF / green #4ADE80). Icon chips use a vivid gradient
// with a ring; eyebrows + hover glow pick up the same accent.
const BLOCK_CATEGORIES: BlockCategory[] = [
  {
    key: 'essentials',
    headerText: 'text-fuchsia-300',
    iconWrap:
      'bg-gradient-to-br from-fuchsia-500/30 to-fuchsia-600/15 text-fuchsia-200 ring-1 ring-fuchsia-400/30',
    cardHover:
      'hover:border-fuchsia-400/50 hover:bg-fuchsia-500/[0.06] hover:shadow-[0_0_28px_-4px_rgba(224,64,251,0.5)]',
    types: ['links', 'text', 'image_gallery'],
  },
  {
    key: 'music_video',
    headerText: 'text-violet-300',
    iconWrap:
      'bg-gradient-to-br from-violet-500/30 to-violet-600/15 text-violet-200 ring-1 ring-violet-400/30',
    cardHover:
      'hover:border-violet-400/50 hover:bg-violet-500/[0.06] hover:shadow-[0_0_28px_-4px_rgba(155,48,208,0.5)]',
    types: ['music_embed', 'video_embed'],
  },
  {
    key: 'career',
    headerText: 'text-amber-300',
    iconWrap:
      'bg-gradient-to-br from-amber-400/30 to-amber-500/15 text-amber-200 ring-1 ring-amber-400/30',
    cardHover:
      'hover:border-amber-400/50 hover:bg-amber-400/[0.06] hover:shadow-[0_0_28px_-4px_rgba(251,191,36,0.5)]',
    types: ['releases', 'record_labels', 'public_counters'],
  },
  {
    key: 'connect',
    headerText: 'text-cyan-300',
    iconWrap:
      'bg-gradient-to-br from-cyan-400/30 to-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/30',
    cardHover:
      'hover:border-cyan-400/50 hover:bg-cyan-400/[0.06] hover:shadow-[0_0_28px_-4px_rgba(0,212,255,0.5)]',
    types: ['email_capture', 'contact_form', 'technical_rider'],
  },
  {
    key: 'store',
    headerText: 'text-emerald-300',
    iconWrap:
      'bg-gradient-to-br from-emerald-400/30 to-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30',
    cardHover:
      'hover:border-emerald-400/50 hover:bg-emerald-400/[0.06] hover:shadow-[0_0_28px_-4px_rgba(74,222,128,0.5)]',
    types: ['shopify_store', 'smart_merch'],
  },
];

/** Brand background colours for music-embed providers (shown in the block row icon). */
const MUSIC_PROVIDER_BG: Record<string, string> = {
  spotify: 'bg-[#1DB954]',
  soundcloud: 'bg-[#FF5500]',
  apple_music: 'bg-[#FC3C44]',
  youtube: 'bg-[#FF0000]',
};

function hasLocalizedContent(content: BlockLocalizedContent | null | undefined): boolean {
  if (!content) return false;
  return Object.values(content).some((value) => {
    if (!value || typeof value !== 'object') return false;
    return Object.keys(value).length > 0;
  });
}

function getBlockConfigValidationMessage(
  config: BlockConfig | null,
  type?: BlockType,
  /** Effective title after the current edit (trimmed). Used for the text block rule. */
  title?: string,
): string | null {
  if (!config) return null;

  // text block: body is optional when a title is present (and vice-versa).
  // HTML mode always requires a body (the embed code IS the content).
  // At least one of title or body must be non-empty.
  if (type === 'text') {
    const isHtmlMode = 'htmlMode' in config && (config as { htmlMode?: boolean }).htmlMode === true;
    const hasBody =
      'body' in config &&
      typeof (config as { body?: string }).body === 'string' &&
      ((config as { body?: string }).body ?? '').trim().length > 0;
    const hasTitle = Boolean(title?.trim());
    if (isHtmlMode && !hasBody) {
      return 'El modo HTML requiere un embed code en el cuerpo del bloque.';
    }
    if (!isHtmlMode && !hasBody && !hasTitle) {
      return 'El bloque de texto requiere al menos un título o un contenido.';
    }
  }

  // music_embed / video_embed in manual mode require a source URL
  if (type === 'music_embed' || type === 'video_embed') {
    const mode = 'mode' in config ? config.mode : 'manual';
    if (mode !== 'latest_track' && mode !== 'latest_video') {
      const sourceUrl =
        'sourceUrl' in config ? (config.sourceUrl as string | undefined) : undefined;
      if (!sourceUrl?.trim()) {
        return 'Ingresá la URL del contenido para poder guardar este bloque.';
      }
    }
  }

  if (!('provider' in config)) return null;

  if (config.provider === 'printful' || config.provider === 'printify') {
    if ('selectedProducts' in config && Array.isArray(config.selectedProducts)) {
      const missingPurchaseUrl = config.selectedProducts.some(
        (product) => !product.purchaseUrl || product.purchaseUrl.trim().length === 0,
      );

      if (missingPurchaseUrl) {
        return 'Every selected Smart Merch product needs an external purchase URL before you can save this block.';
      }
    }
  }

  return null;
}

function getYouTubeThumbnail(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.pathname.split('/').filter(Boolean)[0];
      return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
    }

    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
    }
  } catch {
    return null;
  }

  return null;
}

function getBlockThumbnail(block: Block): string | null {
  switch (block.type) {
    case 'video_embed':
      // latest_video mode: no static sourceUrl to parse — show branded placeholder in BlockRow
      if ('mode' in block.config && block.config.mode === 'latest_video') return null;
      if ('sourceUrl' in block.config) {
        return getYouTubeThumbnail(block.config.sourceUrl);
      }
      return null;
    case 'shopify_store':
      if ('products' in block.config) {
        return block.config.products?.[0]?.imageUrl ?? null;
      }
      return null;
    case 'smart_merch':
      if ('products' in block.config) {
        return block.config.products?.[0]?.imageUrl ?? null;
      }
      return null;
    case 'image_gallery':
      if ('imageUrls' in block.config) {
        return block.config.imageUrls?.[0] ?? null;
      }
      return null;
    default:
      return null;
  }
}

// ─── URL Row ──────────────────────────────────────────────────────────────────

function BlockManagerUrlRow({
  username,
  t,
}: {
  username: string;
  t: ReturnType<typeof useTranslations<'blocks'>>;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`https://stagelink.art/${username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-white/8 bg-white/[0.025] px-5 py-3">
      <span className="shrink-0 font-[family-name:var(--font-heading)] text-[10px] font-bold uppercase tracking-[2px] text-white/30">
        {t('url_label')}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <span className="text-[13px] text-white/40">stagelink.art/</span>
        <span className="text-[13px] font-semibold text-white">{username}</span>
      </div>
      <button
        onClick={handleCopy}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? t('copied') : t('copy')}
      </button>
    </div>
  );
}

// ─── Create Block Dialog ──────────────────────────────────────────────────────

function CreateBlockDialog({
  open,
  pageId,
  artistId,
  canUseShopifyIntegration,
  canUseSmartMerch,
  galleryImages,
  textSources,
  releases,
  recordLabels,
  counterValues,
  onCreated,
  onClose,
}: {
  open: boolean;
  pageId: string;
  artistId: string;
  canUseShopifyIntegration: boolean;
  canUseSmartMerch: boolean;
  galleryImages?: Props['galleryImages'];
  textSources?: Props['textSources'];
  releases?: Props['releases'];
  recordLabels?: Props['recordLabels'];
  counterValues?: Props['counterValues'];
  onCreated: (block: Block) => void;
  onClose: () => void;
}) {
  const t = useTranslations('blocks');
  const [selectedType, setSelectedType] = useState<BlockType | null>(null);
  const [title, setTitle] = useState('');
  const [config, setConfig] = useState<BlockConfig | null>(null);
  const [localizedContent, setLocalizedContent] = useState<BlockLocalizedContent>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const availableBlockTypes = BLOCK_TYPES.filter((type) => {
    if (type === 'shopify_store') return canUseShopifyIntegration;
    if (type === 'smart_merch') return canUseSmartMerch;
    return true;
  });

  function selectType(type: BlockType) {
    setSelectedType(type);
    setConfig(defaultConfig(type));
    setLocalizedContent({});
    setError(null);
  }

  function reset() {
    setSelectedType(null);
    setTitle('');
    setConfig(null);
    setLocalizedContent({});
    setError(null);
  }

  async function handleCreate() {
    if (!selectedType || !config) return;
    const validationMessage = getBlockConfigValidationMessage(config, selectedType, title.trim());
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: CreateBlockPayload = {
        type: selectedType,
        config,
        ...(title.trim() && { title: title.trim() }),
        ...(hasLocalizedContent(localizedContent) && { localizedContent }),
      };
      const block = await createBlock(pageId, payload);
      onCreated(block);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('save_error'));
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl xl:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-heading)] tracking-tight">
            {t('create_dialog.title')}
          </DialogTitle>
          <DialogDescription>{t('create_dialog.subtitle')}</DialogDescription>
        </DialogHeader>

        {!selectedType ? (
          <div className="space-y-4 pt-1">
            {BLOCK_CATEGORIES.map((category) => {
              const types = category.types.filter((type) => availableBlockTypes.includes(type));
              if (types.length === 0) return null;
              return (
                <div key={category.key} className="space-y-2">
                  <p
                    className={`font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.2em] ${category.headerText}`}
                  >
                    {t(`categories.${category.key}`)}
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {types.map((type) => {
                      const TypeIcon = BLOCK_TYPE_ICONS[type];
                      return (
                        <button
                          key={type}
                          onClick={() => selectType(type)}
                          className={`group flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 ${category.cardHover}`}
                        >
                          <span
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${category.iconWrap}`}
                          >
                            <TypeIcon className="h-[22px] w-[22px]" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-[family-name:var(--font-heading)] text-[17px] font-bold leading-tight tracking-tight text-white">
                              {t(`types.${type}`)}
                            </span>
                            <span className="mt-0.5 block text-xs leading-snug text-white/55">
                              {t(`type_descriptions.${type}`)}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              {(() => {
                const SelectedIcon = BLOCK_TYPE_ICONS[selectedType];
                return <SelectedIcon className="h-4 w-4 text-muted-foreground" />;
              })()}
              <span className="font-medium">{t(`types.${selectedType}`)}</span>
              <button
                className="ml-auto text-xs text-muted-foreground hover:underline"
                onClick={reset}
              >
                ← Change type
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">{t('fields.title')}</label>
              <input
                type="text"
                placeholder={t('fields.title_placeholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                maxLength={200}
              />
            </div>

            {config && (
              <BlockConfigForm
                type={selectedType}
                config={config}
                onChange={setConfig}
                localizedContent={localizedContent}
                onLocalizedContentChange={setLocalizedContent}
                artistId={artistId}
                galleryImages={galleryImages}
                textSources={textSources}
                releases={releases}
                recordLabels={recordLabels}
                counterValues={counterValues}
              />
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose} disabled={saving}>
                {t('cancel')}
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? t('saving') : t('add_block')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Block Sheet ─────────────────────────────────────────────────────────

function EditBlockSheet({
  block,
  artistId,
  galleryImages,
  textSources,
  releases,
  recordLabels,
  counterValues,
  onUpdated,
  onClose,
  onSaveError,
  externalError,
}: {
  block: Block | null;
  artistId: string;
  galleryImages?: Props['galleryImages'];
  textSources?: Props['textSources'];
  releases?: Props['releases'];
  recordLabels?: Props['recordLabels'];
  counterValues?: Props['counterValues'];
  onUpdated: (block: Block) => void;
  onClose: () => void;
  /** Called with the original block + error message when a background save fails. */
  onSaveError?: (block: Block, message: string) => void;
  /** Error to show when the editor reopens after a failed optimistic save. */
  externalError?: string | null;
}) {
  const t = useTranslations('blocks');
  const [title, setTitle] = useState('');
  const [config, setConfig] = useState<BlockConfig | null>(null);
  const [localizedContent, setLocalizedContent] = useState<BlockLocalizedContent>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (block) {
      setTitle(block.title ?? '');
      setConfig(block.config);
      setLocalizedContent(block.localizedContent ?? {});
      // Restore error from parent when reopened after a failed optimistic save
      setError(externalError ?? null);
    }
    // externalError intentionally excluded — only read once on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block]);

  async function handleSave() {
    if (!block || !config) return;
    const validationMessage = getBlockConfigValidationMessage(config, block.type, title.trim());
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setError(null);

    const payload: UpdateBlockPayload = {
      config,
      // Send title: '' to explicitly clear — the API trims empty strings to null.
      ...(title.trim() !== (block.title ?? '') && { title: title.trim() }),
      ...(hasLocalizedContent(localizedContent) && { localizedContent }),
    };
    if (!hasLocalizedContent(localizedContent) && block.localizedContent) {
      payload.localizedContent = null;
    }

    // Build an optimistic block so the list updates immediately
    const originalBlock = block;
    const optimistic: Block = {
      ...block,
      title: title.trim() || block.title,
      config,
      localizedContent: hasLocalizedContent(localizedContent)
        ? localizedContent
        : payload.localizedContent === null
          ? null
          : block.localizedContent,
    };

    // Close sheet & update list immediately (optimistic)
    onUpdated(optimistic);
    onClose();

    // Persist in background; revert on failure
    try {
      const updated = await updateBlock(block.id, payload);
      onUpdated(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('save_error');
      // Let parent handle both the list revert and editor reopen with error
      if (onSaveError) {
        onSaveError(originalBlock, msg);
      } else {
        onUpdated(originalBlock); // fallback revert if no error handler
      }
    }
  }

  return (
    <Sheet open={!!block} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl xl:max-w-4xl">
        {block && config && (
          <>
            <SheetHeader className="mb-6">
              <SheetTitle className="flex items-center gap-2">
                {(() => {
                  const SheetIcon = BLOCK_TYPE_ICONS[block.type];
                  return <SheetIcon className="h-4 w-4 text-muted-foreground" />;
                })()}
                {t('edit_sheet.title')} — {t(`types.${block.type}`)}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">{t('fields.title')}</label>
                <input
                  type="text"
                  placeholder={t('fields.title_placeholder')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  maxLength={200}
                />
              </div>

              <BlockConfigForm
                type={block.type}
                config={config}
                onChange={setConfig}
                localizedContent={localizedContent}
                onLocalizedContentChange={setLocalizedContent}
                artistId={artistId}
                galleryImages={galleryImages}
                textSources={textSources}
                releases={releases}
                recordLabels={recordLabels}
                counterValues={counterValues}
              />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onClose} disabled={saving}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? t('saving') : t('edit_sheet.save')}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Block Row ────────────────────────────────────────────────────────────────

function BlockRow({
  block,
  isFirst,
  isLast,
  isPrimary,
  isDragging,
  dragDisabled,
  onEdit,
  onUpdated,
  onDeleted,
  onMoved,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
  wontRender = false,
  wontRenderReason,
}: {
  block: Block;
  isFirst: boolean;
  isLast: boolean;
  isPrimary: boolean;
  isDragging: boolean;
  dragDisabled: boolean;
  onEdit: () => void;
  onUpdated: (block: Block) => void;
  onDeleted: (id: string) => void;
  onMoved: (id: string, direction: 'up' | 'down') => void;
  onDragStart: (id: string) => void;
  onDragEnter: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (id: string) => void;
  /** When true the block is published but will NOT appear on the public page (e.g. integration not set up). */
  wontRender?: boolean;
  wontRenderReason?: string;
}) {
  const t = useTranslations('blocks');
  const [deleting, setDeleting] = useState(false);
  const thumbnail = getBlockThumbnail(block);

  function handleTogglePublish() {
    // Fire-and-forget: flip immediately, revert silently on failure.
    // No toggling state — the optimistic update is the only visual feedback needed.
    const before = block;
    onUpdated({ ...block, isPublished: !block.isPublished });
    const req = block.isPublished ? unpublishBlock(block.id) : publishBlock(block.id);
    void req.then(onUpdated).catch(() => onUpdated(before));
  }

  async function handleDelete() {
    if (!confirm(t('delete_confirm'))) return;
    setDeleting(true);
    try {
      await deleteBlock(block.id);
      onDeleted(block.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      draggable={!dragDisabled}
      onDragStart={() => onDragStart(block.id)}
      onDragEnter={(e) => {
        e.preventDefault();
        onDragEnter(block.id);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(block.id);
      }}
      onDragEnd={onDragEnd}
      onClick={onEdit}
      className={`group flex cursor-pointer items-center gap-3 rounded-[14px] px-3 py-3 transition-all hover:bg-white/[0.04] ${isDragging ? 'scale-[0.99] opacity-60' : ''}`}
    >
      {/* Drag + order controls */}
      <div className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        <span className="cursor-grab rounded p-1 text-white/20 hover:text-white/50 active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </span>
        <div className="flex flex-col">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoved(block.id, 'up');
            }}
            disabled={isFirst}
            className="rounded p-0.5 text-[9px] text-white/20 hover:text-white/60 disabled:opacity-20"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoved(block.id, 'down');
            }}
            disabled={isLast}
            className="rounded p-0.5 text-[9px] text-white/20 hover:text-white/60 disabled:opacity-20"
          >
            ▼
          </button>
        </div>
      </div>

      {/* Block icon */}
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail}
          alt=""
          className="h-10 w-10 shrink-0 rounded-[10px] border border-white/10 object-cover"
        />
      ) : block.type === 'music_embed' && 'provider' in block.config ? (
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-white/10 ${MUSIC_PROVIDER_BG[block.config.provider] ?? 'bg-white/8'}`}
        >
          <Music2 className="h-4 w-4 text-white" />
        </span>
      ) : block.type === 'video_embed' &&
        'mode' in block.config &&
        block.config.mode === 'latest_video' ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-[#FF0000]/15">
          <Play className="h-4 w-4 text-[#FF0000]" />
        </span>
      ) : (
        (() => {
          const BlockIcon = BLOCK_TYPE_ICONS[block.type];
          return (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-white/5">
              <BlockIcon className="h-4 w-4 text-white/60" />
            </span>
          );
        })()
      )}

      {/* Title + type */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[14px] font-semibold text-white">
            {block.title ?? t(`types.${block.type}`)}
          </p>
          {isPrimary && (
            <span
              className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-[family-name:var(--font-heading)] text-[9px] font-bold uppercase tracking-[1.5px] text-white"
              style={{ background: 'var(--sl-grad)' }}
            >
              Primario
            </span>
          )}
          {wontRender && block.isPublished && (
            <span
              title={
                wontRenderReason ?? 'Este bloque está activo pero no aparece en tu página pública.'
              }
              className="inline-flex shrink-0 cursor-help items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[1px] text-amber-400"
            >
              ⚠ No visible
            </span>
          )}
        </div>
        <p className="text-[12px] text-white/40">
          {t(`types.${block.type}`)}
          <span className="mx-1.5 text-white/20">·</span>
          <span className="text-white/25">— clicks (30d)</span>
        </p>
      </div>

      {/* Edit button — visible on hover */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-semibold text-white/60 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/10 hover:text-white"
      >
        {t('edit')}
      </button>

      {/* Delete — icon only, visible on hover */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void handleDelete();
        }}
        disabled={deleting}
        className="shrink-0 rounded-lg p-1.5 text-white/20 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* Publish toggle */}
      <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          role="switch"
          aria-checked={block.isPublished}
          onClick={(e) => {
            e.stopPropagation();
            handleTogglePublish();
          }}
          className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full transition-colors ${block.isPublished ? 'bg-[#E040FB]' : 'bg-white/20'}`}
        >
          <span
            className={`absolute top-0.5 inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${block.isPublished ? 'translate-x-4' : 'translate-x-0.5'}`}
          />
        </button>
      </div>
    </div>
  );
}

// ─── Main BlockManager ────────────────────────────────────────────────────────

export function BlockManager({
  pageId,
  artistId,
  canUseShopifyIntegration,
  canUseSmartMerch,
  shopifyIsConnected = false,
  smartMerchIsConnected = false,
  userPlan = 'free',
  galleryImages,
  textSources,
  releases,
  recordLabels,
  counterValues,
  username,
  onBlocksChanged,
}: Props) {
  const t = useTranslations('blocks');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [editSaveError, setEditSaveError] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragTargetBlockId, setDragTargetBlockId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBlocks(pageId);
      setBlocks(data);
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }, [pageId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleCreated(block: Block) {
    setBlocks((prev) => [...prev, block]);
    onBlocksChanged?.();
  }

  function handleUpdated(updated: Block) {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    onBlocksChanged?.();
  }

  function handleDeleted(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    onBlocksChanged?.();
  }

  async function handleMoved(id: string, direction: 'up' | 'down') {
    const index = blocks.findIndex((b) => b.id === id);
    if (index === -1) return;
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= blocks.length) return;

    // Optimistic update
    const reordered = [...blocks];
    const blockA = reordered[index]!;
    const blockB = reordered[swapIndex]!;
    reordered[index] = { ...blockA, position: blockB.position };
    reordered[swapIndex] = { ...blockB, position: blockA.position };
    reordered.sort((a, b) => a.position - b.position);
    setBlocks(reordered);
    onBlocksChanged?.();

    try {
      const updated = await reorderBlocks(pageId, {
        blocks: reordered.map((b) => ({ id: b.id, position: b.position })),
      });
      setBlocks(updated);
    } catch {
      // Revert on failure
      void load();
    }
  }

  async function handleDrop(sourceId: string, targetId: string) {
    if (sourceId === targetId) {
      setDraggedBlockId(null);
      setDragTargetBlockId(null);
      return;
    }

    const sourceIndex = blocks.findIndex((block) => block.id === sourceId);
    const targetIndex = blocks.findIndex((block) => block.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedBlockId(null);
      setDragTargetBlockId(null);
      return;
    }

    const reordered = [...blocks];
    const [moved] = reordered.splice(sourceIndex, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);
    const nextBlocks = reordered.map((block, index) => ({ ...block, position: index }));
    setBlocks(nextBlocks);
    setDraggedBlockId(null);
    setDragTargetBlockId(null);
    onBlocksChanged?.();

    try {
      const updated = await reorderBlocks(pageId, {
        blocks: nextBlocks.map((block) => ({ id: block.id, position: block.position })),
      });
      setBlocks(updated);
    } catch {
      void load();
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  const activeCount = blocks.filter((b) => b.isPublished).length;
  const firstPublishedIndex = blocks.findIndex((b) => b.isPublished);
  const planBlockLimit: number = PLAN_BLOCK_LIMITS[userPlan] ?? 5;
  // Pre-compute which block IDs exceed the plan display limit, mirroring the
  // slice applied by loadPublicPage on the backend (published blocks, position ASC).
  const overLimitBlockIds = new Set<string>(
    blocks
      .filter((b) => b.isPublished)
      .slice(planBlockLimit)
      .map((b) => b.id),
  );
  // Gate the "Add Block" button: count ALL blocks (enabled + disabled).
  const isAtBlockLimit = blocks.length >= planBlockLimit;

  return (
    <div className="space-y-4">
      {/* URL row */}
      {username && <BlockManagerUrlRow username={username} t={t} />}

      {/* Blocks panel */}
      <div className="overflow-hidden rounded-[20px] border border-white/8">
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.025] px-5 py-4">
          <p className="font-[family-name:var(--font-heading)] text-[15px] font-bold text-white">
            {t('blocks_label')}
            {blocks.length > 0 && (
              <span className="ml-2 text-[#E040FB]">
                · {activeCount} {t('active_label')}
              </span>
            )}
          </p>
          <button
            onClick={() => !isAtBlockLimit && setCreateOpen(true)}
            disabled={isAtBlockLimit}
            aria-disabled={isAtBlockLimit}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-opacity ${
              isAtBlockLimit ? 'cursor-not-allowed opacity-40' : 'hover:opacity-90'
            }`}
            style={
              isAtBlockLimit
                ? { background: 'rgba(255,255,255,0.15)' }
                : { background: 'var(--sl-grad)' }
            }
          >
            + {t('add_block')}
          </button>
        </div>

        {/* Block limit banner */}
        {isAtBlockLimit && (
          <div className="flex items-start gap-2.5 border-b border-amber-500/20 bg-amber-500/[0.07] px-5 py-3">
            <span className="mt-px shrink-0 text-amber-400">⚠</span>
            <p className="text-[12.5px] leading-snug text-amber-300/90">
              {userPlan === 'pro_plus' ? (
                <>
                  Alcanzaste el límite de {planBlockLimit} bloques de tu plan PRO+. Para agregar más
                  bloques,{' '}
                  <a
                    href="mailto:stagelink.qa@gmail.com"
                    className="font-semibold text-amber-200 underline underline-offset-2 hover:text-white"
                  >
                    contactá a soporte
                  </a>{' '}
                  para migrar a un Plan Custom.
                </>
              ) : (
                <>
                  Alcanzaste el límite de {planBlockLimit} bloques de tu plan{' '}
                  {userPlan === 'pro' ? 'PRO' : 'Free'}. Para agregar más bloques, mejorá tu plan.
                </>
              )}
            </p>
          </div>
        )}

        {/* Block list */}
        {blocks.length === 0 ? (
          <div className="bg-white/[0.015] px-6 py-14 text-center">
            <p className="font-[family-name:var(--font-heading)] text-[16px] font-bold text-white">
              {t('empty_title')}
            </p>
            <p className="mt-1 text-sm text-white/50">{t('empty_description')}</p>
          </div>
        ) : (
          <div className="bg-white/[0.015] px-2 py-2">
            {blocks.map((block, index) => {
              // Detect blocks that are published but won't appear on the public page.
              let wontRender = false;
              let wontRenderReason: string | undefined;

              if (block.isPublished) {
                if (overLimitBlockIds.has(block.id)) {
                  // This block is beyond the plan's public display limit.
                  wontRender = true;
                  const planLabel =
                    userPlan === 'pro_plus' ? 'Pro+' : userPlan === 'pro' ? 'Pro' : 'Free';
                  wontRenderReason = `Tu plan ${planLabel} muestra hasta ${planBlockLimit} bloques en tu página pública. Este bloque no se ve porque supera ese límite. Subí de plan o desactivá otros bloques para que aparezca.`;
                } else if (block.type === 'shopify_store' && !shopifyIsConnected) {
                  wontRender = true;
                  wontRenderReason =
                    'Tu tienda Shopify no está conectada. Configurala en Ajustes → Integraciones para que este bloque aparezca en tu página.';
                } else if (block.type === 'smart_merch') {
                  const cfg = block.config as { selectedProducts?: unknown[] };
                  const hasSelected =
                    Array.isArray(cfg.selectedProducts) && cfg.selectedProducts.length > 0;
                  if (!smartMerchIsConnected) {
                    wontRender = true;
                    wontRenderReason =
                      'Tu cuenta de Printful no está conectada. Configurala en Ajustes → Integraciones.';
                  } else if (!hasSelected) {
                    wontRender = true;
                    wontRenderReason =
                      'No hay productos seleccionados en este bloque. Editalo y elegí los productos de Printful que querés mostrar.';
                  }
                } else if (block.type === 'releases') {
                  const cfg = block.config as { releaseIds?: string[] };
                  const profileReleaseCount = releases?.length ?? 0;
                  const selectedCount = cfg.releaseIds?.length ?? 0;
                  if (profileReleaseCount === 0) {
                    wontRender = true;
                    wontRenderReason =
                      'No tenés lanzamientos cargados en tu perfil. Agregalos en Mi Perfil → Catálogo para que este bloque aparezca.';
                  } else if (selectedCount > 0) {
                    // Explicit selection — check at least one selected ID still exists.
                    const validIds = new Set(releases?.map((r) => r.id) ?? []);
                    const anyValid = cfg.releaseIds!.some((id) => validIds.has(id));
                    if (!anyValid) {
                      wontRender = true;
                      wontRenderReason =
                        'Los lanzamientos seleccionados ya no existen en tu perfil. Editá el bloque y elegí otros.';
                    }
                  }
                } else if (block.type === 'record_labels') {
                  const cfg = block.config as { labelIds?: string[] };
                  const profileLabelCount = recordLabels?.length ?? 0;
                  const selectedCount = cfg.labelIds?.length ?? 0;
                  if (profileLabelCount === 0) {
                    wontRender = true;
                    wontRenderReason =
                      'No tenés sellos cargados en tu perfil. Agregalos en Mi Perfil → Catálogo para que este bloque aparezca.';
                  } else if (selectedCount > 0) {
                    const validIds = new Set(recordLabels?.map((l) => l.id) ?? []);
                    const anyValid = cfg.labelIds!.some((id) => validIds.has(id));
                    if (!anyValid) {
                      wontRender = true;
                      wontRenderReason =
                        'Los sellos seleccionados ya no existen en tu perfil. Editá el bloque y elegí otros.';
                    }
                  }
                } else if (block.type === 'public_counters') {
                  const cfg = block.config as { show?: string[] };
                  const vals = counterValues ?? { eps: 0, labels: 0, collabs: 0 };
                  const shownKeys =
                    cfg.show && cfg.show.length > 0 ? cfg.show : ['eps', 'labels', 'collabs'];
                  const anyVisible = shownKeys.some((k) => (vals[k as keyof typeof vals] ?? 0) > 0);
                  if (!anyVisible) {
                    wontRender = true;
                    wontRenderReason =
                      'Ninguno de los contadores elegidos tiene valor en tu perfil. Cargá EPs, sellos o colaboraciones en Mi Perfil → Catálogo.';
                  }
                }
              }

              return (
                <BlockRow
                  key={block.id}
                  block={block}
                  isFirst={index === 0}
                  isLast={index === blocks.length - 1}
                  isPrimary={index === firstPublishedIndex && firstPublishedIndex !== -1}
                  isDragging={draggedBlockId === block.id || dragTargetBlockId === block.id}
                  dragDisabled={blocks.length <= 1}
                  onEdit={() => setEditingBlock(block)}
                  onUpdated={handleUpdated}
                  onDeleted={handleDeleted}
                  onMoved={handleMoved}
                  onDragStart={(id) => setDraggedBlockId(id)}
                  onDragEnter={(id) => setDragTargetBlockId(id)}
                  onDragEnd={() => {
                    setDraggedBlockId(null);
                    setDragTargetBlockId(null);
                  }}
                  onDrop={(targetId) => {
                    if (draggedBlockId) {
                      void handleDrop(draggedBlockId, targetId);
                    }
                  }}
                  wontRender={wontRender}
                  wontRenderReason={wontRenderReason}
                />
              );
            })}
          </div>
        )}

        {/* Auto-save footer */}
        <div className="flex items-center gap-2 border-t border-white/5 bg-white/[0.01] px-5 py-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
          <span className="text-[11px] text-white/30">{t('auto_saved')}</span>
        </div>
      </div>

      {/* Dialogs */}
      <CreateBlockDialog
        open={createOpen}
        pageId={pageId}
        artistId={artistId}
        canUseShopifyIntegration={canUseShopifyIntegration}
        canUseSmartMerch={canUseSmartMerch}
        galleryImages={galleryImages}
        textSources={textSources}
        releases={releases}
        recordLabels={recordLabels}
        counterValues={counterValues}
        onCreated={handleCreated}
        onClose={() => setCreateOpen(false)}
      />

      <EditBlockSheet
        block={editingBlock}
        artistId={artistId}
        galleryImages={galleryImages}
        textSources={textSources}
        releases={releases}
        recordLabels={recordLabels}
        counterValues={counterValues}
        externalError={editSaveError}
        onUpdated={(updated) => {
          handleUpdated(updated);
          setEditingBlock(null);
          setEditSaveError(null);
        }}
        onClose={() => {
          setEditingBlock(null);
          setEditSaveError(null);
        }}
        onSaveError={(original, msg) => {
          // Revert optimistic update in the block list, then reopen editor with error
          setBlocks((prev) => prev.map((b) => (b.id === original.id ? original : b)));
          setEditSaveError(msg);
          setEditingBlock(original);
        }}
      />
    </div>
  );
}
