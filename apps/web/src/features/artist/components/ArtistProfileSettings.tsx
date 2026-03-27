'use client';

import { useEffect, useState } from 'react';
import { AvatarUpload } from './AvatarUpload';
import { CoverUpload } from './CoverUpload';

interface ArtistProfileSettingsProps {
  accessToken: string;
}

interface ArtistData {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4001';

export function ArtistProfileSettings({ accessToken }: ArtistProfileSettingsProps) {
  const [artist, setArtist] = useState<ArtistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch current user's artist via /api/auth/me → artistIds[0]
    async function load() {
      try {
        const meRes = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!meRes.ok) throw new Error('Failed to load user');
        const me = (await meRes.json()) as { artistIds: string[] };

        const artistId = me.artistIds[0];
        if (!artistId) {
          setError('No artist profile found. Create one first.');
          return;
        }

        // Fetch artist data
        const artistRes = await fetch(`${API_URL}/api/artists/${artistId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!artistRes.ok) throw new Error('Failed to load artist');
        const artistData = (await artistRes.json()) as ArtistData;
        setArtist(artistData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load artist data');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        Loading artist profile…
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        {error ?? 'Artist profile not found.'}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cover section */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Cover Image</h2>
        <CoverUpload
          artistId={artist.id}
          currentCoverUrl={artist.coverUrl}
          accessToken={accessToken}
          onSuccess={(url) => setArtist((a) => (a ? { ...a, coverUrl: url } : a))}
        />
      </div>

      {/* Avatar section */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Profile Picture</h2>
        <AvatarUpload
          artistId={artist.id}
          currentAvatarUrl={artist.avatarUrl}
          accessToken={accessToken}
          onSuccess={(url) => setArtist((a) => (a ? { ...a, avatarUrl: url } : a))}
        />
      </div>
    </div>
  );
}
