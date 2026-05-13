import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

const MAX_REQUEST_ID_LENGTH = 128;
const SAFE_REQUEST_ID_RE = /^[a-zA-Z0-9._:-]+$/;

/**
 * RequestIdMiddleware — attaches a correlation ID to every request.
 *
 * Behaviour:
 * - If the client sends an `X-Request-ID` header, that value is reused
 *   (useful for client-side tracing and replay debugging).
 * - Otherwise a new UUID v4 is generated.
 * - The ID is written back to both `req.headers['x-request-id']` (so
 *   downstream handlers and filters can read it) and the response header
 *   `X-Request-ID` (so clients can correlate log entries).
 *
 * Registration: applied globally via AppModule.configure().
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.headers['x-request-id'];
    const requestId = isSafeRequestId(incoming) ? incoming : randomUUID();

    // Normalise to string so downstream code can read it without type guards.
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);

    next();
  }
}

function isSafeRequestId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_REQUEST_ID_LENGTH &&
    SAFE_REQUEST_ID_RE.test(value)
  );
}
