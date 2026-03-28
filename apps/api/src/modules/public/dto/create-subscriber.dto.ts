import { IsEmail, MaxLength } from 'class-validator';

/**
 * Body for POST /api/public/blocks/:blockId/subscribers.
 * Minimal — only email is required from the fan.
 */
export class CreateSubscriberDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(254, { message: 'email must be 254 characters or fewer' })
  email!: string;
}
