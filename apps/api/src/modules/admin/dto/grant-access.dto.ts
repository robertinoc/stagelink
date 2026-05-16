import { IsEnum, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import { PlanTier } from '@prisma/client';

/**
 * Body for POST /api/admin/users/:id/access — grant a temporary
 * (admin-issued) plan to a tenant. Only PRO / PRO+ are valid grants;
 * `free` would be a no-op and is rejected.
 */
export class GrantAccessDto {
  @IsEnum([PlanTier.pro, PlanTier.pro_plus], {
    message: 'plan must be one of: pro, pro_plus',
  })
  plan!: typeof PlanTier.pro | typeof PlanTier.pro_plus;

  @IsISO8601({}, { message: 'expiresAt must be an ISO8601 date string' })
  expiresAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/**
 * Body for PATCH /api/admin/users/:id/access — extend (or shorten) the
 * expiry of an existing manual grant, optionally updating the reason
 * and optionally changing the granted plan.
 */
export class ExtendAccessDto {
  @IsISO8601({}, { message: 'expiresAt must be an ISO8601 date string' })
  expiresAt!: string;

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
