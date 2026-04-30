import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';

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

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup — prevents unbounded Map growth.
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > WINDOW_MS * 5) store.delete(key);
  }
}, 5 * 60_000);
cleanupTimer.unref?.();

@Injectable()
export class UploadRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: User }>();
    const userId = req.user?.id ?? 'anonymous';
    const key = `upload-intent:${userId}`;
    const now = Date.now();

    const entry = store.get(key);

    if (!entry || now - entry.windowStart > WINDOW_MS) {
      store.set(key, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= MAX_REQUESTS) {
      throw new HttpException('Too many upload requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    entry.count++;
    return true;
  }
}
