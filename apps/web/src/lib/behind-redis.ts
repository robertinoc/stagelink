/**
 * behind-redis.ts — Upstash Redis client for Behind the Stage role management.
 *
 * Roles are stored as a single JSON object at key `behind:roles`:
 *   { "email@example.com": "owner" | "admin" }
 *
 * Env var owners (BEHIND_OWNER_EMAILS / BEHIND_ADMIN_EMAILS) are always treated
 * as owners regardless of what's in Redis — they're the immutable bootstrap.
 */
import { Redis } from '@upstash/redis';
import { BEHIND_OWNER_EMAILS } from './behind-config';

export type BehindRole = 'owner' | 'admin';
export type RolesMap = Record<string, BehindRole>;

const ROLES_KEY = 'behind:roles';

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** Reads the raw roles map from Redis (empty object if unavailable). */
export async function getRolesFromRedis(): Promise<RolesMap> {
  const redis = getRedisClient();
  if (!redis) return {};
  try {
    const data = await redis.get<RolesMap>(ROLES_KEY);
    return data ?? {};
  } catch {
    return {};
  }
}

/**
 * Returns the merged roles map: env var owners are always 'owner',
 * Redis roles fill in the rest. Used to display the full picture in the UI.
 */
export async function getMergedRoles(): Promise<RolesMap> {
  const redisRoles = await getRolesFromRedis();
  const merged: RolesMap = { ...redisRoles };
  for (const email of BEHIND_OWNER_EMAILS) {
    merged[email.toLowerCase()] = 'owner';
  }
  return merged;
}

/**
 * Returns the effective role for a given email:
 *   1. Env var owner → always 'owner'
 *   2. Redis role → 'owner' or 'admin'
 *   3. Otherwise → null (no access)
 */
export async function getBehindRole(email: string | null | undefined): Promise<BehindRole | null> {
  if (!email) return null;
  const normalized = email.toLowerCase();
  if (BEHIND_OWNER_EMAILS.includes(normalized)) return 'owner';
  const roles = await getRolesFromRedis();
  return roles[normalized] ?? null;
}

/** Returns true if the email has any behind access (owner or admin). */
export async function hasBehindAccess(email: string | null | undefined): Promise<boolean> {
  const role = await getBehindRole(email);
  return role !== null;
}

/**
 * Sets or removes a role in Redis.
 * Throws if Redis is not configured or if trying to modify an env var owner.
 */
export async function setRole(
  email: string,
  role: BehindRole | 'none',
  actorEmail: string,
): Promise<void> {
  const normalized = email.toLowerCase();

  if (BEHIND_OWNER_EMAILS.includes(normalized)) {
    throw new Error('Cannot modify env-var owners via the UI. Edit BEHIND_ADMIN_EMAILS in Vercel.');
  }

  if (normalized === actorEmail.toLowerCase()) {
    throw new Error('You cannot change your own role.');
  }

  const redis = getRedisClient();
  if (!redis) throw new Error('Redis not configured.');

  const roles = await getRolesFromRedis();

  if (role === 'none') {
    delete roles[normalized];
  } else {
    roles[normalized] = role;
  }

  await redis.set(ROLES_KEY, roles);
}
