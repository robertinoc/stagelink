# Ownership, Permisos y Auditoría — T2-5

## Modelo de Datos

### artist_memberships

Fuente de verdad para autorización. Cada Artist puede tener múltiples User con distintos roles.

| Campo    | Tipo       | Descripción                     |
| -------- | ---------- | ------------------------------- |
| id       | cuid       | PK                              |
| artistId | FK         | Referencia a artists            |
| userId   | FK         | Referencia a users              |
| role     | ArtistRole | owner / admin / editor / viewer |

**Constraint único**: (artistId, userId) — un usuario tiene un solo rol por artist.

### Roles y permisos

| Rol    | read | write | admin | owner |
| ------ | ---- | ----- | ----- | ----- |
| viewer | ✅   | ❌    | ❌    | ❌    |
| editor | ✅   | ✅    | ❌    | ❌    |
| admin  | ✅   | ✅    | ✅    | ❌    |
| owner  | ✅   | ✅    | ✅    | ✅    |

### audit_logs

Registro inmutable de acciones. Fire-and-forget: nunca bloquea el request.

| Campo      | Tipo    | Descripción                     |
| ---------- | ------- | ------------------------------- |
| actorId    | FK      | User que realizó la acción      |
| action     | string  | Ej: artist.create, block.delete |
| entityType | string  | artist / page / block / asset   |
| entityId   | string  | ID del recurso afectado         |
| metadata   | JSON    | Datos adicionales de contexto   |
| ipAddress  | string? | IP del cliente                  |

## Servicios

### MembershipService (@Global)

```typescript
validateAccess(userId, artistId, required: AccessLevel): Promise<Membership>
getArtistIdsForUser(userId): Promise<string[]>
resolveArtistIdForResource(resource, id): Promise<string | null>
createOwnership(artistId, userId): Promise<Membership>
```

### AuditService (@Global)

```typescript
log(payload: AuditPayload): void  // fire-and-forget
```

## OwnershipGuard

Flujo actualizado:

1. Lee metadata de `@CheckOwnership(resource, param, access?)`
2. Extrae el param del request
3. Llama `membershipService.resolveArtistIdForResource(resource, paramValue)` → artistId
4. Si no existe → 404 (no revela si el recurso existe en otro tenant)
5. Llama `membershipService.validateAccess(userId, artistId, access)` → lanza 403 si no tiene permiso

## Acciones auditadas

| Acción               | Trigger                                |
| -------------------- | -------------------------------------- |
| artist.create        | POST /api/artists                      |
| artist.update        | PATCH /api/artists/:id                 |
| artist.delete        | DELETE /api/artists/:id                |
| page.update          | PATCH /api/pages/:pageId               |
| block.create         | POST /api/blocks                       |
| block.update         | PATCH /api/blocks/:id                  |
| block.delete         | DELETE /api/blocks/:id                 |
| block.reorder        | PATCH /api/blocks/page/:pageId/reorder |
| asset.upload.intent  | POST /api/assets/upload-intent         |
| asset.upload.confirm | POST /api/assets/:id/confirm           |
