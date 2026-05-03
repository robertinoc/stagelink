'use client';

import { useEffect, useRef, useState } from 'react';
import { confirmUpload, requestUploadIntent, resolveMimeType, uploadToS3 } from '@/lib/api/assets';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

interface CoverUploadProps {
  artistId: string;
  currentCoverUrl?: string | null;
  onSuccess: (deliveryUrl: string) => void;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export function CoverUpload({ artistId, currentCoverUrl, onSuccess }: CoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null); // tracks current blob URL for cleanup
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Revoke blob URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const displayUrl = preview ?? currentCoverUrl ?? null;

  function handleClick() {
    inputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const mimeType = resolveMimeType(file);
    if (!ALLOWED_TYPES.includes(mimeType)) {
      setError('Only JPEG, PNG and WebP images are allowed.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('File too large. Maximum size is 8 MB.');
      return;
    }

    // Revoke previous blob URL before creating a new one
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    blobUrlRef.current = objectUrl;
    setPreview(objectUrl);
    setError(null);
    setState('uploading');
    setProgress(0);

    try {
      const intent = await requestUploadIntent(artistId, 'cover', file);
      await uploadToS3(intent.uploadUrl, file, setProgress);
      const asset = await confirmUpload(intent.assetId);

      // Revoke blob URL — CDN URL is now available
      URL.revokeObjectURL(objectUrl);
      blobUrlRef.current = null;
      setPreview(null);

      setState('success');
      if (asset.deliveryUrl) onSuccess(asset.deliveryUrl);
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setPreview(null);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Cover preview */}
      <button
        type="button"
        onClick={handleClick}
        className="group relative h-32 w-full overflow-hidden rounded-lg border-2 border-dashed border-border hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Upload cover image"
      >
        {displayUrl ? (
          // `displayUrl` may be a transient blob: URL (URL.createObjectURL) that
          // next/image cannot optimize — it only handles static or CDN URLs.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt="Cover preview"
            className="h-full w-full object-cover transition-opacity group-hover:opacity-70"
          />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs">Upload cover image</span>
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-sm font-medium text-white">Change cover</span>
        </span>
      </button>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Status */}
      {state === 'uploading' && (
        <div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Uploading… {progress}%</p>
        </div>
      )}
      {state === 'success' && (
        <p className="text-xs text-green-600 dark:text-green-400">Cover updated ✓</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}

      <p className="text-xs text-muted-foreground">
        JPEG, PNG or WebP · max 8 MB · recommended 1500×500 px
      </p>
    </div>
  );
}
