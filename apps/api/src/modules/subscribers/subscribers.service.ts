import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma.service';

export interface SubscriberRow {
  id: string;
  email: string;
  status: string;
  consent: boolean;
  sourceBlockId: string;
  createdAt: Date;
}

/**
 * SubscribersService — private read/export layer for fan subscribers.
 *
 * Only used from the authenticated SubscribersController.
 * All methods are scoped to a single artistId — no cross-tenant access possible.
 */
@Injectable()
export class SubscribersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns paginated subscriber rows for an artist.
   * Results ordered by createdAt DESC (newest first).
   *
   * @param artistId  Artist UUID (validated by OwnershipGuard before this call)
   * @param page      1-based page number (default 1)
   * @param limit     Page size, max 100 (default 50)
   */
  async list(
    artistId: string,
    page = 1,
    limit = 50,
  ): Promise<{ items: SubscriberRow[]; total: number; page: number; limit: number }> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      this.prisma.subscriber.findMany({
        where: { artistId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
        select: {
          id: true,
          email: true,
          status: true,
          consent: true,
          blockId: true,
          createdAt: true,
        },
      }),
      this.prisma.subscriber.count({ where: { artistId } }),
    ]);

    return {
      items: items.map((s) => ({
        id: s.id,
        email: s.email,
        status: s.status,
        consent: s.consent,
        sourceBlockId: s.blockId,
        createdAt: s.createdAt,
      })),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  /**
   * Returns raw CSV string for all subscribers of an artist.
   *
   * Exported columns (conservative — no PII beyond email):
   *   email, status, consent_given, created_at, source_block_id
   *
   * Omitted deliberately:
   *   - ip_hash (internal dedup field, no value for artist)
   *   - consent_text (internal audit snapshot)
   *   - locale, source_page_path (future analytics export, not basic)
   *
   * @param artistId  Artist UUID (validated by OwnershipGuard before this call)
   */
  async exportCsv(artistId: string): Promise<string> {
    const subscribers = await this.prisma.subscriber.findMany({
      where: { artistId },
      orderBy: { createdAt: 'asc' },
      select: {
        email: true,
        status: true,
        consent: true,
        blockId: true,
        createdAt: true,
      },
    });

    const header = 'email,status,consent_given,created_at,source_block_id';
    const rows = subscribers.map((s) =>
      [
        csvEscape(s.email),
        csvEscape(s.status),
        s.consent ? 'true' : 'false',
        s.createdAt.toISOString(),
        csvEscape(s.blockId),
      ].join(','),
    );

    return [header, ...rows].join('\n');
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Escapes a value for CSV output.
 * Wraps in double-quotes and escapes any internal double-quotes.
 */
function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
