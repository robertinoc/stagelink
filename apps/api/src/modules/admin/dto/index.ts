import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserStatusDto {
  @IsBoolean({ message: 'isSuspended must be a boolean' })
  isSuspended!: boolean;
}

export class SendInvitationDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;
}
