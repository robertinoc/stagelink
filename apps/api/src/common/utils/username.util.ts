/**
 * Username utilities — normalización y validación.
 *
 * Política de username (fuente única de verdad):
 * ─────────────────────────────────────────────
 * - Solo letras minúsculas (a-z), dígitos (0-9), guión medio (-), guión bajo (_)
 * - Longitud: mínimo 3, máximo 30 caracteres
 * - Debe comenzar con letra o dígito (no puede empezar con - ni _)
 * - Debe terminar con letra o dígito (no puede terminar con - ni _)
 * - No permite secuencias consecutivas: --, __ (ej: "my--name" inválido)
 * - Sin unicode, sin espacios, sin puntos, sin caracteres especiales
 * - Siempre se normaliza a lowercase antes de guardar y de buscar
 *
 * Ejemplos válidos:   robertinoc, dj-shadow, the_beatles, artist123
 * Ejemplos inválidos: -robertinoc, robertinoc-, my__name, röbertino, a, ab
 */

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

/**
 * Regex de validación (post-normalización).
 * - Empieza y termina con [a-z0-9]
 * - Parte media permite [a-z0-9_-] sin repeticiones de - ni _
 */
const USERNAME_REGEX = /^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$/;
const CONSECUTIVE_SEPARATORS_REGEX = /[-_]{2,}/;

/**
 * Normaliza un username crudo antes de validar o guardar.
 * - Convierte a lowercase
 * - Elimina espacios al inicio y al final
 *
 * No elimina caracteres inválidos (eso es responsabilidad del caller).
 */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export type UsernameValidationResult = { valid: true } | { valid: false; reason: string };

/**
 * Valida un username ya normalizado (lowercase, trimmed).
 * No verifica unicidad ni reserved usernames — eso es responsabilidad
 * del servicio que llama a esta función.
 */
export function validateUsernameFormat(username: string): UsernameValidationResult {
  if (username.length < USERNAME_MIN_LENGTH) {
    return {
      valid: false,
      reason: `Username must be at least ${USERNAME_MIN_LENGTH} characters`,
    };
  }

  if (username.length > USERNAME_MAX_LENGTH) {
    return {
      valid: false,
      reason: `Username must be at most ${USERNAME_MAX_LENGTH} characters`,
    };
  }

  if (!USERNAME_REGEX.test(username)) {
    return {
      valid: false,
      reason:
        'Username must start and end with a letter or number, and only contain letters, numbers, hyphens, or underscores',
    };
  }

  if (CONSECUTIVE_SEPARATORS_REGEX.test(username)) {
    return {
      valid: false,
      reason: 'Username cannot contain consecutive hyphens or underscores (e.g. -- or __)',
    };
  }

  return { valid: true };
}

/**
 * Normaliza y valida en un solo paso.
 * Retorna el username normalizado si es válido, o null si es inválido.
 * Útil para resolución rápida sin mensajes de error detallados.
 */
export function normalizeAndValidateUsername(raw: string): string | null {
  const normalized = normalizeUsername(raw);
  const result = validateUsernameFormat(normalized);
  return result.valid ? normalized : null;
}
