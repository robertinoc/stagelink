import { ExecutionContext, HttpException } from '@nestjs/common';
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
  it('blocks public endpoint abuse after the per-IP fixed window quota', () => {
    const guard = new PublicRateLimitGuard();
    const request = {
      headers: {
        'x-forwarded-for': `198.51.100.${Date.now()}`,
      },
    };
    const context = httpContext(request);

    for (let i = 0; i < 120; i++) {
      expect(guard.canActivate(context)).toBe(true);
    }

    expect(() => guard.canActivate(context)).toThrow(HttpException);
    expect(context.switchToHttp().getResponse().setHeader).toHaveBeenCalledWith(
      'Retry-After',
      expect.any(String),
    );
  });

  it('blocks upload-intent abuse after the per-user fixed window quota', () => {
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
      expect(guard.canActivate(context)).toBe(true);
    }

    expect(() => guard.canActivate(context)).toThrow(HttpException);
    expect(context.switchToHttp().getResponse().setHeader).toHaveBeenCalledWith(
      'Retry-After',
      expect.any(String),
    );
  });
});
