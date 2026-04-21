import { ServiceUnavailableException } from '@nestjs/common';
import { SpotifyInsightsProvider } from './spotify-insights.provider';

describe('SpotifyInsightsProvider', () => {
  const originalFetch = global.fetch;
  const originalClientId = process.env['SPOTIFY_CLIENT_ID'];
  const originalClientSecret = process.env['SPOTIFY_CLIENT_SECRET'];

  beforeEach(() => {
    process.env['SPOTIFY_CLIENT_ID'] = 'spotify-client-id';
    process.env['SPOTIFY_CLIENT_SECRET'] = 'spotify-client-secret';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env['SPOTIFY_CLIENT_ID'] = originalClientId;
    process.env['SPOTIFY_CLIENT_SECRET'] = originalClientSecret;
  });

  it('maps partial artist responses without throwing', async () => {
    const provider = new SpotifyInsightsProvider();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: 'spotify-access-token',
            token_type: 'Bearer',
            expires_in: 3600,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: '2jkuh1rhF7xhWCjUvBBbGr',
            name: 'Robertino',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ) as typeof fetch;

    await expect(
      provider.validateArtistReference('https://open.spotify.com/artist/2jkuh1rhF7xhWCjUvBBbGr'),
    ).resolves.toMatchObject({
      ok: true,
      displayName: 'Robertino',
      followersTotal: null,
      popularity: null,
      imageUrl: null,
      externalUrl: 'https://open.spotify.com/artist/2jkuh1rhF7xhWCjUvBBbGr',
    });
  });

  it('returns a useful service error when spotify cannot be reached', async () => {
    const provider = new SpotifyInsightsProvider();
    global.fetch = jest.fn().mockRejectedValue(new Error('socket hang up')) as typeof fetch;

    await expect(
      provider.validateArtistReference('https://open.spotify.com/artist/2jkuh1rhF7xhWCjUvBBbGr'),
    ).rejects.toThrow(new ServiceUnavailableException('Could not reach Spotify auth right now'));
  });
});
