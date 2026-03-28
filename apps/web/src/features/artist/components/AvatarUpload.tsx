'use client';

import { useEffect, useRef, useState } from 'react';
import { confirmUpload, requestUploadIntent, uploadToS3 } from '@/lib/api/assets';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

interface AvatarUploadProps {
  artistId: string;
  currentAvatarUrl?: string | null;
  accessToken: string;
  onSuccess: (deliveryUrl: string) => void;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export function AvatarUpload({
  artistId,
  currentAvatarUrl,
  accessToken,
  onSuccess,
}: AvatarUploadProps) {
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

  const displayUrl = preview ?? currentAvatarUrl ?? null;

  function handleClick() {
    inputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG and WebP images are allowed.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('File too large. Maximum size is 5 MB.');
      return;
    }

    // Revoke previous blob URL before creating a new one
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    // Local preview
    const objectUrl = URL.createObjectURL(file);
    blobUrlRef.current = objectUrl;
    setPreview(objectUrl);
    setError(null);
    setState('uploading');
    setProgress(0);

    try {
      // 1. Request upload intent from backend
      const intent = await requestUploadIntent(artistId, 'avatar', file, accessToken);

      // 2. Upload directly to S3
      await uploadToS3(intent.uploadUrl, file, setProgress);

      // 3. Confirm with backend — backend updates artist.avatarUrl + avatarAssetId
      const asset = await confirmUpload(intent.assetId, accessToken);

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
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar preview */}
      <button
        type="button"
        onClick={handleClick}
        className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-border hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Upload avatar"
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar preview"
            className="h-full w-full object-cover transition-opacity group-hover:opacity-70"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted-foreground">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-xs font-medium text-white">Change</span>
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
        <div className="w-24">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-center text-xs text-muted-foreground">{progress}%</p>
        </div>
      )}
      {state === 'success' && (
        <p className="text-xs text-green-600 dark:text-green-400">Avatar updated ✓</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}

      <p className="text-xs text-muted-foreground">JPEG, PNG or WebP · max 5 MB</p>
    </div>
  );
}
