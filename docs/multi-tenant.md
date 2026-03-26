# Multi-tenant Resolution — StageLink

## Resumen

StageLink es una plataforma multi-tenant donde cada tenant es un artista con su propia página pública. La resolución del tenant se hace por **username en el path** (`/[username]`) y está preparada para resolución por **dominio personalizado** en el futuro.

---

## Arquitectura actual

```
Browser → GET /robertinoc
  → Next.js [locale]/[username]/page.tsx
    → fetchPublicPage("robertinoc")
      → GET /api/public/pages/by-username/robertinoc
        → TenantResolverService.resolveByUsername("robertinoc")
          → DB: SELECT artist WHERE username = 'robertinoc'
          → Retorna: { artistId, username, displayName, resolvedVia: 'username' }
        → PublicPagesService.loadPublicPage(artistId)
          → DB: SELECT page + blocks WHERE artistId = [id] AND isVisible = true
          → Retorna: { artist: {...}, blocks: [...] }
      ← JSON response (solo campos públicos)
    ← renderiza ArtistPageView con datos del tenant
```

### Por qué `artistId` y no `username` para las queries

Una vez resuelto el tenant, **todas las queries usan el `artistId` interno** (cuid estable), nunca el username. Esto garantiza:

1. No hay data leakage si dos usernames son similares
2. Si en el futuro se permite cambiar username, las queries no se rompen
3. El tenant está aislado por su ID, no por su nombre público

---

## Módulos involucrados

### `TenantModule` / `TenantResolverService`

**Ubicación:** `apps/api/src/modules/tenant/`

Responsabilidad única: convertir un identificador público (username o dominio) en un `ResolvedTenant` con el `artistId` interno.

```typescript
// Resolución por username
resolveByUsername(rawUsername: string): Promise<ResolvedTenant | null>

// Resolución por dominio (preparado, actualmente retorna null para custom domains)
resolveByDomain(rawHost: string): Promise<ResolvedTenant | null>
```

### `PublicModule` / `PublicPagesController`

**Ubicación:** `apps/api/src/modules/public/`

Endpoints públicos sin autenticación:

| Endpoint                                      | Descripción                                       |
| --------------------------------------------- | ------------------------------------------------- |
| `GET /api/public/pages/by-username/:username` | Página de artista por username                    |
| `GET /api/public/pages/by-domain`             | Página de artista por Host header (custom domain) |

---

## Normalización de usernames

**Política** (fuente única de verdad: `username.util.ts`):

| Regla                 | Detalle                                                           |
| --------------------- | ----------------------------------------------------------------- |
| Caracteres permitidos | `[a-z0-9_-]` (lowercase, dígitos, guión, underscore)              |
| Longitud              | Mínimo 3, máximo 30 caracteres                                    |
| Inicio y fin          | Debe ser `[a-z0-9]` (no puede empezar ni terminar con `-` ni `_`) |
| Consecutivos          | No se permiten `--` ni `__`                                       |
| Unicode               | No permitido                                                      |
| Espacios              | No permitidos                                                     |
| Puntos                | No permitidos                                                     |
| Normalización         | Siempre lowercase + trim antes de guardar y de buscar             |

**Ejemplos válidos:** `robertinoc`, `dj-shadow`, `the_beatles`, `artist123`

**Ejemplos inválidos:** `-robertinoc`, `robertinoc-`, `my__name`, `röbert`, `ab` (muy corto)

---

## Reserved usernames

**Archivo:** `apps/api/src/common/constants/reserved-usernames.ts`

Lista de palabras que no pueden usarse como username porque colisionan con rutas del sistema, marketing, legal, infra, etc.

Para agregar una nueva reserva:

1. Agregar al `Set` en `reserved-usernames.ts`
2. Documentar el motivo en un comentario
3. Re-deployar (no requiere migración)

---

## Custom domains — preparación

La tabla `custom_domains` ya existe en el schema. El flujo preparado es:

```
Browser → GET / (con Host: robertinoc.com)
  → Next.js middleware detecta que no es plataforma
  → Llama a GET /api/public/pages/by-domain
    con Header Host: robertinoc.com
      → TenantResolverService.resolveByDomain("robertinoc.com")
        → isPlatformHost("robertinoc.com") → false
        → DB: SELECT custom_domain WHERE domain='robertinoc.com' AND status='active'
        → Retorna ResolvedTenant con artistId
      → loadPublicPage(artistId) → igual que por username
```

Lo que **no está implementado todavía** (future work):

- Panel de UI para conectar dominios
- Validación DNS automática
- Provisioning SSL
- Middleware de Next.js para custom domains (requiere cambios en Vercel/infra)

---

## Dominios de plataforma vs custom domains

La función `isPlatformHost()` en `tenant-resolver.service.ts` define qué hosts son internos:

| Host                    | Tratamiento                                        |
| ----------------------- | -------------------------------------------------- |
| `stagelink.com`         | Plataforma — no es custom domain                   |
| `app.stagelink.com`     | Plataforma (subdominio)                            |
| `api.stagelink.com`     | Plataforma (subdominio)                            |
| `staging.stagelink.com` | Plataforma (subdominio)                            |
| `*.vercel.app`          | Plataforma (preview deploys) — nunca custom domain |
| `*.railway.app`         | Plataforma (Railway service) — nunca custom domain |
| `localhost`             | Desarrollo local — nunca custom domain             |
| `127.0.0.1`             | Desarrollo local — nunca custom domain             |
| `robertinoc.com`        | Posible custom domain — buscar en DB               |

**Regla de www:** `www.artist.com` se normaliza a `artist.com` antes de buscar en DB. El artista registra `artist.com` (sin www); la resolución funciona para ambos.

**Preview deploys:** Los dominios `*.vercel.app` están en la lista de plataforma. Nunca se tratarán como custom domains, evitando que un preview de Vercel resuelva incorrectamente a un tenant.

---

## Caching y SSR

### Riesgos de caché con multi-tenant

El mayor riesgo es que Next.js cachee la respuesta de `/en/robertinoc` y la sirva para `/en/johndoe`. Para evitar esto:

**Estrategia actual:** `cache: 'no-store'` en `fetchPublicPage()`

- Cada request va al backend sin caché
- Sin riesgo de mezclar tenants
- El costo es latencia adicional en cada pageview

**Estrategia futura (ISR):**

```typescript
// Cuando el volumen lo justifique, cambiar a:
fetch(url, {
  next: {
    tags: [`artist:${username}`],
    revalidate: 60, // 1 minuto
  },
});
// Y revalidar con revalidateTag(`artist:${username}`) al editar
```

**Cache key por tenant:** Cuando se active ISR, la cache key debe incluir el `username` o el dominio. Nunca usar una key global que pueda mezclar tenants.

**Metadata:** `generateMetadata()` también usa `fetchPublicPage()` con `cache: 'no-store'`. Next.js deduplica la fetch dentro del mismo render (Request Memoization).

---

## Seguridad

### Aislamiento entre tenants

1. `TenantResolverService` retorna `artistId` — nunca se mezclan tenants
2. `PublicPagesService.loadPublicPage()` filtra por `artistId` explícitamente
3. Los bloques se filtran por `isVisible: true` — bloques ocultos no se exponen
4. No se expone: `userId`, `workosId`, datos de suscripción, ni ningún campo interno

### Datos no expuestos en endpoints públicos

| Campo              | ¿Expuesto? | Motivo                              |
| ------------------ | ---------- | ----------------------------------- |
| `artist.id`        | ❌ No      | ID interno, no necesario en público |
| `artist.userId`    | ❌ No      | Vincula a WorkOS, dato privado      |
| `artist.createdAt` | ❌ No      | Dato operacional, no necesario      |
| `page.id`          | ❌ No      | ID interno, no necesario            |
| `block.isVisible`  | ❌ No      | Ya filtrado (solo visibles llegan)  |
| `subscription.*`   | ❌ No      | Dato privado de billing             |

---

## Checklist de validación

### Local

- [ ] `pnpm --filter @stagelink/api typecheck` — sin errores TypeScript
- [ ] `pnpm --filter @stagelink/web typecheck` — sin errores TypeScript
- [ ] `pnpm --filter @stagelink/api lint` — sin warnings
- [ ] `pnpm --filter @stagelink/web lint` — sin warnings
- [ ] Migración aplicada: `pnpm --filter @stagelink/api db:migrate`
- [ ] `GET /api/public/pages/by-username/[username-válido]` → 200 + JSON
- [ ] `GET /api/public/pages/by-username/admin` → 404 (reservado)
- [ ] `GET /api/public/pages/by-username/inexistente` → 404
- [ ] `GET /api/public/pages/by-username/MAYUS` → 200 (normalizado a lowercase)
- [ ] `GET /api/public/pages/by-domain` con `Host: stagelink.com` → 404 (plataforma)
- [ ] Next.js `/[username]` con artista válido → renderiza página
- [ ] Next.js `/[username]` con artista inexistente → 404 HTTP real

### Railway (producción)

- [ ] Migración ejecutada via Pre-Deploy Command
- [ ] `GET https://stagelink-production-18c8.up.railway.app/api/public/pages/by-username/[artista]` → respuesta correcta
- [ ] `GET https://stagelink-production-18c8.up.railway.app/api/public/pages/by-username/admin` → 404

---

## Próximos pasos (post esta tarea)

1. **T2-2**: WorkOS auth integration → JwtAuthGuard real
2. **T2-3**: Implementar `ArtistsService.findByUsername()` con Prisma real (dashboard)
3. **Custom domains UI** (T4+): Panel para agregar y verificar dominios
4. **Custom domains middleware**: Middleware de Next.js para rutas con custom domain
5. **ISR**: Reemplazar `cache: 'no-store'` por tags cuando el volumen lo requiera
6. **ArtistPageView**: Reemplazar `ArtistPagePlaceholder` por el editor/vista completo
