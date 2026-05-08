import { buildCorsOriginHandler, CORS_ALLOWED_HEADERS } from './cors';

function checkOrigin(origin: string | undefined, nodeEnv = 'production'): Promise<boolean> {
  const handler = buildCorsOriginHandler(
    'https://stagelink.art',
    ['https://staging.stagelink.link'],
    nodeEnv,
  );

  return new Promise((resolve, reject) => {
    handler(origin, (err, allow) => {
      if (err) reject(err);
      else resolve(Boolean(allow));
    });
  });
}

describe('CORS configuration', () => {
  it('allows the canonical frontend, configured staging and Vercel previews', async () => {
    await expect(checkOrigin('https://stagelink.art')).resolves.toBe(true);
    await expect(checkOrigin('https://staging.stagelink.link')).resolves.toBe(true);
    await expect(checkOrigin('https://stagelink-git-feature.vercel.app')).resolves.toBe(true);
  });

  it('rejects unknown production origins', async () => {
    await expect(checkOrigin('https://evil.example')).rejects.toThrow(
      "CORS: origin 'https://evil.example' not allowed",
    );
  });

  it('only allows localhost origins in development', async () => {
    await expect(checkOrigin('http://localhost:4000')).rejects.toThrow();
    await expect(checkOrigin('http://localhost:4000', 'development')).resolves.toBe(true);
  });

  it('allows StageLink analytics quality headers used by browser requests', () => {
    expect(CORS_ALLOWED_HEADERS).toEqual(
      expect.arrayContaining(['X-SL-AC', 'X-SL-QA', 'X-Request-ID']),
    );
  });
});
