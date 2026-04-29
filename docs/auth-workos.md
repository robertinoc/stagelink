# Auth con WorkOS — Documentación Técnica

## Arquitectura del flujo

```
Usuario → Login Page → WorkOS AuthKit (hosted UI) → OAuth Callback
         ↓                                           ↓
    (ver dashboard)                        Session Cookie cifrada
                                                     ↓
    Dashboard (Server Component) ←── withAuth() valida cookie
         ↓
    API Call → Authorization: Bearer <accessToken>
         ↓
    NestJS JwtAuthGuard
         ↓
    Validar JWT vía JWKS (WorkOS)
         ↓
    DB lookup / provisioning de User interno
         ↓
    request.user = User
```

## Rutas involucradas

### Frontend (Next.js)

| Ruta                  | Tipo                    | Descripción                                          |
| --------------------- | ----------------------- | ---------------------------------------------------- |
| `/[locale]/login`     | Server Page             | Muestra botón "Sign in" que redirige a WorkOS        |
| `/[locale]/signup`    | Server Page             | Muestra botón "Create account" que redirige a WorkOS |
| `/api/auth/callback`  | API Route               | OAuth callback — `handleAuth()` del SDK              |
| `/api/auth/signout`   | API Route               | Limpia cookie de sesión y redirige a `/`             |
| `/[locale]/dashboard` | Server Page (protegida) | Requiere sesión vía `withAuth()` en layout           |
| `/[locale]/settings`  | Server Page (protegida) | Ídem dashboard                                       |

### Backend (NestJS)

| Endpoint                                      | Protección         | Descripción                            |
| --------------------------------------------- | ------------------ | -------------------------------------- |
| `GET /api/auth/me`                            | JWT (JwtAuthGuard) | Retorna perfil del usuario autenticado |
| `GET /api/health`                             | `@Public()`        | Health check, sin auth                 |
| `GET /api/public/pages/by-username/:username` | `@Public()`        | Páginas públicas, sin auth             |
| `GET /api/public/pages/by-domain`             | `@Public()`        | Páginas públicas, sin auth             |

## Variables de entorno necesarias

### Frontend (`apps/web/.env.local`)

```env
# WorkOS AuthKit
WORKOS_CLIENT_ID=client_XXXXXXXX      # Dashboard → Your App → API Keys
WORKOS_API_KEY=sk-XXXXXXXXXXXXXXXX    # Dashboard → Your App → API Keys (server-side)
WORKOS_REDIRECT_URI=http://localhost:4000/api/auth/callback
WORKOS_COOKIE_PASSWORD=<32+ chars>    # openssl rand -base64 32

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4001
```

### Backend (`apps/api/.env`)

```env
# WorkOS
WORKOS_CLIENT_ID=client_XXXXXXXX      # Para construir la URL del JWKS
WORKOS_API_KEY=sk-XXXXXXXXXXXXXXXX    # Para fetchear perfil en el primer login

# Database
DATABASE_URL=postgresql://...
```

## Configuración en WorkOS Dashboard

1. Ir a **Authentication** → **Redirect URIs**
2. Añadir cada URL de callback:
   - `http://localhost:4000/api/auth/callback` (local)
   - `https://stagelink.link/api/auth/callback` (producción canónica)
   - `https://staging.stagelink.link/api/auth/callback` (staging, si está activo)
   - `https://*.vercel.app/api/auth/callback` (preview)
3. Configurar los **Auth Methods** que corresponda (Email + Password es suficiente para MVP)

`stagelink.art` y `www.stagelink.art` son dominios de redirect hacia
`stagelink.link`; no deberían configurarse como callback principal salvo que se
decida permitir sesiones directas en ese host.

## Flujo login / signup / logout

### Login

1. Usuario llega a `/[locale]/login`
2. Si hay sesión activa → redirect a `/[locale]/dashboard`
3. Si no hay sesión → `getSignInUrl()` construye URL de WorkOS
4. Usuario hace click en "Sign in" → redirigido a WorkOS hosted UI
5. Usuario autenticado → WorkOS redirige a `/api/auth/callback?code=...`
6. `handleAuth()` intercambia code por tokens, guarda cookie cifrada
7. Usuario redirigido a `/dashboard`

### Signup

Igual que login pero usando `getSignUpUrl()` — WorkOS muestra formulario de registro.

### Logout

1. Click en "Log out" → `GET /api/auth/signout`
2. `signOut()` limpia la cookie de sesión
3. WorkOS invalida el refresh token
4. Redirect a `/`

## Provisioning / sync del usuario interno

El usuario interno (`users` table) se sincroniza con WorkOS en el **primer request autenticado**:

```
JWT válido → buscar User por workos_id
  ├── Encontrado → usar registro de DB directamente (fast path)
  └── No encontrado → 1er login:
        ├── fetch workos.userManagement.getUser(workosUserId)
        ├── prisma.user.upsert(...)  ← crea el registro
        └── adjuntar a request.user
```

**Campos sincronizados (solo en creación):**

- `workos_id` → identificador principal del vínculo
- `email` → del perfil WorkOS
- `first_name`, `last_name`, `avatar_url` → del perfil WorkOS

**Actualización de perfil:**
El perfil no se actualiza automáticamente en cada request por performance.
Para sincronizar cambios de perfil (ej: nuevo avatar en WorkOS), implementar
endpoint `PUT /api/auth/profile/sync` que llame a `workos.userManagement.getUser()`
y actualice los campos del usuario interno.

**Idempotencia:**
Se usa `prisma.user.upsert()` para manejar race conditions cuando dos requests
del mismo usuario nuevo llegan simultáneamente.

## Protección de rutas

### Frontend

- `(app)/layout.tsx` llama a `withAuth()` sin `ensureSignedIn`
- Si `user === null` → `redirect('/[locale]/login')` preservando locale
- Si hay sesión → renderiza el layout con datos del usuario

**¿Por qué no `withAuth({ ensureSignedIn: true })`?**
Con `ensureSignedIn: true`, el SDK redirige directamente a WorkOS auth (bypasseando
nuestra login page). Usamos `withAuth()` + redirect manual para conservar el control
de la experiencia de login (branding, locale, mensajes de error).

### Backend

- `JwtAuthGuard` está registrado como `APP_GUARD` global en `AppModule`
- **Por defecto: todos los endpoints requieren JWT válido**
- Opt-out para endpoints públicos: decorar con `@Public()`

```typescript
// Marcar endpoint como público (sin auth)
@Public()
@Get('by-username/:username')
getPublicPage() { ... }

// Endpoint privado (requiere JWT) — sin decorador adicional
@Get('me')
getMe(@CurrentUser() user: User) { ... }
```

## Validación JWT en el backend

```
Authorization: Bearer <accessToken>
         ↓
JwtAuthGuard.canActivate()
         ↓
jwtVerify(token, jwks) ← JWKS endpoint: api.workos.com/user_management/jwks/{clientId}
         ↓
payload.sub = workosUserId
         ↓
prisma.user.findUnique({ where: { workosId } })
         ↓
request.user = User (internal DB record)
```

La validación es **local**: `jose` cachea el JWKS y verifica la firma criptográfica
sin round-trips extra a WorkOS por cada request. Solo el primer login genera una
llamada a la API de WorkOS (para fetchear el perfil).

## Próximos pasos — Ownership y Memberships

### Esquema actual

```
User (1) ──── (N) Artist
```

Un user puede tener múltiples artists (desde el MVP).

### Próximo paso: Ownership check

Cuando se implementen los endpoints de gestión (CRUD de artistas, páginas, bloques),
el `OwnershipGuard` deberá verificar que el `user.id` tenga acceso al recurso:

```typescript
// Implementación pendiente en OwnershipGuard
const artist = await prisma.artist.findFirst({
  where: {
    id: params.artistId,
    userId: request.user.id, // solo artists del user actual
  },
});
if (!artist) throw new ForbiddenException();
```

### Futuro: Multi-user por artista (memberships)

Para soportar equipos (varios admins por artista), agregar tabla `artist_memberships`:

```sql
CREATE TABLE artist_memberships (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id  TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'admin', -- 'owner' | 'admin' | 'viewer'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id, user_id)
);
```

Luego, el `OwnershipGuard` verificaría en `artist_memberships` en lugar de
en `artists.user_id`.

## Riesgos y limitaciones conocidas

| Riesgo                                               | Mitigación                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| Cookie comprometida → sesión válida                  | Cookie httpOnly + Secure en prod; WorkOS gestiona revocación                   |
| Email cambia en WorkOS                               | `email` en DB puede quedar desactualizado → implementar sync periódico         |
| Múltiples requests paralelos del mismo usuario nuevo | `upsert` en `resolveUser()` garantiza idempotencia                             |
| Token expirado entre requests SSR                    | `withAuth()` refresca el token automáticamente vía `refreshToken` en cookie    |
| `WORKOS_COOKIE_PASSWORD` rotado → sesiones invalidas | Coordinar rotación con downtime o implementar keychain multi-key               |
| Stub controllers (artists, pages, blocks) expuestos  | Por ser stubs, requieren JWT pero no retornan datos reales — OK en development |
