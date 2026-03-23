# ADR-001: Resolución de página pública por username

- **Estado**: Aceptado
- **Fecha**: 2026-03-23
- **Deciders**: Roberto

---

## Contexto

StageLink necesita una URL pública para cada artista. Esta URL debe ser:
- Fácil de recordar y compartir (ej: para bio de Instagram)
- Funcionar sin login
- Ser performante (renderizada con caché)

Las opciones son: username (slug legible), UUID/ID numérico, o subdomain (`rockstar.stagelink.io`).

---

## Decisión

Usar el `username` del artista como identificador en la URL pública:

```
stagelink.io/{username}
```

El username es:
- Único globalmente en la tabla `artists`
- Elegido por el artista durante el onboarding
- Inmutable después de creado (puede cambiarse con fricción deliberada, Fase 2)
- Solo letras minúsculas, números, guiones y underscores (`[a-z0-9_-]`)
- Entre 3 y 30 caracteres

---

## Alternativas consideradas

| Opción | Pros | Contras |
|---|---|---|
| `stagelink.io/{username}` | Legible, compartible, SEO-friendly | Username valioso → squatting |
| `stagelink.io/{uuid}` | Sin conflictos | Ilegible, no shareable, no SEO |
| `stagelink.io/{id-numérico}` | Simple | Sin valor, no memorable |
| `{username}.stagelink.io` | Más presencia de marca | Wildcard SSL complejo; subdomain cookies |

---

## Consecuencias

**Positivas:**
- URLs que los artistas pueden memorizar y dictar en voz alta
- SEO natural: `stagelink.io/coldplay` tiene señales de marca
- Consistente con competidores (Linktree, Beacons) — reducción de fricción

**Negativas / compromisos:**
- Username squatting: artistas famosos pueden no conseguir su nombre. Mitigación: review manual en early access + reserva de lista.
- Cambiar username rompe links existentes. Mitigación: redirect 301 del username viejo al nuevo (Fase 2); en MVP el username es fijo.
- Lista de palabras reservadas necesaria: `admin`, `api`, `dashboard`, `settings`, `login`, `signup`, `help`, `billing`, `static`, etc. Mantener en application layer.

---

## Implementación

```typescript
// Next.js: app/[username]/page.tsx
export default async function ArtistPage({ params }) {
  const { username } = params;
  const artist = await getArtistByUsername(username);
  if (!artist || !artist.page.is_published) return notFound();
  // render...
}

// SQL lookup
SELECT a.id, a.display_name, a.bio, a.avatar_url,
       p.id as page_id, p.theme, p.is_published
FROM artists a
JOIN pages p ON p.artist_id = a.id AND p.slug = 'main'
WHERE a.username = $1
  AND a.is_active = true
  AND p.is_published = true;
```

```sql
-- Constraint en DB
ALTER TABLE artists
  ADD CONSTRAINT artists_username_format
  CHECK (username ~ '^[a-z0-9_-]{3,30}$');

CREATE UNIQUE INDEX idx_artists_username ON artists(username);
```
