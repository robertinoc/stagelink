import { apiFetch } from '@/lib/auth';
import type {
  ShopifyConnection,
  ShopifyConnectionValidationResult,
  UpdateShopifyConnectionPayload,
  ValidateShopifyConnectionPayload,
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

export async function getShopifyConnection(
  artistId: string,
  accessToken: string,
): Promise<ShopifyConnection> {
  const res = await apiFetch(`/api/artists/${artistId}/shopify`, {
    accessToken,
    cache: 'no-store',
  });
  return readJsonOrThrow<ShopifyConnection>(res, 'Failed to load Shopify connection');
}

export async function validateShopifyConnection(
  artistId: string,
  payload: ValidateShopifyConnectionPayload,
): Promise<ShopifyConnectionValidationResult> {
  const res = await fetch(`/api/artists/${artistId}/shopify/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = await readJsonOrThrow<ShopifyConnectionValidationResult>(
    res,
    'Could not validate Shopify connection',
  );
  return json;
}

export async function saveShopifyConnection(
  artistId: string,
  payload: UpdateShopifyConnectionPayload,
): Promise<ShopifyConnection> {
  const res = await fetch(`/api/artists/${artistId}/shopify`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = await readJsonOrThrow<ShopifyConnection>(res, 'Could not save Shopify connection');
  return json;
}

export async function disconnectShopifyConnection(artistId: string): Promise<ShopifyConnection> {
  const res = await fetch(`/api/artists/${artistId}/shopify`, {
    method: 'DELETE',
    cache: 'no-store',
  });

  return readJsonOrThrow<ShopifyConnection>(res, 'Could not disconnect Shopify connection');
}
