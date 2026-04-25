import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { SoundCloudInsightsProvider } from './soundcloud-insights.provider';

function makeProvider(clientId = 'test_client_id') {
  process.env['SOUNDCLOUD_CLIENT_ID'] = clientId;
  return new SoundCloudInsightsProvider();
}

function clearEnv() {
  delete process.env['SOUNDCLOUD_CLIENT_ID'];
}

const MOCK_USER = {
  id: 1234567,
  permalink: 'theweeknd',
  username: 'The Weeknd',
  permalink_url: 'https://soundcloud.com/theweeknd',
  avatar_url: 'https://i1.sndcdn.com/avatars-000-large.jpg',
  followers_count: 5000000,
  followings_count: 120,
  track_count: 42,
  likes_count: 3000,
  description: 'XO',
  city: 'Toronto',
  country_code: 'CA',
  kind: 'user',
};

const MOCK_TRACK = {
  id: 9876,
  title: 'Blinding Lights',
  permalink_url: 'https://soundcloud.com/theweeknd/blinding-lights',
  playback_count: 1500000,
  likes_count: 75000,
  artwork_url: 'https://i1.sndcdn.com/artworks-000-large.jpg',
  genre: 'Pop',
};

describe('SoundCloudInsightsProvider', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    clearEnv();
  });

  describe('getCapabilities()', () => {
    it('returns connectionFlowReady: true when SOUNDCLOUD_CLIENT_ID is set', () => {
      const provider = makeProvider();
      const caps = provider.getCapabilities();
      expect(caps.connectionFlowReady).toBe(true);
      expect(caps.platform).toBe('soundcloud');
      expect(caps.connectionMethod).toBe('reference');
      expect(caps.requiresArtistOwnedAccount).toBe(false);
    });

    it('returns connectionFlowReady: false when SOUNDCLOUD_CLIENT_ID is missing', () => {
      clearEnv();
      const provider = new SoundCloudInsightsProvider();
      expect(provider.getCapabilities().connectionFlowReady).toBe(false);
    });
  });

  describe('validateProfileReference()', () => {
    it('throws ServiceUnavailableException when not configured', async () => {
      clearEnv();
      const provider = new SoundCloudInsightsProvider();
      await expect(provider.validateProfileReference('theweeknd')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('throws BadRequestException for empty input', async () => {
      const provider = makeProvider();
      await expect(provider.validateProfileReference('')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for a non-SoundCloud URL', async () => {
      const provider = makeProvider();
      await expect(
        provider.validateProfileReference('https://spotify.com/artist/xxx'),
      ).rejects.toThrow(BadRequestException);
    });

    it('resolves a valid profile and returns the validation result', async () => {
      const provider = makeProvider();
      const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(MOCK_USER),
      } as unknown as Response);

      const result = await provider.validateProfileReference('https://soundcloud.com/theweeknd');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/resolve?url='),
        expect.any(Object),
      );
      expect(result.ok).toBe(true);
      expect(result.platform).toBe('soundcloud');
      expect(result.externalAccountId).toBe('1234567');
      expect(result.externalHandle).toBe('theweeknd');
      expect(result.displayName).toBe('The Weeknd');
      expect(result.externalUrl).toBe('https://soundcloud.com/theweeknd');
      expect(result.followersCount).toBe(5000000);
      expect(result.trackCount).toBe(42);
      expect(result.imageUrl).toContain('t500x500');
    });

    it('throws BadRequestException when API returns 404', async () => {
      const provider = makeProvider();
      jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      } as Response);

      await expect(
        provider.validateProfileReference('https://soundcloud.com/nobody'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when resolve returns a track (not a user)', async () => {
      const provider = makeProvider();
      jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 999, kind: 'track', title: 'Some Track' }),
      } as unknown as Response);

      await expect(
        provider.validateProfileReference('https://soundcloud.com/theweeknd/blinding-lights'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ServiceUnavailableException when fetch throws a network error', async () => {
      const provider = makeProvider();
      jest.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await expect(
        provider.validateProfileReference('https://soundcloud.com/theweeknd'),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('syncLatestSnapshot()', () => {
    it('throws ServiceUnavailableException when not configured', async () => {
      clearEnv();
      const provider = new SoundCloudInsightsProvider();
      await expect(provider.syncLatestSnapshot({ externalAccountId: '1234567' })).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('throws BadRequestException when externalAccountId is missing', async () => {
      const provider = makeProvider();
      await expect(provider.syncLatestSnapshot({})).rejects.toThrow(BadRequestException);
    });

    it('returns a snapshot with profile, metrics, and topContent', async () => {
      const provider = makeProvider();
      jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify(MOCK_USER),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ collection: [MOCK_TRACK] }),
        } as unknown as Response);

      const snapshot = await provider.syncLatestSnapshot({ externalAccountId: '1234567' });

      expect(snapshot.platform).toBe('soundcloud');
      expect(snapshot.capturedAt).toBeTruthy();
      expect(snapshot.profile.displayName).toBe('The Weeknd');
      expect(snapshot.profile.externalUrl).toBe('https://soundcloud.com/theweeknd');
      expect(snapshot.metrics['followers_count']).toBe(5000000);
      expect(snapshot.metrics['track_count']).toBe(42);
      expect(snapshot.topContent).toHaveLength(1);
      expect(snapshot.topContent[0]!.title).toBe('Blinding Lights');
      expect(snapshot.topContent[0]!.metricLabel).toBe('Plays');
      expect(snapshot.topContent[0]!.metricValue).toBe('1500000');
    });

    it('returns snapshot with empty topContent when tracks fetch fails', async () => {
      const provider = makeProvider();
      jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify(MOCK_USER),
        } as unknown as Response)
        .mockRejectedValueOnce(new Error('tracks unavailable'));

      const snapshot = await provider.syncLatestSnapshot({ externalAccountId: '1234567' });

      expect(snapshot.topContent).toHaveLength(0);
      expect(snapshot.metrics['followers_count']).toBe(5000000);
    });
  });
});
