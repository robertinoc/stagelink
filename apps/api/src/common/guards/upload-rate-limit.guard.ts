import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';
import { extractClientIp } from '../utils/request.utils';
import { FixedWindowRateLimiter, type RateLimitDecision } from '../utils/fixed-window-rate-limit';
import { formatSecurityEvent, sanitizeLogPath, sanitizeLogValue } from '../utils/security-log';

/**
 * UploadRateLimitGuard — fixed-window in-memory rate limiter for the
 * presigned-URL generation endpoint (`POST /api/assets/upload-intent`).
 *
 * Motivation: each call generates a signed S3 PUT URL and creates an Asset
 * record in the DB. Without a limit, a compromised token could generate
 * thousands of presigned URLs, wasting S3 bandwidth and storage quota.
 *
 * Limits: 20 upload intents / 60 s per authenticated user (keyed on user.id).
 * This is intentionally stricter than the public rate limit because upload
 * intents are user-scoped and 20 is well above any legitimate burst.
 *
 * ⚠️  In-memory only — resets on cold starts and does NOT coordinate across
 * multiple instances. Upgrade to a shared store (Redis/Upstash) for
 * multi-instance production deployments.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

const limiter = new FixedWindowRateLimiter({
  namespace: 'upload-intent',
  windowMs: WINDOW_MS,
  maxRequests: MAX_REQUESTS,
});

@Injectable()
export class UploadRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(UploadRateLimitGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: User }>();
    const res = context.switchToHttp().getResponse<Response>();
    const userId = req.user?.id ?? 'anonymous';
    const ip = extractClientIp(req) ?? 'unknown';
    const decision = limiter.check(`${userId}:${ip}`);
    setRateLimitHeaders(res, decision);
    if (!decision.allowed) {
      this.logger.warn(
        formatSecurityEvent('rate_limit.exceeded', {
          namespace: 'upload-intent',
          userId: sanitizeLogValue(userId),
          ip: sanitizeLogValue(ip),
          path: sanitizeLogPath(req.originalUrl ?? req.url),
          limit: decision.limit,
          retryAfterSeconds: decision.retryAfterSeconds,
        }),
      );
      throw new HttpException('Too many upload requests', HttpStatus.TOO_MANY_REQUESTS);
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
