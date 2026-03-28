import { apiFetch } from '@/lib/auth';
import type {
  Block,
  CreateBlockPayload,
  UpdateBlockPayload,
  ReorderBlocksPayload,
} from '@stagelink/types';

// ─── List ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/pages/:pageId/blocks
 * Returns all blocks for a page ordered by position.
 */
export async function getBlocks(pageId: string, accessToken: string): Promise<Block[]> {
  const res = await apiFetch(`/api/pages/${pageId}/blocks`, { accessToken });
  if (!res.ok) return [];
  return res.json() as Promise<Block[]>;
}

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * POST /api/pages/:pageId/blocks
 * Creates a new block. Throws on non-2xx with the backend error message.
 */
export async function createBlock(
  pageId: string,
  payload: CreateBlockPayload,
  accessToken: string,
): Promise<Block> {
  const res = await apiFetch(`/api/pages/${pageId}/blocks`, {
    method: 'POST',
    accessToken,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    throw new Error(normalizeMessage(err.message) ?? `Failed to create block (${res.status})`);
  }
  return res.json() as Promise<Block>;
}

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * PATCH /api/blocks/:blockId
 * Updates title and/or config. Throws on non-2xx.
 */
export async function updateBlock(
  blockId: string,
  payload: UpdateBlockPayload,
  accessToken: string,
): Promise<Block> {
  const res = await apiFetch(`/api/blocks/${blockId}`, {
    method: 'PATCH',
    accessToken,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    throw new Error(normalizeMessage(err.message) ?? `Failed to update block (${res.status})`);
  }
  return res.json() as Promise<Block>;
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * DELETE /api/blocks/:blockId
 * Throws on non-2xx.
 */
export async function deleteBlock(blockId: string, accessToken: string): Promise<void> {
  const res = await apiFetch(`/api/blocks/${blockId}`, {
    method: 'DELETE',
    accessToken,
  });
  if (!res.ok) {
    throw new Error(`Failed to delete block (${res.status})`);
  }
}

// ─── Reorder ──────────────────────────────────────────────────────────────────

/**
 * PATCH /api/pages/:pageId/blocks/reorder
 * Returns the updated ordered block list. Throws on non-2xx.
 */
export async function reorderBlocks(
  pageId: string,
  payload: ReorderBlocksPayload,
  accessToken: string,
): Promise<Block[]> {
  const res = await apiFetch(`/api/pages/${pageId}/blocks/reorder`, {
    method: 'PATCH',
    accessToken,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to reorder blocks (${res.status})`);
  }
  return res.json() as Promise<Block[]>;
}

// ─── Publish / Unpublish ──────────────────────────────────────────────────────

/**
 * POST /api/blocks/:blockId/publish
 */
export async function publishBlock(blockId: string, accessToken: string): Promise<Block> {
  const res = await apiFetch(`/api/blocks/${blockId}/publish`, {
    method: 'POST',
    accessToken,
  });
  if (!res.ok) {
    throw new Error(`Failed to publish block (${res.status})`);
  }
  return res.json() as Promise<Block>;
}

/**
 * POST /api/blocks/:blockId/unpublish
 */
export async function unpublishBlock(blockId: string, accessToken: string): Promise<Block> {
  const res = await apiFetch(`/api/blocks/${blockId}/unpublish`, {
    method: 'POST',
    accessToken,
  });
  if (!res.ok) {
    throw new Error(`Failed to unpublish block (${res.status})`);
  }
  return res.json() as Promise<Block>;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function normalizeMessage(msg: string | string[] | undefined): string | undefined {
  if (!msg) return undefined;
  return Array.isArray(msg) ? msg.join(', ') : msg;
}
