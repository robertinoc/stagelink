'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AvatarUpload } from './AvatarUpload';
import { CoverUpload } from './CoverUpload';

interface ProfileImagesSectionProps {
  artistId: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  onAvatarChange: (url: string) => void;
  onCoverChange: (url: string) => void;
}

/**
 * Images section for the profile editor.
 *
 * Uploads are IMMEDIATE — they bypass the main form's save flow and go
 * directly through the presigned URL pipeline (intent → S3 → confirm).
 * The parent component updates its artist state via the callback props.
 */
export function ProfileImagesSection({
  artistId,
  avatarUrl,
  coverUrl,
  onAvatarChange,
  onCoverChange,
}: ProfileImagesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Images</CardTitle>
        <CardDescription>
          Changes are saved immediately after uploading — no need to click Save.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Cover */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Cover image</p>
          <CoverUpload
            artistId={artistId}
            currentCoverUrl={coverUrl}
            onSuccess={onCoverChange}
          />
        </div>

        {/* Avatar */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Profile picture</p>
          <AvatarUpload
            artistId={artistId}
            currentAvatarUrl={avatarUrl}
            onSuccess={onAvatarChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
