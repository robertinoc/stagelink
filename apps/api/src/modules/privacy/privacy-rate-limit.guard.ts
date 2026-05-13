import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';
import {
  FixedWindowRateLimiter,
  type RateLimitDecision,
} from '../../common/utils/fixed-window-rate-limit';
import { extractClientIp } from '../../common/utils/request.utils';

const limiter = new FixedWindowRateLimiter({
  namespace: 'privacy-dsar',
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
});

@Injectable()
export class PrivacyRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: User }>();
    const res = context.switchToHttp().getResponse<Response>();
    const userId = req.user?.id ?? 'anonymous';
    const ip = extractClientIp(req) ?? 'unknown';
    const decision = limiter.check(`${userId}:${ip}`);

    setRateLimitHeaders(res, decision);

    if (!decision.allowed) {
      throw new HttpException(
        'Too many privacy requests. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
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
