import type { Request } from 'express';

/**
 * Extracts the real client IP from a request.
 *
 * X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
 * Only the first value is the original client IP.
 * This header can be spoofed if the app is not behind a trusted reverse proxy,
 * but for audit logging purposes this is acceptable.
 */
export function extractClientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (!forwarded) return undefined;
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return raw?.split(',')[0]?.trim() || undefined;
}
