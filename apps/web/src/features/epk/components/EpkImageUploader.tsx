'use client';

import { useRef, useState } from 'react';
import type { AssetDto } from '@stagelink/types';
import { confirmUpload, requestUploadIntent, uploadToS3 } from '@/lib/api/assets';
import { Button } from '@/components/ui/button';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 8 * 1024 * 1024;

interface EpkImageUploaderProps {
  artistId: string;
  onUploaded: (asset: AssetDto) => void;
  disabled?: boolean;
}

export function EpkImageUploader({
  artistId,
  onUploaded,
  disabled = false,
}: EpkImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG and WebP images are allowed.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError('File too large. Maximum size is 8 MB.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const intent = await requestUploadIntent(artistId, 'epk_image', file);
      await uploadToS3(intent.uploadUrl, file);
      const asset = await confirmUpload(intent.assetId);
      onUploaded(asset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || disabled}
      >
        {uploading ? 'Uploading…' : 'Upload EPK image'}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <p className="text-xs text-muted-foreground">JPEG, PNG or WebP · max 8 MB</p>
    </div>
  );
}
