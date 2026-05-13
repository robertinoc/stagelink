import { Injectable, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { isBehindOwnerEmail } from './admin.config';

export type BehindRole = 'owner' | 'admin';
type RolesMap = Record<string, BehindRole>;

const ROLES_KEY = 'behind:roles';

@Injectable()
export class AdminRoleService {
  private readonly logger = new Logger(AdminRoleService.name);
  private readonly redis: Redis | null;

  constructor() {
    const url = process.env['UPSTASH_REDIS_KV_REST_API_URL'];
    const token = process.env['UPSTASH_REDIS_KV_REST_API_TOKEN'];
    this.redis = url && token ? new Redis({ url, token }) : null;
  }

  async getRole(email: string | null | undefined): Promise<BehindRole | null> {
    const normalized = normalizeEmail(email);
    if (!normalized) return null;
    if (isBehindOwnerEmail(normalized)) return 'owner';

    if (!this.redis) {
      return null;
    }

    try {
      const roles = (await this.redis.get<RolesMap>(ROLES_KEY)) ?? {};
      return roles[normalized] ?? null;
    } catch (error) {
      this.logger.warn('Failed to resolve Behind role from Redis', error);
      return null;
    }
  }

  async hasAccess(email: string | null | undefined): Promise<boolean> {
    return (await this.getRole(email)) !== null;
  }

  async isOwner(email: string | null | undefined): Promise<boolean> {
    return (await this.getRole(email)) === 'owner';
  }
}

function normalizeEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase();
  return normalized || null;
}
