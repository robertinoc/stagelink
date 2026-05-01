import { TenantResolverService, isPlatformHost } from './tenant-resolver.service';
import type { PrismaService } from '../../lib/prisma.service';

describe('TenantResolverService', () => {
  const createService = () => {
    const prisma = {
      artist: {
        findUnique: jest.fn(),
      },
      customDomain: {
        findFirst: jest.fn(),
      },
    };

    return {
      service: new TenantResolverService(prisma as unknown as PrismaService),
      prisma,
    };
  };

  describe('resolveByUsername', () => {
    it('normalizes valid usernames and resolves artists with pages', async () => {
      const { service, prisma } = createService();
      prisma.artist.findUnique.mockResolvedValue({
        id: 'artist_1',
        username: 'stage-link',
        displayName: 'Stage Link',
        page: { id: 'page_1' },
      });

      await expect(service.resolveByUsername(' Stage-Link ')).resolves.toEqual({
        artistId: 'artist_1',
        username: 'stage-link',
        displayName: 'Stage Link',
        resolvedVia: 'username',
      });
      expect(prisma.artist.findUnique).toHaveBeenCalledWith({
        where: { username: 'stage-link' },
        select: expect.any(Object),
      });
    });

    it('returns null for invalid usernames, missing artists and artists without pages', async () => {
      const { service, prisma } = createService();

      await expect(service.resolveByUsername('bad username')).resolves.toBeNull();
      expect(prisma.artist.findUnique).not.toHaveBeenCalled();

      prisma.artist.findUnique.mockResolvedValueOnce(null);
      await expect(service.resolveByUsername('missing')).resolves.toBeNull();

      prisma.artist.findUnique.mockResolvedValueOnce({
        id: 'artist_1',
        username: 'nopage',
        displayName: 'No Page',
        page: null,
      });
      await expect(service.resolveByUsername('nopage')).resolves.toBeNull();
    });
  });

  describe('resolveByDomain', () => {
    it('normalizes host headers and resolves active custom domains', async () => {
      const { service, prisma } = createService();
      prisma.customDomain.findFirst.mockResolvedValue({
        domain: 'artist.com',
        artist: {
          id: 'artist_1',
          username: 'stage-link',
          displayName: 'Stage Link',
          page: { id: 'page_1' },
        },
      });

      await expect(service.resolveByDomain('WWW.ARTIST.COM:443')).resolves.toEqual({
        artistId: 'artist_1',
        username: 'stage-link',
        displayName: 'Stage Link',
        resolvedVia: 'custom_domain',
      });
      expect(prisma.customDomain.findFirst).toHaveBeenCalledWith({
        where: { domain: 'artist.com', status: 'active' },
        select: expect.any(Object),
      });
    });

    it('skips platform hosts and unresolved domains', async () => {
      const { service, prisma } = createService();

      await expect(service.resolveByDomain('stagelink.link')).resolves.toBeNull();
      await expect(service.resolveByDomain('preview.vercel.app')).resolves.toBeNull();
      expect(prisma.customDomain.findFirst).not.toHaveBeenCalled();

      prisma.customDomain.findFirst.mockResolvedValueOnce(null);
      await expect(service.resolveByDomain('artist.com')).resolves.toBeNull();

      prisma.customDomain.findFirst.mockResolvedValueOnce({
        domain: 'artist.com',
        artist: {
          id: 'artist_1',
          username: 'stage-link',
          displayName: 'Stage Link',
          page: null,
        },
      });
      await expect(service.resolveByDomain('artist.com')).resolves.toBeNull();
    });
  });

  describe('isPlatformHost', () => {
    it('matches canonical, alternate, preview and local platform hosts', () => {
      expect(isPlatformHost('stagelink.link')).toBe(true);
      expect(isPlatformHost('www.stagelink.art')).toBe(true);
      expect(isPlatformHost('api.stagelink.com')).toBe(true);
      expect(isPlatformHost('stagelink-git-feature.vercel.app')).toBe(true);
      expect(isPlatformHost('localhost')).toBe(true);
      expect(isPlatformHost('artist.com')).toBe(false);
    });
  });
});
