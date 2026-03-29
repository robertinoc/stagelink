import { apiFetch } from '@/lib/auth';
import type { SmartLink, CreateSmartLinkPayload, UpdateSmartLinkPayload } from '@stagelink/types';

// ─── List ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/artists/:artistId/smart-links
 * Returns all smart links for an artist, newest first.
 */
export async function getSmartLinks(artistId: string, accessToken: string): Promise<SmartLink[]> {
  const res = await apiFetch(`/api/artists/${artistId}/smart-links`, { accessToken });
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
  accessToken: string,
): Promise<SmartLink> {
  const res = await apiFetch(`/api/artists/${artistId}/smart-links`, {
    method: 'POST',
    accessToken,
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
  accessToken: string,
): Promise<SmartLink> {
  const res = await apiFetch(`/api/smart-links/${smartLinkId}`, {
    method: 'PATCH',
    accessToken,
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
export async function deleteSmartLink(smartLinkId: string, accessToken: string): Promise<void> {
  const res = await apiFetch(`/api/smart-links/${smartLinkId}`, {
    method: 'DELETE',
    accessToken,
  });
  if (!res.ok) throw new Error(`Failed to delete smart link (${res.status})`);
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function normalizeMessage(msg: string | string[] | undefined): string | undefined {
  if (!msg) return undefined;
  return Array.isArray(msg) ? msg.join(', ') : msg;
}
