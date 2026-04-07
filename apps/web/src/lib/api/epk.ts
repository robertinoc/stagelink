import { apiFetch } from '@/lib/auth';
import type { EpkEditorResponse, PublicEpkResponse, UpdateEpkPayload } from '@stagelink/types';

export async function getArtistEpk(
  artistId: string,
  accessToken: string,
): Promise<EpkEditorResponse> {
  const res = await apiFetch(`/api/artists/${artistId}/epk`, { accessToken });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    const message = Array.isArray(err.message)
      ? err.message.join(', ')
      : (err.message ?? `Failed to load EPK (${res.status})`);
    throw new Error(message);
  }

  return res.json() as Promise<EpkEditorResponse>;
}

export async function updateArtistEpk(
  artistId: string,
  payload: UpdateEpkPayload,
): Promise<EpkEditorResponse> {
  const res = await fetch(`/api/artists/${artistId}/epk`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    const message = Array.isArray(err.message)
      ? err.message.join(', ')
      : (err.message ?? `Failed to update EPK (${res.status})`);
    throw new Error(message);
  }

  return res.json() as Promise<EpkEditorResponse>;
}

export async function publishArtistEpk(artistId: string): Promise<EpkEditorResponse> {
  const res = await fetch(`/api/artists/${artistId}/epk/publish`, {
    method: 'POST',
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    const message = Array.isArray(err.message)
      ? err.message.join(', ')
      : (err.message ?? `Failed to publish EPK (${res.status})`);
    throw new Error(message);
  }

  return res.json() as Promise<EpkEditorResponse>;
}

export async function unpublishArtistEpk(artistId: string): Promise<EpkEditorResponse> {
  const res = await fetch(`/api/artists/${artistId}/epk/unpublish`, {
    method: 'POST',
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    const message = Array.isArray(err.message)
      ? err.message.join(', ')
      : (err.message ?? `Failed to unpublish EPK (${res.status})`);
    throw new Error(message);
  }

  return res.json() as Promise<EpkEditorResponse>;
}

export async function fetchPublicEpk(username: string): Promise<PublicEpkResponse | null> {
  const configuredUrl =
    process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001';
  const trimmedUrl = configuredUrl.replace(/\/+$/, '');
  const apiBaseUrl = trimmedUrl.endsWith('/api') ? trimmedUrl.slice(0, -4) : trimmedUrl;
  const res = await fetch(
    `${apiBaseUrl}/api/public/epk/by-username/${encodeURIComponent(username)}`,
    {
      cache: 'no-store',
    },
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load public EPK (${res.status})`);
  return res.json() as Promise<PublicEpkResponse>;
}
