import type { SmartLink, CreateSmartLinkPayload, UpdateSmartLinkPayload } from '@stagelink/types';

// ─── List ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/artists/:artistId/smart-links
 * Returns all smart links for an artist, newest first.
 */
export async function getSmartLinks(artistId: string): Promise<SmartLink[]> {
  const res = await fetch(`/api/artists/${encodeURIComponent(artistId)}/smart-links`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to load smart links (${res.status})`);
  return res.json() as Promise<SmartLink[]>;
}

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * POST /api/artists/:artistId/smart-links
 */
export async function createSmartLink(
  artistId: string,
  payload: CreateSmartLinkPayload,
): Promise<SmartLink> {
  const res = await fetch(`/api/artists/${encodeURIComponent(artistId)}/smart-links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    throw new Error(normalizeMessage(err.message) ?? `Failed to create smart link (${res.status})`);
  }
  return res.json() as Promise<SmartLink>;
}

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * PATCH /api/smart-links/:id
 */
export async function updateSmartLink(
  smartLinkId: string,
  payload: UpdateSmartLinkPayload,
): Promise<SmartLink> {
  const res = await fetch(`/api/smart-links/${encodeURIComponent(smartLinkId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    throw new Error(normalizeMessage(err.message) ?? `Failed to update smart link (${res.status})`);
  }
  return res.json() as Promise<SmartLink>;
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * DELETE /api/smart-links/:id
 */
export async function deleteSmartLink(smartLinkId: string): Promise<void> {
  const res = await fetch(`/api/smart-links/${encodeURIComponent(smartLinkId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete smart link (${res.status})`);
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function normalizeMessage(msg: string | string[] | undefined): string | undefined {
  if (!msg) return undefined;
  return Array.isArray(msg) ? msg.join(', ') : msg;
}
