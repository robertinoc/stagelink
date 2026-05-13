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
        findUnique: jest.fn().mockResolvedValue(asset),
        update: jest.fn().mockResolvedValue({
          ...asset,
          status: 'uploaded',
          deliveryUrl: 'https://cdn.stagelink.test/artists/artist_1/avatar/asset.png',
          createdAt: new Date('2026-05-07T23:00:00.000Z'),
        }),
      },
      artist: {
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const s3 = {
      getBucket: jest.fn().mockReturnValue('stagelink-assets'),
      buildDeliveryUrl: jest
        .fn()
        .mockReturnValue('https://cdn.stagelink.test/artists/artist_1/avatar/asset.png'),
      generateObjectKey: jest.fn().mockReturnValue(asset.objectKey),
      generatePresignedPutUrl: jest.fn().mockResolvedValue({
        uploadUrl: 'https://uploads.stagelink.test/signed',
        expiresAt: new Date('2026-05-07T23:59:59.000Z'),
      }),
      verifyUploadedObject: jest.fn().mockResolvedValue(undefined),
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
    const { service, s3, membershipService } = createService();

    const response = await service.createUploadIntent(
      {
        artistId: asset.artistId,
        kind: 'avatar',
        mimeType: 'image/png',
        sizeBytes: asset.sizeBytes,
        originalFilename: 'avatar.svg',
      },
      user as never,
    );

    expect(membershipService.validateAccess).toHaveBeenCalledWith(user.id, asset.artistId, 'write');
    expect(s3.generateObjectKey).toHaveBeenCalledWith(asset.artistId, 'avatar', 'upload.png');
    expect(response).toEqual({
      assetId: asset.id,
      uploadUrl: 'https://uploads.stagelink.test/signed',
      expiresAt: '2026-05-07T23:59:59.000Z',
    });
    expect(response).not.toHaveProperty('objectKey');
  });

  it('rejects upload intents that do not meet the configured file-size floor', async () => {
    const { service, prisma, s3 } = createService();

    await expect(
      service.createUploadIntent(
        {
          artistId: asset.artistId,
          kind: 'avatar',
          mimeType: 'image/png',
          sizeBytes: 0,
          originalFilename: asset.originalFilename,
        },
        user as never,
      ),
    ).rejects.toThrow('File is too small for avatar');

    expect(prisma.asset.create).not.toHaveBeenCalled();
    expect(s3.generatePresignedPutUrl).not.toHaveBeenCalled();
  });

  it('rejects upload intents above the configured per-kind size limit', async () => {
    const { service, prisma, s3 } = createService();

    await expect(
      service.createUploadIntent(
        {
          artistId: asset.artistId,
          kind: 'avatar',
          mimeType: 'image/png',
          sizeBytes: 5 * 1024 * 1024 + 1,
          originalFilename: asset.originalFilename,
        },
        user as never,
      ),
    ).rejects.toThrow('File too large');

    expect(prisma.asset.create).not.toHaveBeenCalled();
    expect(s3.generatePresignedPutUrl).not.toHaveBeenCalled();
  });

  it('verifies the uploaded object before confirming the asset', async () => {
    const { service, prisma, s3 } = createService();

    await service.confirmUpload(asset.id, user as never);

    expect(s3.verifyUploadedObject).toHaveBeenCalledWith(
      asset.objectKey,
      asset.mimeType,
      5 * 1024 * 1024,
      1,
    );
    expect(prisma.asset.update).toHaveBeenCalledWith({
      where: { id: asset.id },
      data: {
        status: 'uploaded',
        deliveryUrl: 'https://cdn.stagelink.test/artists/artist_1/avatar/asset.png',
      },
    });
  });

  it('rejects confirmation when the object does not exist or mismatches the intent', async () => {
    const { service, prisma, s3 } = createService();
    s3.verifyUploadedObject.mockRejectedValueOnce(new Error('not found'));

    await expect(service.confirmUpload(asset.id, user as never)).rejects.toThrow(
      'Upload has not completed or does not match the upload intent',
    );
    expect(prisma.asset.update).not.toHaveBeenCalled();
  });
});
