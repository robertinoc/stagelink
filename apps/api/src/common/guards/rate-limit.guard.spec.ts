import { ExecutionContext, HttpException, Logger } from '@nestjs/common';
import { PublicRateLimitGuard } from './public-rate-limit.guard';
import { UploadRateLimitGuard } from './upload-rate-limit.guard';

function httpContext(request: unknown): ExecutionContext {
  const response = {
    setHeader: jest.fn(),
  };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as ExecutionContext;
}

describe('rate limit guards', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // No Upstash env vars in tests → the guards' DistributedRateLimiter resolves
  // via the in-memory fallback, preserving the documented 120 / 20 quotas.
  it('blocks public endpoint abuse after the per-IP fixed window quota', async () => {
    const guard = new PublicRateLimitGuard();
    const request = {
      headers: {
        'x-forwarded-for': `198.51.100.${Date.now()}\nspoofed`,
      },
      originalUrl: '/api/public/smart-links/test?token=secret',
    };
    const context = httpContext(request);

    for (let i = 0; i < 120; i++) {
      expect(await guard.canActivate(context)).toBe(true);
    }

    await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
    expect(context.switchToHttp().getResponse().setHeader).toHaveBeenCalledWith(
      'Retry-After',
      expect.any(String),
    );
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('rate_limit.exceeded'));
    expect(warnSpy).toHaveBeenCalledWith(expect.not.stringContaining('token=secret'));
  });

  it('blocks upload-intent abuse after the per-user fixed window quota', async () => {
    const guard = new UploadRateLimitGuard();
    const context = httpContext({
      headers: {
        'x-forwarded-for': `203.0.113.${Date.now()}`,
      },
      user: {
        id: `security-user-${Date.now()}`,
      },
    });

    for (let i = 0; i < 20; i++) {
      expect(await guard.canActivate(context)).toBe(true);
    }

    await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
    expect(context.switchToHttp().getResponse().setHeader).toHaveBeenCalledWith(
      'Retry-After',
      expect.any(String),
    );
  });
});
