import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

function createHost(options: {
  exception: unknown;
  url?: string;
  originalUrl?: string;
  requestId?: string;
}) {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const response = { status };
  const request = {
    method: 'GET',
    url: options.url ?? '/api/test?token=secret',
    originalUrl: options.originalUrl,
    headers: options.requestId ? { 'x-request-id': options.requestId } : {},
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  };

  new HttpExceptionFilter().catch(options.exception, host as never);

  return { status, json };
}

describe('HttpExceptionFilter', () => {
  it('omits query strings from the response path', () => {
    const { json } = createHost({
      exception: new BadRequestException('Invalid request'),
      originalUrl: '/api/test?token=secret&code=123',
      requestId: 'req_123',
    });

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req_123',
        statusCode: 400,
        message: 'Invalid request',
        path: '/api/test',
      }),
    );
  });

  it('sanitizes control characters from client-visible error messages', () => {
    const { json } = createHost({
      exception: new BadRequestException('Invalid\nheader\tvalue'),
      originalUrl: '/api/test',
    });

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid header value',
      }),
    );
  });

  it('keeps internal exceptions generic for clients', () => {
    const { status, json } = createHost({
      exception: new InternalServerErrorException('database password leaked'),
      originalUrl: '/api/test',
    });

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
      }),
    );
  });

  it('keeps non-HTTP exceptions generic for clients', () => {
    const { status, json } = createHost({
      exception: new Error('Prisma stack detail: SELECT * FROM users'),
      originalUrl: '/api/test?query=secret',
    });

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
        path: '/api/test',
      }),
    );
  });
});
