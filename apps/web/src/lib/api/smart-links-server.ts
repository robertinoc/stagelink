import type { SmartLink } from '@stagelink/types';
import { apiFetch } from '@/lib/auth';

export async function getSmartLinksForArtist(
  artistId: string,
  accessToken: string,
): Promise<SmartLink[]> {
  const res = await apiFetch(`/api/artists/${artistId}/smart-links`, {
    accessToken,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to load smart links (${res.status})`);
  return res.json() as Promise<SmartLink[]>;
}
