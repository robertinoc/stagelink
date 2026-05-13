import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { extractClientIp } from '../utils/request.utils';
import { FixedWindowRateLimiter, type RateLimitDecision } from '../utils/fixed-window-rate-limit';
import { formatSecurityEvent, sanitizeLogPath, sanitizeLogValue } from '../utils/security-log';

/**
 * PublicRateLimitGuard — fixed-window in-memory rate limiter for public endpoints.
 *
 * Applied to unauthenticated routes (e.g. smart-link resolution) as a secondary
 * defense layer. The primary rate limit lives in the Next.js web tier (/go/[id]).
 * This guard protects against direct API access that bypasses the web tier.
 *
 * Limits: 120 requests / 60 s per IP (4× the web tier limit to account for
 * legitimate proxy scenarios while still blocking direct API abuse).
 *
 * ⚠️  In-memory only — resets on cold starts and does NOT coordinate across
 * multiple instances. Upgrade to a shared store (Redis/Upstash) for
 * multi-instance production deployments.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

const limiter = new FixedWindowRateLimiter({
  namespace: 'public',
  windowMs: WINDOW_MS,
  maxRequests: MAX_REQUESTS,
});

@Injectable()
export class PublicRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(PublicRateLimitGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const ip = extractClientIp(req) ?? 'unknown';
    const decision = limiter.check(ip);
    setRateLimitHeaders(res, decision);
    if (!decision.allowed) {
      this.logger.warn(
        formatSecurityEvent('rate_limit.exceeded', {
          namespace: 'public',
          ip: sanitizeLogValue(ip),
          path: sanitizeLogPath(req.originalUrl ?? req.url),
          limit: decision.limit,
          retryAfterSeconds: decision.retryAfterSeconds,
        }),
      );
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}

function setRateLimitHeaders(res: Response, decision: RateLimitDecision): void {
  res.setHeader('X-RateLimit-Limit', String(decision.limit));
  res.setHeader('X-RateLimit-Remaining', String(decision.remaining));
  res.setHeader('X-RateLimit-Reset', decision.resetAt.toISOString());
  if (!decision.allowed) {
    res.setHeader('Retry-After', String(decision.retryAfterSeconds));
  }
}
