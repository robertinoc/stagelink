import { APIRequestContext } from '@playwright/test';

export async function deleteTestArtistPage(
  request: APIRequestContext,
  username: string,
): Promise<void> {
  await request.delete(`/api/pages/${username}`);
}
