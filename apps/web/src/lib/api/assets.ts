import { apiFetch } from '@/lib/auth';
import type { AssetDto, AssetKind, UploadIntentResponse } from '@stagelink/types';

/**
 * Request a presigned upload URL from the backend.
 * The backend validates ownership, mime type, and file size.
 */
export async function requestUploadIntent(
  artistId: string,
  kind: AssetKind,
  file: File,
): Promise<UploadIntentResponse> {
  const res = await fetch('/api/assets/upload-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      artistId,
      kind,
      mimeType: file.type,
      sizeBytes: file.size,
      originalFilename: file.name,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `Upload intent failed: ${res.status}`);
  }

  return res.json() as Promise<UploadIntentResponse>;
}

/**
 * Upload file directly to S3 using the presigned PUT URL.
 * The browser sends the raw bytes; no AWS credentials are exposed.
 */
export async function uploadToS3(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`S3 upload failed with status ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Network error during S3 upload'));
    xhr.send(file);
  });
}

/**
 * Notify the backend that the S3 upload completed.
 * The backend marks the asset as `uploaded` and updates the artist.
 */
export async function confirmUpload(assetId: string): Promise<AssetDto> {
  const res = await fetch(`/api/assets/${assetId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? `Confirm upload failed: ${res.status}`,
    );
  }

  return res.json() as Promise<AssetDto>;
}

export async function getArtistAssets(artistId: string, accessToken: string): Promise<AssetDto[]> {
  const res = await apiFetch(`/api/assets/artist/${artistId}`, { accessToken });
  if (!res.ok) throw new Error(`Failed to load assets (${res.status})`);
  return res.json() as Promise<AssetDto[]>;
}
