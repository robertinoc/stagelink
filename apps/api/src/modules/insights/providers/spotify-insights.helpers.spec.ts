import { normalizeSpotifyArtistId, resolveSpotifyInsightsMarket } from './spotify-insights.helpers';

describe('spotify insights helpers', () => {
  it('normalizes artist ids from url, uri, and raw id', () => {
    const artistId = '1Xyo4u8uXC1ZmMpatF05PJ';

    expect(normalizeSpotifyArtistId(`https://open.spotify.com/artist/${artistId}`)).toBe(artistId);
    expect(normalizeSpotifyArtistId(`spotify:artist:${artistId}`)).toBe(artistId);
    expect(normalizeSpotifyArtistId(artistId)).toBe(artistId);
  });

  it('uses a safe default market when none is configured', () => {
    expect(resolveSpotifyInsightsMarket()).toBe('US');
    expect(resolveSpotifyInsightsMarket('ar')).toBe('AR');
  });
});
