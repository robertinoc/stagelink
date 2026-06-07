'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Check,
  Copy,
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
  username?: string;
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
};

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

function getBlockConfigValidationMessage(config: BlockConfig | null): string | null {
  if (!config || !('provider' in config)) return null;

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
    const validationMessage = getBlockConfigValidationMessage(config);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl xl:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('create_dialog.title')}</DialogTitle>
          <DialogDescription>{t('create_dialog.subtitle')}</DialogDescription>
        </DialogHeader>

        {!selectedType ? (
          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
            {availableBlockTypes.map((type) => {
              const TypeIcon = BLOCK_TYPE_ICONS[type];
              return (
                <button
                  key={type}
                  onClick={() => selectType(type)}
                  className="flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <TypeIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{t(`types.${type}`)}</span>
                  <span className="text-xs text-muted-foreground">
                    {t(`type_descriptions.${type}`)}
                  </span>
                </button>
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
  onUpdated,
  onClose,
}: {
  block: Block | null;
  artistId: string;
  galleryImages?: Props['galleryImages'];
  textSources?: Props['textSources'];
  onUpdated: (block: Block) => void;
  onClose: () => void;
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
      setError(null);
    }
  }, [block]);

  async function handleSave() {
    if (!block || !config) return;
    const validationMessage = getBlockConfigValidationMessage(config);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: UpdateBlockPayload = {
        config,
        ...(title.trim() !== (block.title ?? '') && { title: title.trim() || undefined }),
        ...(hasLocalizedContent(localizedContent) && { localizedContent }),
      };
      if (!hasLocalizedContent(localizedContent) && block.localizedContent) {
        payload.localizedContent = null;
      }
      const updated = await updateBlock(block.id, payload);
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('save_error'));
    } finally {
      setSaving(false);
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
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const thumbnail = getBlockThumbnail(block);

  async function handleTogglePublish() {
    setToggling(true);
    try {
      const updated = block.isPublished
        ? await unpublishBlock(block.id)
        : await publishBlock(block.id);
      onUpdated(updated);
    } finally {
      setToggling(false);
    }
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
        {toggling && (
          <span className="text-[10px] text-white/40 animate-pulse">
            {block.isPublished ? t('deactivating') : t('activating')}
          </span>
        )}
        <button
          type="button"
          role="switch"
          aria-checked={block.isPublished}
          onClick={(e) => {
            e.stopPropagation();
            void handleTogglePublish();
          }}
          disabled={toggling}
          className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full transition-colors ${block.isPublished ? 'bg-[#E040FB]' : 'bg-white/20'} ${toggling ? 'opacity-60' : ''}`}
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
  username,
}: Props) {
  const t = useTranslations('blocks');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
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
  }

  function handleUpdated(updated: Block) {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }

  function handleDeleted(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
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
  // Count published blocks in position order to know which ones exceed the plan limit.
  // Mirrors the slice applied by loadPublicPage on the backend.
  let publishedSoFar = 0;

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
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--sl-grad)' }}
          >
            + {t('add_block')}
          </button>
        </div>

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
                publishedSoFar += 1;

                if (publishedSoFar > planBlockLimit) {
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
        onCreated={handleCreated}
        onClose={() => setCreateOpen(false)}
      />

      <EditBlockSheet
        block={editingBlock}
        artistId={artistId}
        galleryImages={galleryImages}
        textSources={textSources}
        onUpdated={(updated) => {
          handleUpdated(updated);
          setEditingBlock(null);
        }}
        onClose={() => setEditingBlock(null)}
      />
    </div>
  );
}
