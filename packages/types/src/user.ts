/**
 * Tipos de usuario para StageLink.
 *
 * User representa el usuario interno de StageLink (almacenado en DB).
 * Vinculado a WorkOS por workosId — WorkOS es el proveedor de identidad/auth.
 *
 * El usuario interno NO incluye credenciales ni tokens.
 * workosId se omite de las respuestas de API públicas (solo uso interno).
 */

export type UserRole = 'owner' | 'admin' | 'viewer';

/** Usuario interno de StageLink (respuesta segura de GET /api/auth/me) */
export interface User {
  /** ID interno de StageLink */
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  /** IDs de artistas administrados por este usuario */
  artistIds: string[];
  createdAt: Date;
}

/**
 * Datos mínimos de usuario para UI (headers, avatares, menciones).
 */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  /** firstName + lastName, o email como fallback */
  displayName: string;
}
