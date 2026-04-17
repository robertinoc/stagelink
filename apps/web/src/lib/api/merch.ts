import { apiFetch } from '@/lib/auth';
import type {
  MerchConnectionValidationResult,
  MerchProviderConnection,
  SmartMerchProduct,
  UpdateMerchConnectionPayload,
  ValidateMerchConnectionPayload,
} from '@stagelink/types';

function normalizeMessage(message: string | string[] | undefined, fallback: string): string {
  if (!message) return fallback;
  return Array.isArray(message) ? message.join(', ') : message;
}

async function readJsonOrThrow<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    throw new Error(normalizeMessage(err.message, fallback));
  }

  return res.json() as Promise<T>;
}

export async function getMerchConnection(
  artistId: string,
  accessToken: string,
): Promise<MerchProviderConnection> {
  const res = await apiFetch(`/api/artists/${artistId}/merch`, {
    accessToken,
    cache: 'no-store',
  });
  return readJsonOrThrow<MerchProviderConnection>(res, 'Failed to load merch settings');
}

export async function validateMerchConnection(
  artistId: string,
  payload: ValidateMerchConnectionPayload,
): Promise<MerchConnectionValidationResult> {
  const res = await fetch(`/api/artists/${artistId}/merch/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return readJsonOrThrow<MerchConnectionValidationResult>(
    res,
    'Could not validate merch provider connection',
  );
}

export async function saveMerchConnection(
  artistId: string,
  payload: UpdateMerchConnectionPayload,
): Promise<MerchProviderConnection> {
  const res = await fetch(`/api/artists/${artistId}/merch`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return readJsonOrThrow<MerchProviderConnection>(res, 'Could not save merch provider settings');
}

export async function listMerchProducts(
  artistId: string,
  limit = 12,
): Promise<SmartMerchProduct[]> {
  const res = await fetch(`/api/artists/${artistId}/merch/products?limit=${limit}`, {
    method: 'GET',
    cache: 'no-store',
  });

  return readJsonOrThrow<SmartMerchProduct[]>(res, 'Could not load merch products');
}
