import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/**
 * ParseCuidPipe — validates that a route parameter looks like a CUID.
 *
 * CUID v1 format: starts with 'c', 25 characters, alphanumeric.
 * Rejects clearly malformed IDs early, before any DB round-trip.
 *
 * This is a format guard, not a security boundary — Prisma handles
 * arbitrary strings safely. The goal is consistent 400s for malformed
 * IDs instead of silent 404s from DB misses.
 */
@Injectable()
export class ParseCuidPipe implements PipeTransform<string, string> {
  // CUID v1: c + 24 alphanumeric chars = 25 total
  private static readonly CUID_RE = /^c[a-z0-9]{24}$/i;

  transform(value: string): string {
    if (!ParseCuidPipe.CUID_RE.test(value)) {
      throw new BadRequestException(`Invalid ID format: ${value}`);
    }
    return value;
  }
}
