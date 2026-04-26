import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

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
    const requestId = typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();

    // Normalise to string so downstream code can read it without type guards.
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);

    next();
  }
}
