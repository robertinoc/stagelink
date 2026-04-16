'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
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
  accessToken: string;
  canUseShopifyIntegration: boolean;
}

// ─── Block type metadata ──────────────────────────────────────────────────────

const BLOCK_TYPE_ICONS: Record<BlockType, string> = {
  links: '🔗',
  music_embed: '🎵',
  video_embed: '🎬',
  email_capture: '✉️',
  text: '📝',
  shopify_store: '🛍️',
};

function hasLocalizedContent(content: BlockLocalizedContent | null | undefined): boolean {
  if (!content) return false;
  return Object.values(content).some((value) => {
    if (!value || typeof value !== 'object') return false;
    return Object.keys(value).length > 0;
  });
}

// ─── Create Block Dialog ──────────────────────────────────────────────────────

function CreateBlockDialog({
  open,
  pageId,
  artistId,
  accessToken,
  canUseShopifyIntegration,
  onCreated,
  onClose,
}: {
  open: boolean;
  pageId: string;
  artistId: string;
  accessToken: string;
  canUseShopifyIntegration: boolean;
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
  const availableBlockTypes = canUseShopifyIntegration
    ? BLOCK_TYPES
    : BLOCK_TYPES.filter((type) => type !== 'shopify_store');

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
    setSaving(true);
    setError(null);
    try {
      const payload: CreateBlockPayload = {
        type: selectedType,
        config,
        ...(title.trim() && { title: title.trim() }),
        ...(hasLocalizedContent(localizedContent) && { localizedContent }),
      };
      const block = await createBlock(pageId, payload, accessToken);
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
      <DialogContent className="max-w-lg">
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
                accessToken={accessToken}
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
  accessToken,
  onUpdated,
  onClose,
}: {
  block: Block | null;
  artistId: string;
  accessToken: string;
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
      const updated = await updateBlock(block.id, payload, accessToken);
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
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
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
                accessToken={accessToken}
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
  accessToken,
  onEdit,
  onUpdated,
  onDeleted,
  onMoved,
}: {
  block: Block;
  isFirst: boolean;
  isLast: boolean;
  accessToken: string;
  onEdit: () => void;
  onUpdated: (block: Block) => void;
  onDeleted: (id: string) => void;
  onMoved: (id: string, direction: 'up' | 'down') => void;
}) {
  const t = useTranslations('blocks');
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleTogglePublish() {
    setToggling(true);
    try {
      const updated = block.isPublished
        ? await unpublishBlock(block.id, accessToken)
        : await publishBlock(block.id, accessToken);
      onUpdated(updated);
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    if (!confirm(t('delete_confirm'))) return;
    setDeleting(true);
    try {
      await deleteBlock(block.id, accessToken);
      onDeleted(block.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="group">
      <CardContent className="flex items-center gap-3 p-4">
        {/* Order controls */}
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onMoved(block.id, 'up')}
            disabled={isFirst}
            title={t('move_up')}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            ▲
          </button>
          <button
            onClick={() => onMoved(block.id, 'down')}
            disabled={isLast}
            title={t('move_down')}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            ▼
          </button>
        </div>

        {/* Icon + info */}
        <span className="text-xl">{BLOCK_TYPE_ICONS[block.type]}</span>
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium text-sm">{block.title ?? t(`types.${block.type}`)}</p>
          <p className="text-xs text-muted-foreground">{t(`types.${block.type}`)}</p>
        </div>

        {/* Status badge */}
        <Badge variant={block.isPublished ? 'default' : 'secondary'} className="shrink-0">
          {block.isPublished ? t('published') : t('draft')}
        </Badge>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" onClick={onEdit}>
            {t('edit')}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleTogglePublish} disabled={toggling}>
            {block.isPublished ? t('unpublish') : t('publish')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={deleting}
            className="text-destructive hover:text-destructive"
          >
            {t('delete')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main BlockManager ────────────────────────────────────────────────────────

export function BlockManager({ pageId, artistId, accessToken, canUseShopifyIntegration }: Props) {
  const t = useTranslations('blocks');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBlocks(pageId, accessToken);
      setBlocks(data);
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }, [pageId, accessToken, t]);

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
      const updated = await reorderBlocks(
        pageId,
        { blocks: reordered.map((b) => ({ id: b.id, position: b.position })) },
        accessToken,
      );
      setBlocks(updated);
    } catch {
      // Revert on failure
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
              accessToken={accessToken}
              onEdit={() => setEditingBlock(block)}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
              onMoved={handleMoved}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateBlockDialog
        open={createOpen}
        pageId={pageId}
        artistId={artistId}
        accessToken={accessToken}
        canUseShopifyIntegration={canUseShopifyIntegration}
        onCreated={handleCreated}
        onClose={() => setCreateOpen(false)}
      />

      <EditBlockSheet
        block={editingBlock}
        artistId={artistId}
        accessToken={accessToken}
        onUpdated={(updated) => {
          handleUpdated(updated);
          setEditingBlock(null);
        }}
        onClose={() => setEditingBlock(null)}
      />
    </div>
  );
}
