import { IsEnum, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import { PlanTier } from '@prisma/client';

/**
 * Body for POST /api/admin/users/:id/access — grant a manual plan to a
 * tenant. Only PRO / PRO+ are valid grants; `free` is rejected.
 *
 * `expiresAt` is optional:
 *   - ISO8601 string → grant expires on that date (max 10 years from now)
 *   - null / omitted  → grant never expires (use for trusted internal accounts)
 */
export class GrantAccessDto {
  @IsEnum([PlanTier.pro, PlanTier.pro_plus], {
    message: 'plan must be one of: pro, pro_plus',
  })
  plan!: typeof PlanTier.pro | typeof PlanTier.pro_plus;

  // @IsOptional() already skips validators when the value is null or undefined.
  // Pass null explicitly for a never-expiring grant; omit to default to no expiry.
  @IsOptional()
  @IsISO8601({}, { message: 'expiresAt must be an ISO8601 date string or null' })
  expiresAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/**
 * Body for PATCH /api/admin/users/:id/access — update an existing manual
 * grant. Every field is optional:
 *   - expiresAt: extend/shorten the window (omit to keep the current expiry,
 *     e.g. when only changing the plan on a downgrade PRO+ → PRO)
 *   - reason: update the note
 *   - plan: change the granted plan in either direction (upgrade or downgrade)
 */
export class ExtendAccessDto {
  @IsOptional()
  @IsISO8601({}, { message: 'expiresAt must be an ISO8601 date string' })
  expiresAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsEnum([PlanTier.pro, PlanTier.pro_plus], {
    message: 'plan must be one of: pro, pro_plus',
  })
  plan?: typeof PlanTier.pro | typeof PlanTier.pro_plus;
}
