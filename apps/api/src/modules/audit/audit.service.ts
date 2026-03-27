import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/prisma.service';

export interface AuditPayload {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fire-and-forget audit log. Never throws, never blocks the caller.
   * Usage: this.auditService.log({ actorId, action, entityType, entityId })
   */
  log(payload: AuditPayload): void {
    this.prisma.auditLog
      .create({
        data: {
          actorId: payload.actorId,
          action: payload.action,
          entityType: payload.entityType,
          entityId: payload.entityId,
          metadata: (payload.metadata ?? {}) as Prisma.InputJsonValue,
          ipAddress: payload.ipAddress ?? null,
        },
      })
      .catch((err) => {
        this.logger.error(
          `Failed to write audit log [${payload.action}]: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
  }
}
