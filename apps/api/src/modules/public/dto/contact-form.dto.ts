import { IsString, MaxLength, MinLength } from 'class-validator';

export class ContactFormDto {
  @IsString()
  @MinLength(1, { message: 'name is required' })
  @MaxLength(100, { message: 'name must be 100 characters or fewer' })
  name!: string;

  @IsString()
  @MinLength(1, { message: 'message is required' })
  @MaxLength(2000, { message: 'message must be 2000 characters or fewer' })
  message!: string;
}
