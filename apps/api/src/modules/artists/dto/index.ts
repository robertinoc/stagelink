import {
  IsString,
  IsOptional,
  IsUrl,
  MaxLength,
  MinLength,
  Matches,
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  normalizeUsername,
  validateUsernameFormat,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
} from '../../../common/utils/username.util';
import { isReservedUsername } from '../../../common/constants/reserved-usernames';

// ── Decorador personalizado: username no reservado ─────────────

@ValidatorConstraint({ name: 'isNotReservedUsername', async: false })
class IsNotReservedUsernameConstraint implements ValidatorConstraintInterface {
  validate(value: string, _args: ValidationArguments): boolean {
    if (typeof value !== 'string') return false;
    const normalized = normalizeUsername(value);
    const formatResult = validateUsernameFormat(normalized);
    if (!formatResult.valid) return true; // Deja que Matches() lo rechace
    return !isReservedUsername(normalized);
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'Username is reserved and cannot be used';
  }
}

function IsNotReservedUsername(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotReservedUsernameConstraint,
    });
  };
}

// ── DTOs ───────────────────────────────────────────────────────

/**
 * CreateArtistDto — payload validado para POST /api/artists
 *
 * Reglas de username (fuente: username.util.ts):
 * - Normalizado a lowercase antes de validar (via @Transform)
 * - Solo letras minúsculas, dígitos, guión medio (-) y guión bajo (_)
 * - Mínimo 3 caracteres, máximo 30
 * - Debe empezar y terminar con letra o dígito
 * - No puede contener -- ni __
 * - No puede ser una palabra reservada (reserved-usernames.ts)
 */
export class CreateArtistDto {
  @Transform(({ value }) => (typeof value === 'string' ? normalizeUsername(value) : value))
  @IsString()
  @MinLength(USERNAME_MIN_LENGTH)
  @MaxLength(USERNAME_MAX_LENGTH)
  @Matches(/^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$/, {
    message:
      'username must start and end with a letter or number, and only contain letters, numbers, hyphens (-), or underscores (_)',
  })
  @Matches(/^(?!.*[-_]{2,}).*$/, {
    message: 'username cannot contain consecutive hyphens or underscores (-- or __)',
  })
  @IsNotReservedUsername()
  username!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}

/**
 * UpdateArtistDto — PATCH /api/artists/:username
 * El username no se puede cambiar una vez creado (es la clave pública del tenant).
 * Todos los demás campos son opcionales.
 */
export class UpdateArtistDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
