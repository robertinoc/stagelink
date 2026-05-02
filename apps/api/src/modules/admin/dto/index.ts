import { IsBoolean, IsEmail } from 'class-validator';

export class UpdateUserStatusDto {
  @IsBoolean({ message: 'isSuspended must be a boolean' })
  isSuspended!: boolean;
}

export class SendInvitationDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;
}
