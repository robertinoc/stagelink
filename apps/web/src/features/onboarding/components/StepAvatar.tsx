'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { requestUploadIntent, uploadToS3, confirmUpload } from '@/lib/api/assets';

interface StepAvatarProps {
  artistId: string;
  accessToken: string;
  onComplete: () => void;
  onSkip: () => void;
}

export function StepAvatar({ artistId, accessToken, onComplete, onSkip }: StepAvatarProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.');
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setProgress(0);

    try {
      // Step 1: Request presigned URL
      const intent = await requestUploadIntent(artistId, 'avatar', file, accessToken);
      // Step 2: Upload to S3
      await uploadToS3(intent.uploadUrl, file, (pct) => setProgress(pct));
      // Step 3: Confirm upload (this also links the asset to the artist via confirmUpload)
      await confirmUpload(intent.assetId, accessToken);
      setUploading(false);
      onComplete();
    } catch (err) {
      setUploading(false);
      setError('Upload failed. You can skip this step and add a photo later.');
      console.error('Avatar upload error:', err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Add a profile photo</h2>
        <p className="text-muted-foreground">
          Optional — you can always add or change it later from your settings.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        {/* Avatar preview */}
        <button
          type="button"
          disabled={uploading}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted transition-colors hover:border-primary disabled:cursor-not-allowed"
          aria-label="Upload profile photo"
        >
          {preview ? (
            <img src={preview} alt="Avatar preview" className="h-full w-full object-cover" />
          ) : (
            <span className="text-4xl">📷</span>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </button>

        {uploading && (
          <div className="w-full max-w-xs">
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-center text-xs text-muted-foreground">{progress}%</p>
          </div>
        )}

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFileSelect(file);
          }}
        />

        {!uploading && (
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {preview ? 'Change photo' : 'Choose photo'}
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onSkip} disabled={uploading}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}
