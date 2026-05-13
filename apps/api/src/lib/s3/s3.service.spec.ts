import { S3Service } from './s3.service';

describe('S3Service', () => {
  function createService() {
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          's3.region': 'us-east-1',
          's3.accessKeyId': 'access-key',
          's3.secretAccessKey': 'secret-key',
          's3.bucket': 'stagelink-assets',
          's3.publicBaseUrl': 'https://assets.stagelink.test',
        };
        return values[key];
      }),
      get: jest.fn(() => undefined),
    };

    const service = new S3Service(configService as never);
    const send = jest.fn();
    (service as unknown as { client: { send: jest.Mock } }).client = { send };

    return { service, send };
  }

  it('rejects uploaded objects without a storage-reported content type', async () => {
    const { service, send } = createService();
    send.mockResolvedValueOnce({ ContentLength: 128 });

    await expect(
      service.verifyUploadedObject('artists/artist_1/avatar/file.png', 'image/png', 1024, 1),
    ).rejects.toThrow('content type is missing');
  });

  it('rejects uploaded objects below the configured minimum size', async () => {
    const { service, send } = createService();
    send.mockResolvedValueOnce({ ContentLength: 0, ContentType: 'image/png' });

    await expect(
      service.verifyUploadedObject('artists/artist_1/avatar/file.png', 'image/png', 1024, 1),
    ).rejects.toThrow('smaller than minimum size');
  });

  it('accepts uploaded objects that match size and content type', async () => {
    const { service, send } = createService();
    send.mockResolvedValueOnce({ ContentLength: 128, ContentType: 'image/png' });

    await expect(
      service.verifyUploadedObject('artists/artist_1/avatar/file.png', 'image/png', 1024, 1),
    ).resolves.toBeUndefined();
  });
});
