import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Body for POST /api/public/blocks/:blockId/subscribers.
 *
 * Security notes:
 *   - `website` is a honeypot field — must be absent or empty.
 *     If non-empty, the request is silently accepted (no DB write) to avoid
 *     revealing the protection to bots.
 *   - `consent` is required when the block has requireConsent=true.
 *     Backend enforces this regardless of frontend state.
 *   - Email is normalized (lowercased + trimmed) server-side.
 */
export class CreateSubscriberDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(254, { message: 'email must be 254 characters or fewer' })
  email!: string;

  /**
   * Whether the user explicitly checked the consent checkbox.
   * Required when block.config.requireConsent === true.
   * Optional otherwise (defaults to false if absent).
   */
  @IsOptional()
  @IsBoolean({ message: 'consent must be a boolean' })
  consent?: boolean;

  /**
   * Honeypot field — must be absent or empty string.
   * Real users never see or fill this field (hidden via CSS).
   * Bots that auto-fill all inputs will trigger this.
   */
  @IsOptional()
  @IsString()
  @MaxLength(0, { message: 'website must be empty' })
  website?: string;
}
