import { RequestIdMiddleware } from './request-id.middleware';

describe('RequestIdMiddleware', () => {
  function runMiddleware(incoming?: unknown) {
    const req = {
      headers: incoming === undefined ? {} : { 'x-request-id': incoming },
    };
    const res = {
      setHeader: jest.fn(),
    };
    const next = jest.fn();

    new RequestIdMiddleware().use(req as never, res as never, next);

    return { req, res, next };
  }

  it('reuses safe client-supplied request ids', () => {
    const { req, res, next } = runMiddleware('qa-request_123.abc:def');

    expect(req.headers['x-request-id']).toBe('qa-request_123.abc:def');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', 'qa-request_123.abc:def');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('replaces unsafe request ids to avoid response/log injection', () => {
    const { req, res } = runMiddleware('evil\nx-forged: yes');

    expect(req.headers['x-request-id']).toEqual(expect.any(String));
    expect(req.headers['x-request-id']).not.toBe('evil\nx-forged: yes');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', req.headers['x-request-id']);
  });

  it('replaces overly long request ids', () => {
    const { req } = runMiddleware('a'.repeat(129));

    expect(req.headers['x-request-id']).toEqual(expect.any(String));
    expect(req.headers['x-request-id']).toHaveLength(36);
  });
});
