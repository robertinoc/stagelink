import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { extractClientIp } from '../utils/request.utils';

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

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent unbounded Map growth.
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > WINDOW_MS * 5) store.delete(key);
  }
}, 5 * 60_000);
cleanupTimer.unref?.();

@Injectable()
export class PublicRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const ip = extractClientIp(req) ?? 'unknown';
    const key = `public-resolve:${ip}`;
    const now = Date.now();

    const entry = store.get(key);

    if (!entry || now - entry.windowStart > WINDOW_MS) {
      store.set(key, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= MAX_REQUESTS) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    entry.count++;
    return true;
  }
}
