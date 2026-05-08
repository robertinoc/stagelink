import { AssetsService } from './assets.service';

describe('AssetsService', () => {
  const user = { id: 'user_1' };
  const asset = {
    id: 'asset_1',
    artistId: 'artist_1',
    kind: 'avatar',
    bucket: 'stagelink-assets',
    objectKey: 'artists/artist_1/avatar/asset.png',
    originalFilename: 'avatar.png',
    mimeType: 'image/png',
    sizeBytes: 1024,
    status: 'pending',
    createdByUserId: user.id,
  };

  function createService() {
    const prisma = {
      asset: {
        create: jest.fn().mockResolvedValue(asset),
      },
    };
    const s3 = {
      getBucket: jest.fn().mockReturnValue('stagelink-assets'),
      generateObjectKey: jest.fn().mockReturnValue(asset.objectKey),
      generatePresignedPutUrl: jest.fn().mockResolvedValue({
        uploadUrl: 'https://uploads.stagelink.test/signed',
        expiresAt: new Date('2026-05-07T23:59:59.000Z'),
      }),
    };
    const membershipService = {
      validateAccess: jest.fn().mockResolvedValue({ role: 'owner' }),
    };
    const auditService = {
      log: jest.fn(),
    };

    const service = new AssetsService(
      prisma as never,
      s3 as never,
      membershipService as never,
      auditService as never,
    );

    return { service, prisma, s3, membershipService, auditService };
  }

  it('does not expose internal storage object keys in upload-intent responses', async () => {
    const { service, membershipService } = createService();

    const response = await service.createUploadIntent(
      {
        artistId: asset.artistId,
        kind: 'avatar',
        mimeType: 'image/png',
        sizeBytes: asset.sizeBytes,
        originalFilename: asset.originalFilename,
      },
      user as never,
    );

    expect(membershipService.validateAccess).toHaveBeenCalledWith(user.id, asset.artistId, 'write');
    expect(response).toEqual({
      assetId: asset.id,
      uploadUrl: 'https://uploads.stagelink.test/signed',
      expiresAt: '2026-05-07T23:59:59.000Z',
    });
    expect(response).not.toHaveProperty('objectKey');
  });
});
