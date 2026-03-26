/**
 * ResolvedTenant — resultado interno de la resolución de tenant.
 *
 * Este DTO es de uso INTERNO entre TenantResolverService y los
 * servicios que lo consumen (PublicPagesService, futuros guards).
 * NO se expone directamente en ningún endpoint público.
 *
 * El campo `artistId` es el identificador interno estable del tenant.
 * Toda query posterior debe filtrar por este ID, nunca solo por username.
 */
export interface ResolvedTenant {
  /** Identificador interno estable del tenant. Usar para todas las queries. */
  artistId: string;

  /** Username público (normalizado, lowercase). */
  username: string;

  /** Nombre para mostrar. */
  displayName: string;

  /** Cómo fue resuelto este tenant (útil para logging y métricas). */
  resolvedVia: 'username' | 'custom_domain';
}
