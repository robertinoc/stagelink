'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { BadgeCheck, CircleDashed, EyeOff, GripVertical, Pencil, Trash2 } from 'lucide-react';
import type {
  Block,
  BlockType,
  BlockConfig,
  BlockLocalizedContent,
  CreateBlockPayload,
  UpdateBlockPayload,
} from '@stagelink/types';
import { BLOCK_TYPES } from '@stagelink/types';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  galleryImages?: string[];
  textSources?: Array<{
    id: string;
    label: string;
    body: string;
  }>;
}

// ─── Block type metadata ──────────────────────────────────────────────────────

const BLOCK_TYPE_ICONS: Record<BlockType, string> = {
  links: '🔗',
  music_embed: '🎵',
  video_embed: '🎬',
  email_capture: '✉️',
  text: '📝',
  image_gallery: '🖼️',
  shopify_store: '🛍️',
  smart_merch: '👕',
};

const BLOCK_TYPE_ACCENTS: Record<
  BlockType,
  {
    border: string;
    background: string;
    preview: string;
  }
> = {
  links: {
    border: 'border-slate-500/25',
    background: 'bg-slate-500/8',
    preview: 'text-slate-300',
  },
  music_embed: {
    border: 'border-emerald-500/25',
    background: 'bg-emerald-500/8',
    preview: 'text-emerald-200',
  },
  video_embed: {
    border: 'border-rose-500/25',
    background: 'bg-rose-500/8',
    preview: 'text-rose-200',
  },
  email_capture: {
    border: 'border-amber-500/25',
    background: 'bg-amber-500/8',
    preview: 'text-amber-200',
  },
  text: {
    border: 'border-zinc-500/25',
    background: 'bg-zinc-500/8',
    preview: 'text-zinc-300',
  },
  image_gallery: {
    border: 'border-indigo-500/25',
    background: 'bg-indigo-500/8',
    preview: 'text-indigo-200',
  },
  shopify_store: {
    border: 'border-orange-500/25',
    background: 'bg-orange-500/8',
    preview: 'text-orange-200',
  },
  smart_merch: {
    border: 'border-cyan-500/25',
    background: 'bg-cyan-500/8',
    preview: 'text-cyan-200',
  },
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

function getBlockPreview(block: Block, t: ReturnType<typeof useTranslations<'blocks'>>) {
  switch (block.type) {
    case 'text': {
      const body = 'body' in block.config ? block.config.body : '';
      return body?.trim() ? body.trim().slice(0, 140) : t('type_descriptions.text');
    }
    case 'video_embed': {
      const provider = 'provider' in block.config ? block.config.provider : '';
      const sourceUrl = 'sourceUrl' in block.config ? block.config.sourceUrl : '';
      return sourceUrl ? `${provider} • ${sourceUrl}` : t('type_descriptions.video_embed');
    }
    case 'music_embed': {
      const provider = 'provider' in block.config ? block.config.provider : '';
      const sourceUrl = 'sourceUrl' in block.config ? block.config.sourceUrl : '';
      return sourceUrl ? `${provider} • ${sourceUrl}` : t('type_descriptions.music_embed');
    }
    case 'links': {
      const items = 'items' in block.config ? block.config.items : [];
      if (!items?.length) return t('type_descriptions.links');
      return items
        .slice(0, 2)
        .map((item) => item.label || item.url)
        .filter(Boolean)
        .join(' • ');
    }
    case 'shopify_store': {
      const products = 'products' in block.config ? block.config.products : [];
      if (!products?.length) return t('type_descriptions.shopify_store');
      return `${products.length} products ready to show`;
    }
    case 'image_gallery': {
      const imageUrls = 'imageUrls' in block.config ? block.config.imageUrls : [];
      return imageUrls?.length
        ? `${imageUrls.length} images selected`
        : t('type_descriptions.image_gallery');
    }
    case 'smart_merch': {
      const products = 'products' in block.config ? block.config.products : [];
      const selectedProducts =
        'selectedProducts' in block.config ? block.config.selectedProducts : [];
      const count = products?.length || selectedProducts?.length || 0;
      return count > 0 ? `${count} merch products selected` : t('type_descriptions.smart_merch');
    }
    case 'email_capture': {
      const headline = 'headline' in block.config ? block.config.headline : '';
      return headline?.trim() || t('type_descriptions.email_capture');
    }
    default:
      return t(`type_descriptions.${block.type}`);
  }
}

function getBlockThumbnail(block: Block): string | null {
  switch (block.type) {
    case 'video_embed':
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
          <div className="grid grid-cols-2 gap-3 pt-2">
            {availableBlockTypes.map((type) => (
              <button
                key={type}
                onClick={() => selectType(type)}
                className="flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
              >
                <span className="text-2xl">{BLOCK_TYPE_ICONS[type]}</span>
                <span className="font-medium">{t(`types.${type}`)}</span>
                <span className="text-xs text-muted-foreground">
                  {t(`type_descriptions.${type}`)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{BLOCK_TYPE_ICONS[selectedType]}</span>
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
                <span>{BLOCK_TYPE_ICONS[block.type]}</span>
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
}: {
  block: Block;
  isFirst: boolean;
  isLast: boolean;
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
}) {
  const t = useTranslations('blocks');
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const accent = BLOCK_TYPE_ACCENTS[block.type];
  const preview = getBlockPreview(block, t);
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
    <Card
      draggable={!dragDisabled}
      onDragStart={() => onDragStart(block.id)}
      onDragEnter={(event) => {
        event.preventDefault();
        onDragEnter(block.id);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(block.id);
      }}
      onDragEnd={onDragEnd}
      className={`group cursor-pointer transition-all ${
        accent.border
      } ${accent.background} ${isDragging ? 'scale-[0.99] opacity-70' : ''}`}
      onClick={onEdit}
    >
      <CardContent className="flex items-start gap-3 p-4">
        {/* Order controls */}
        <div className="flex items-center gap-2 pt-1">
          <span
            className="cursor-grab rounded-md border border-white/10 bg-white/5 p-1 text-muted-foreground active:cursor-grabbing"
            title={t('move_up')}
            onClick={(event) => event.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </span>
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => onMoved(block.id, 'up')}
              disabled={isFirst}
              title={t('move_up')}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => onMoved(block.id, 'down')}
              disabled={isLast}
              title={t('move_down')}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              ▼
            </button>
          </div>
        </div>

        {/* Icon + info */}
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt=""
            className="mt-0.5 h-12 w-12 rounded-xl border border-white/10 object-cover"
          />
        ) : (
          <span className="mt-0.5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/10 text-xl">
            {BLOCK_TYPE_ICONS[block.type]}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm">{block.title ?? t(`types.${block.type}`)}</p>
          <p className="text-xs text-muted-foreground">{t(`types.${block.type}`)}</p>
          <p className={`mt-1 line-clamp-2 text-xs ${accent.preview}`}>{preview}</p>
        </div>

        {/* Status badge */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge
            variant={block.isPublished ? 'default' : 'secondary'}
            className={block.isPublished ? 'bg-emerald-500/90 text-white' : ''}
          >
            {block.isPublished ? t('published') : t('draft')}
          </Badge>

          <div className="flex flex-wrap items-center justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="mr-1 h-3.5 w-3.5" />
              {t('edit')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                void handleTogglePublish();
              }}
              disabled={toggling}
            >
              {block.isPublished ? (
                <>
                  <EyeOff className="mr-1 h-3.5 w-3.5" />
                  {t('unpublish')}
                </>
              ) : (
                <>
                  <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                  {t('publish')}
                </>
              )}
            </Button>
            {!block.isPublished ? (
              <Badge variant="outline" className="hidden sm:inline-flex">
                <CircleDashed className="mr-1 h-3 w-3" />
                {t('draft')}
              </Badge>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                void handleDelete();
              }}
              disabled={deleting}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              {t('delete')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main BlockManager ────────────────────────────────────────────────────────

export function BlockManager({
  pageId,
  artistId,
  canUseShopifyIntegration,
  canUseSmartMerch,
  galleryImages,
  textSources,
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {blocks.length} block{blocks.length !== 1 ? 's' : ''}
        </p>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          + {t('add_block')}
        </Button>
      </div>

      {/* Block list */}
      {blocks.length === 0 ? (
        <div className="rounded-lg border border-dashed px-6 py-12 text-center">
          <p className="font-medium">{t('empty_title')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('empty_description')}</p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            + {t('add_block')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {blocks.map((block, index) => (
            <BlockRow
              key={block.id}
              block={block}
              isFirst={index === 0}
              isLast={index === blocks.length - 1}
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
            />
          ))}
        </div>
      )}

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
