# ADR-002: Ownership User → Artist (1:N)

- **Estado**: Aceptado
- **Fecha**: 2026-03-23
- **Deciders**: Roberto

---

## Contexto

¿Debe un usuario (cuenta de login) poder tener más de un artista/página?

Casos de uso reales:
- Manager que gestiona múltiples artistas
- Músico con proyecto solista + banda
- Label con varios artistas en su catálogo

---

## Decisión

Un `user` puede tener **N artistas** (`users.id → artists.user_id`, relación 1:N).

En **MVP**: la UI solo expone la creación de 1 artista por usuario (no hay multi-artist picker en el dashboard). El modelo de datos soporta N desde el día 1.

---

## Alternativas consideradas

| Opción | Pros | Contras |
|---|---|---|
| 1:1 estricto (user = artist) | Simpler auth | Bloquea casos de uso reales; migración costosa después |
| 1:N desde modelo (esta decisión) | Flexible; no requiere migración futura | Ligera complejidad en ownership checks |
| Organizaciones (team accounts) | Multi-member teams | Over-engineering para MVP; post-PMF |

---

## Consecuencias

**Positivas:**
- No hay migración de datos cuando se introduzca multi-artist en Fase 2
- Soporta casos de uso de management sin arquitectura adicional

**Negativas / compromisos:**
- Todo ownership check debe ir por `artist_id`, no por `user_id` directamente
- Los endpoints de API reciben `artist_id` en el path/body, no confiar en "el único artista del usuario logueado"
- En MVP, si un usuario tiene >1 artista (por bug o datos de seed), la UI debe mostrar el primero y no romper

---

## Implementación

```typescript
// Guard de ownership en NestJS (todos los endpoints de escritura)
async function requireArtistOwnership(
  userId: string,
  artistId: string
): Promise<Artist> {
  const artist = await db
    .select()
    .from(artists)
    .where(and(
      eq(artists.id, artistId),
      eq(artists.userId, userId)
    ))
    .limit(1);

  if (!artist[0]) throw new ForbiddenException('Not your artist');
  return artist[0];
}
```

```typescript
// Obtener artistas del usuario logueado
async function getArtistsByUser(userId: string): Promise<Artist[]> {
  return db
    .select()
    .from(artists)
    .where(eq(artists.userId, userId))
    .orderBy(artists.createdAt);
  // MVP: consumidor toma el primero
}
```

---

## Regla para implementación

> **Nunca** hacer queries del tipo "dame el artista de este user" asumiendo que hay exactamente 1.
> **Siempre** recibir `artist_id` explícito y verificar que `artist.user_id === authed_user_id`.

Esto aplica a: blocks CRUD, pages CRUD, analytics queries, billing, uploads, y cualquier recurso scoped al artista.
