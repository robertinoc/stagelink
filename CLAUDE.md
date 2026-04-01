# StageLink

Plataforma tipo Linktree enfocada en artistas (músicos, DJs, creadores visuales). Permite crear una página pública personalizada en `stagelink.io/username` con links, embeds de música/video, analytics y tienda.

> "Your digital stage." — Una landing page profesional para artistas, creada en minutos.

---

## Stack Técnico

- **Framework**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: WorkOS AuthKit (`@workos-inc/authkit-nextjs`)
- **Backend**: NestJS sobre Node.js
- **Base de datos**: PostgreSQL
- **ORM**: Prisma (con migraciones en `apps/api/prisma/migrations/`)
- **Storage**: Cloudflare R2 / AWS S3-compatible (avatars, covers, assets de EPK)
- **Pagos**: Stripe (suscripciones Free / Pro / Pro+)
- **Analytics**: PostHog + eventos propios en DB
- **i18n**: next-intl
- **Deploy**: Vercel (frontend) + Railway (backend, us-west2) + Cloudflare (DNS/CDN/proxy)
- **AI**: LLM para bio generada (Fase 3, no acoplado a un proveedor específico)
- **E-commerce**: Shopify Storefront API (plan Pro)

---

## Estructura del Proyecto

Monorepo pnpm con workspaces:

```
apps/
├── web/                    # Next.js 15 (App Router) — puerto 4000
│   └── src/
│       ├── app/
│       │   ├── layout.tsx              # Root layout (fonts, metadata base)
│       │   ├── globals.css             # CSS variables + Tailwind v4 theme
│       │   └── [locale]/               # i18n routing (en / es)
│       │       ├── layout.tsx          # NextIntlClientProvider
│       │       ├── (marketing)/        # Navbar + Footer layout
│       │       │   ├── page.tsx        # Home (LandingPage)
│       │       │   └── pricing/        # Pricing page
│       │       ├── (auth)/             # Centered auth layout
│       │       │   ├── login/
│       │       │   └── signup/
│       │       ├── (app)/              # Dashboard layout (Sidebar + Topbar)
│       │       │   ├── dashboard/
│       │       │   └── settings/
│       │       └── [username]/         # Página pública del artista (multi-tenant)
│       ├── components/
│       │   ├── ui/                     # shadcn/ui: Button, Card, Input, Badge, etc.
│       │   ├── layout/                 # Navbar, Sidebar, Footer, PageContainer
│       │   └── shared/                 # EmptyState, LoadingState
│       ├── features/
│       │   ├── marketing/              # LandingPage, hero, pricing
│       │   ├── auth/                   # LoginForm, SignupForm
│       │   ├── dashboard/              # DashboardWelcome, stats
│       │   └── public-page/            # ArtistPagePlaceholder
│       ├── i18n/
│       │   ├── request.ts              # getRequestConfig (next-intl)
│       │   └── messages/
│       │       ├── en.json             # English (nav, marketing, auth, dashboard)
│       │       └── es.json             # Spanish
│       ├── lib/
│       │   ├── utils.ts                # cn() helper (clsx + tailwind-merge)
│       │   ├── fonts.ts                # Geist Sans + Geist Mono (next/font)
│       │   └── public-api.ts           # fetchPublicPage() — fetch tipado sin auth
│       ├── hooks/
│       ├── types/
│       │   └── index.ts                # Re-exports @stagelink/types + UI types
│       └── middleware.ts               # next-intl locale routing
└── api/                    # NestJS — puerto 4001
    ├── Dockerfile          # Single-stage build (pnpm, single-stage para preservar symlinks)
    ├── .env.example        # Variables de entorno documentadas
    ├── prisma/
    │   ├── schema.prisma   # Schema completo (User, Artist, Page, Block, etc.)
    │   └── migrations/     # Migraciones SQL aplicadas en orden
    └── src/
        ├── main.ts         # Bootstrap: CORS, ValidationPipe, HttpExceptionFilter, shutdown hooks
        ├── app.module.ts   # AppModule con ConfigModule global + todos los módulos
        ├── config/
        │   ├── configuration.ts  # Config tipada por dominios (app/db/workos/stripe/s3/shopify)
        │   └── validation.ts     # Joi schema (DATABASE_URL requerida en producción)
        ├── lib/
        │   ├── prisma.service.ts  # PrismaService (lazy connect, OnModuleDestroy)
        │   ├── prisma.module.ts   # Global PrismaModule
        │   └── s3/
        │       ├── s3.service.ts  # Presigned PUT URL, object key strategy, delivery URL
        │       └── s3.module.ts   # @Global() S3Module
        ├── common/
        │   ├── filters/
        │   │   └── http-exception.filter.ts  # Formato consistente de errores
        │   ├── constants/
        │   │   ├── index.ts                  # DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
        │   │   └── reserved-usernames.ts     # Set<string> de usernames bloqueados (80+)
        │   ├── utils/
        │   │   ├── response.util.ts          # ok<T>() helper para respuestas tipadas
        │   │   └── username.util.ts          # normalizeUsername(), validateUsernameFormat()
        │   ├── decorators/index.ts           # Placeholder (CurrentUser, Public, Roles)
        │   ├── guards/index.ts               # Placeholder (JwtAuthGuard, RolesGuard)
        │   └── interceptors/index.ts         # Placeholder (TransformInterceptor)
        └── modules/
            ├── health/     # GET /api/health — status, uptime, environment
            ├── auth/       # WorkOS AuthKit (stub: GET /api/auth/session)
            ├── tenant/     # TenantResolverService — resolución central username→artistId
            ├── public/     # GET /api/public/pages/by-username/:username (sin auth)
            ├── artists/    # CRUD artistas + username lookup (stub)
            ├── assets/     # Upload pipeline: POST /upload-intent + POST /:id/confirm
            ├── pages/      # CRUD páginas públicas (stub)
            ├── blocks/     # CRUD bloques (stub)
            ├── analytics/  # GET /api/analytics/:artistId/overview — dashboard básico
            └── billing/    # Stripe suscripciones (stub)
packages/
├── types/                  # Interfaces compartidas (Artist, Page, Block, User, Asset, PublicPageResponse)
├── ui/                     # Wrappers shadcn + primitivos custom
└── config/                 # ESLint, tsconfig y prettier configs compartidas
docs/
├── multi-tenant.md              # Decisiones arquitectónicas, política de username, caching, dominios
├── auth-workos.md               # Flujo auth, rutas, variables, provisioning, seguridad
├── assets-s3.md                 # Pipeline S3, CORS, IAM, object key strategy, MinIO local, QA checklist
├── basic-analytics-dashboard.md # Fuente de verdad, métricas, API shape, limitaciones T4-2
└── fan-email-capture-block.md   # Schema, modelo subscribers, anti-abuse, export, privacidad T4-3
```

---

## Comandos

```bash
pnpm dev              # Levanta web (4000) + api (4001) en paralelo
pnpm build            # Build de producción (todos los workspaces)
pnpm lint             # ESLint en todo el monorepo
pnpm typecheck        # tsc --noEmit en todos los workspaces
pnpm format           # Prettier write
pnpm format:check     # Prettier check (CI)
pnpm test             # Tests en todos los workspaces

# Por workspace:
pnpm --filter @stagelink/web dev
pnpm --filter @stagelink/api dev
pnpm --filter @stagelink/web build

# DB (requiere DB local corriendo):
pnpm --filter @stagelink/api db:migrate      # prisma migrate dev
pnpm --filter @stagelink/api db:migrate:prod # prisma migrate deploy
pnpm --filter @stagelink/api db:generate     # prisma generate
pnpm --filter @stagelink/api db:studio       # Prisma Studio

# Infra local:
cd infra/docker && docker compose up -d   # PostgreSQL + MinIO
```

---

## Deploy

### Railway (backend)

- **URL producción**: `https://stagelink-production-18c8.up.railway.app`
- **Health check**: `GET /api/health`
- **Region**: us-west2 (Legacy)
- **Builder**: Dockerfile (`apps/api/Dockerfile`)
- **Pre-Deploy Command**: `pnpm --filter @stagelink/api exec prisma migrate deploy`
- **Custom Start Command**: vacío (usa `CMD ["node", "dist/main"]` del Dockerfile)
- **Puerto**: 3000 (inyectado por Railway via `PORT` env var)

### Vercel (frontend)

- Conectado a GitHub main branch
- Auto-deploy en cada push a main

---

## Autenticación

WorkOS AuthKit implementado. Ver `docs/auth-workos.md` para documentación completa.

### Flujo

1. Login → WorkOS hosted UI → `/api/auth/callback` → session cookie cifrada
2. Dashboard (App Router) → `withAuth()` server-side → redirect si no autenticado
3. API calls → `Authorization: Bearer <accessToken>` → `JwtAuthGuard` valida JWT vía JWKS
4. Primer request → provisioning de User interno en DB (workos_id, email, firstName, lastName)

### Rutas de auth

- Login: `/[locale]/login` → redirect a WorkOS
- Signup: `/[locale]/signup` → redirect a WorkOS
- Callback: `/api/auth/callback` (`handleAuth()`)
- Logout: `/api/auth/signout` (`signOut()`)
- Me: `GET /api/auth/me` (protegido, retorna User interno + artistIds)

### Protección de rutas

- **Frontend**: `(app)/layout.tsx` — `withAuth()` + `redirect('/login')` si no autenticado
- **Backend**: `APP_GUARD` global `JwtAuthGuard` — todos los endpoints salvo `@Public()`
- **Endpoints públicos**: `HealthController` y `PublicPagesController` decorados con `@Public()`

### User interno (DB)

WorkOS es el IdP. StageLink mantiene tabla `users` propia con `workos_id` como clave de vínculo.
El user interno se crea/provisiona la primera vez que llega un JWT válido (lazy provisioning).

---

## Arquitectura Multi-Tenant

Cada artista tiene un `username` único que actúa como identificador de tenant. Ver `docs/multi-tenant.md` para la documentación completa.

### Resolución por username (implementado)

```
GET /[username]
  → fetchPublicPage(username)  [apps/web/src/lib/public-api.ts]
    → GET /api/public/pages/by-username/:username
      → TenantResolverService.resolveByUsername()
        → normaliza username → busca en DB → retorna artistId
      → PublicPagesService.loadPublicPage(artistId)
        → carga page + blocks filtrados por artistId
      ← { artist: { username, displayName, bio, ... }, blocks: [...] }
  → notFound() si no existe o no publicado
  → renderiza ArtistPage con datos del tenant
```

### Resolución por dominio (preparado, no activo)

```
GET /api/public/pages/by-domain (Host header)
  → TenantResolverService.resolveByDomain(host)
    → isPlatformHost() — bloquea *.stagelink.com, *.vercel.app, *.railway.app, localhost
    → strip www → busca custom_domain con status='active'
    → retorna artistId si existe
```

### Política de usernames

| Regla         | Valor                                                             |
| ------------- | ----------------------------------------------------------------- |
| Caracteres    | `[a-z0-9_-]` — lowercase, dígitos, guión, underscore              |
| Longitud      | Mín 3, máx 30                                                     |
| Límites       | Debe empezar y terminar con `[a-z0-9]`                            |
| Prohibido     | `--`, `__`, unicode, espacios, puntos                             |
| Normalización | Siempre lowercase + trim antes de guardar y buscar                |
| Reserved      | Ver `reserved-usernames.ts` (80+ palabras: api, admin, www, etc.) |

### Caching

- Actualmente `cache: 'no-store'` en `fetchPublicPage()` — sin riesgo de mezcla entre tenants
- Migrar a ISR con `next: { tags: ['artist:username'] }` cuando el volumen lo justifique

---

## Modelos de Datos Principales

| Tabla              | Descripción                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| `users`            | Cuenta del usuario (vinculada a WorkOS)                                                               |
| `artists`          | Perfil artístico (username único = clave multi-tenant)                                                |
| `assets`           | Assets subidos (avatar, cover) — presigned URL pipeline                                               |
| `pages`            | Página pública del artista (1-to-1 con Artist)                                                        |
| `blocks`           | Bloques de contenido ordenados (link, music, video, fan_capture)                                      |
| `custom_domains`   | Dominios personalizados por artista (pending/active/failed/disabled)                                  |
| `analytics_events` | Eventos crudos (page_view, link_click, smart_link_resolution) — fuente de verdad del dashboard básico |
| `subscribers`      | Emails capturados via bloque fan capture                                                              |
| `subscriptions`    | Estado de suscripción Stripe por artista                                                              |

---

## Tipos de Bloque (MVP)

| Tipo          | Descripción                                          |
| ------------- | ---------------------------------------------------- |
| `link`        | URL genérica con título e icono                      |
| `music`       | Embed de Spotify o SoundCloud (auto-detecta por URL) |
| `video`       | Embed de YouTube o TikTok (auto-detecta por URL)     |
| `fan_capture` | Formulario de email con consentimiento               |

---

## Planes

| Plan | Precio | Límites                                                                    |
| ---- | ------ | -------------------------------------------------------------------------- |
| Free | $0     | Hasta 10 bloques, analytics básico, branding "Powered by StageLink"        |
| Pro  | $5/mes | Links ilimitados, sin branding, analytics completo, custom domain, Shopify |
| Pro+ | $9/mes | EPK builder, fan email capture, multi-language, features prioritarias      |

### Feature Gating

Usar un helper centralizado tanto en backend como en frontend para verificar el plan activo antes de exponer features. No duplicar la lógica.

---

## Analytics

- **Page views** y **clicks por bloque** en los últimos 30 días (plan Free)
- **Breakdown por país y dispositivo** (plan Pro+)
- Deduplicación: misma IP en menos de 1 hora no cuenta doble
- Las visitas del propio artista logueado no se contabilizan
- PostHog para eventos + tabla propia `analytics_events` cuando sea necesario

---

## Seguridad

- Ownership checks en todos los endpoints: un usuario solo puede editar sus propios artistas/páginas
- Rate limiting en endpoints de submit (fan capture, registro)
- Validación y sanitización de inputs (zod en backend + frontend)
- CSP/CORS configurados correctamente
- Presigned URLs para uploads a S3 (nunca exponer claves de AWS al cliente)
- Registrar en audit trail: create/update/publish/delete de páginas y bloques
- Endpoints públicos (`/api/public/`) no exponen userId, IDs internos, datos de suscripción

---

## Variables de Entorno

```
# Frontend (apps/web/.env.local)
NEXT_PUBLIC_APP_URL=                    # http://localhost:4000 en dev
NEXT_PUBLIC_API_URL=                    # http://localhost:4001 en dev
WORKOS_CLIENT_ID=                       # WorkOS Dashboard → API Keys
WORKOS_API_KEY=                         # WorkOS Dashboard → API Keys (server-side)
WORKOS_REDIRECT_URI=                    # http://localhost:4000/api/auth/callback
WORKOS_COOKIE_PASSWORD=                 # openssl rand -base64 32 (mín 32 chars)

# Backend (apps/api/.env)
DATABASE_URL=                           # PostgreSQL (requerida en producción)
PORT=                                   # Inyectado por Railway automáticamente
WORKOS_CLIENT_ID=                       # Para construir URL JWKS
WORKOS_API_KEY=                         # Para fetchear perfil en 1er login
WORKOS_REDIRECT_URI=                    # http://localhost:4000/api/auth/callback
AWS_S3_BUCKET=                          # Nombre del bucket (ej: stagelink-assets)
AWS_S3_REGION=                          # auto (R2) o us-east-1 (AWS)
AWS_ACCESS_KEY_ID=                      # R2 o IAM access key
AWS_SECRET_ACCESS_KEY=                  # R2 o IAM secret key
AWS_S3_ENDPOINT=                        # Solo para R2/MinIO: https://<account>.r2.cloudflarestorage.com
AWS_S3_PUBLIC_BASE_URL=                 # URL pública base para delivery de assets
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
POSTHOG_KEY=
SHOPIFY_STOREFRONT_TOKEN=               # Solo plan Pro
```

---

## Roadmap de Etapas

| Etapa | Contenido                                                       | Estado         |
| ----- | --------------------------------------------------------------- | -------------- |
| 0     | Estrategia y definición                                         | ✅ Completo    |
| 1     | Fundaciones técnicas (monorepo, scaffold, deploy)               | ✅ Completo    |
| 2     | Plataforma core (DB, auth, multi-tenant)                        | 🔄 En progreso |
| 3     | Constructor MVP (onboarding, editor de bloques, página pública) | ⏳ Pendiente   |
| 4     | Analytics y fan capture                                         | ⏳ Pendiente   |
| 5     | Monetización (Stripe, feature gating)                           | ⏳ Pendiente   |
| 6     | Features Pro (Shopify, EPK, analytics pro, i18n)                | ⏳ Pendiente   |
| 7     | AI + hardening + launch                                         | ⏳ Pendiente   |

---

## Estado Actual del Proyecto

### ✅ Completado

- PRD del MVP definido (`mvp.md`)
- Plan de proyecto con estimaciones
- Monorepo inicializado (pnpm workspaces, apps/web, apps/api, packages/)
- Tooling configurado (ESLint, Prettier, Husky, lint-staged, commitlint)
- Scaffold frontend completo (i18n, layouts, shadcn/ui, rutas, placeholders)
- i18n configurado (next-intl, locales en/es)
- Layouts: marketing (Navbar+Footer), auth (centrado), app (Sidebar+Topbar)
- Scaffold backend NestJS completo (ConfigModule, ValidationPipe, exception filter, health, módulos stub)
- Schema Prisma completo (User, Artist, Page, Block, Subscription, Analytics, Subscriber, CustomDomain)
- Railway deploy funcionando (`GET /api/health` → 200 en producción)
  - Single-stage Dockerfile (preserva symlinks pnpm)
  - CMD directo `node dist/main` (sin shell wrapper)
  - Pre-Deploy Command: `pnpm --filter @stagelink/api exec prisma migrate deploy`
- **Multi-tenant resolution implementado** (T2-1)
  - `TenantResolverService`: resolución central por username y por dominio
  - `GET /api/public/pages/by-username/:username` — endpoint público sin auth
  - `GET /api/public/pages/by-domain` — preparado para custom domains
  - Reserved usernames (80+): `api`, `admin`, `www`, `stagelink`, etc.
  - Username normalization + validación estricta centralizada
  - `custom_domains` table en DB (pending/active/failed/disabled)
  - Frontend `[username]/page.tsx` con fetch real + `notFound()` correcto
  - `docs/multi-tenant.md` con arquitectura, decisiones y checklist
- **WorkOS Auth implementado** (T2-3)
  - `JwtAuthGuard` real: valida JWT WorkOS vía JWKS con `jose`
  - `APP_GUARD` global: todos los endpoints protegidos salvo `@Public()`
  - Lazy provisioning: User interno creado en DB en el primer request autenticado
  - `GET /api/auth/me` — retorna User interno + artistIds
  - Frontend: `withAuth()` en `(app)/layout.tsx` → redirect a login si no autenticado
  - `LoginForm`/`SignupForm` redirigen a WorkOS hosted UI (no manejan credentials)
  - `/api/auth/callback` y `/api/auth/signout` vía `handleAuth()` / `signOut()`
  - `lib/auth.ts` — helpers de sesión para Server Components y `apiFetch()` autenticado
  - `docs/auth-workos.md` con flujo completo, variables, y próximos pasos
- **S3 Asset Pipeline implementado** (T2-4)
  - `S3Service` — presigned PUT URL, object key strategy (`artists/{id}/{kind}/{uuid}.ext`), delivery URL
  - `AssetsModule` — `POST /api/assets/upload-intent` + `POST /api/assets/:id/confirm`
  - `Asset` model en Prisma — lifecycle pending → uploaded, FK en Artist (avatarAssetId/coverAssetId)
  - Validación server-side: ownership, MIME type, tamaño (avatar 5MB / cover 8MB)
  - Frontend: `AvatarUpload` + `CoverUpload` con progress bar, settings page integrada
  - Storage: Cloudflare R2 (S3-compatible, sin egress fees)
  - `docs/assets-s3.md` con pipeline, CORS, IAM policy, MinIO local, QA checklist

### T3-1 — Artist Onboarding (completed)

- 4-step onboarding wizard: Name → Username → Category → Avatar (optional)
- Route: /[locale]/onboarding (inside (app) protected group)
- Redirect logic: /dashboard → /onboarding if no artists; /onboarding → /dashboard if has artists
- Backend: OnboardingModule with /api/onboarding/username-check + /api/onboarding/complete
- Transactional: artist + page + membership created atomically in one Prisma $transaction
- Avatar upload: reuses S3 presigned URL pipeline (step 4, optional, non-blocking on failure)
- ArtistCategory enum added to Artist model (11 values): musician, dj, actor, actress, painter, visual_artist, performer, creator, band, producer, other
- @stagelink/types ArtistCategory updated to match DB enum
- Docs: apps/api/docs/artist-onboarding.md

### T4-1 — PostHog + analytics_events ingestion (completed)

- `analytics_events` table con `event_type`, `artist_id`, `ip_hash`, `user_agent`, `created_at`
- Ingesta de `page_view` en `PublicPagesService.loadPublicPage()` (fire-and-forget, filtra bots)
- PostHog instrumentado en paralelo (externo)

### T4-2 — Basic Analytics Dashboard (completed)

- Migración DB: agrega `link_item_id`, `label`, `is_smart_link`, `smart_link_id` a `analytics_events`; agrega `smart_link_resolution` al enum `event_type`
- `GET /api/analytics/:artistId/overview?range=7d|30d|90d` — resumen con pageViews, linkClicks, CTR, smartLinkResolutions, topLinks (top 10 por clicks)
- `POST /api/public/events/link-click` — endpoint público con rate limiting (120 req/60s), reportado desde browser con `keepalive: true`
- `SmartLinksService.resolve()` registra `smart_link_resolution` fire-and-forget
- Frontend: `AnalyticsDashboard` client component con range selector (URL-based), summary cards, top links table, empty/error states, data quality note
- i18n: `dashboard.analytics.*` namespace en `en.json` + `es.json`
- Docs: `docs/basic-analytics-dashboard.md` — fuente de verdad, métricas, shape de API, limitaciones

### T4-3 — Fan Email Capture Block (completed)

- Migración DB: enriquece `subscribers` (agrega `artist_id`, `page_id`, `status`, `ip_hash`, `consent_text`, `source_page_path`, `locale`, `updated_at`); cambia unique de `[block_id, email]` a `[artist_id, email]`; agrega `fan_capture_submit` a enum `event_type`
- Block config `email_capture`: agrega `requireConsent`, `consentLabel`, `successMessage` (validados en `block-config.schema.ts`, tipados en `@stagelink/types`)
- `POST /api/public/blocks/:blockId/subscribers` — enriquecido con rate limiting, honeypot, validación de consent, deduplicación por artista+email, persistencia completa
- `GET /api/artists/:artistId/subscribers` — lista paginada (ownership required)
- `GET /api/artists/:artistId/subscribers/export` — CSV download (ownership required)
- Analytics: `fan_capture_submit` escrito fire-and-forget en `analytics_events` + PostHog (sin email ni PII)
- Frontend `EmailCaptureRenderer`: consent checkbox (cuando `requireConsent=true` o `consentLabel` set), honeypot field CSS-hidden, custom `successMessage`
- Frontend `BlockConfigForm`: campos de consent section, `successMessage`
- i18n: `consent_default`, `consent_required` en `renderer.email_capture`; `success_message`, `consent_section`, `require_consent`, `consent_label` en `fields`
- Docs: `docs/fan-email-capture-block.md` — schema, modelo, política de duplicados, anti-abuse, endpoints, export, privacidad, roadmap

### T5-1 — Stripe: productos, checkout, portal y webhooks (completed)

- Decisión de modelado: el billing pertenece al `artist`/tenant, no al `user`
- `subscriptions` actúa como proyección interna mínima del estado de Stripe por artista
- Migraciones billing: agrega `stripe_price_id`, `cancel_at_period_end` y tabla `stripe_webhook_events` para idempotencia por `stripe_event_id`
- Backend billing real:
  - `GET /api/billing/products`
  - `GET /api/billing/:artistId/subscription`
  - `POST /api/billing/:artistId/checkout`
  - `POST /api/billing/:artistId/portal`
  - `POST /api/billing/webhook`
- Checkout:
  - requiere auth + ownership sobre el artista
  - el cliente envía `plan` interno (`pro` | `pro_plus`)
  - el backend resuelve `price_id` desde config segura por entorno
  - metadata mínima: `artistId`, `plan`, `username`, `initiatingUserId`, `environment`
- Portal:
  - requiere auth + ownership
  - usa `stripe_customer_id` persistido del artista correcto
- Webhooks:
  - firma verificada con `STRIPE_WEBHOOK_SECRET`
  - eventos soportados: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
  - idempotencia por tabla `stripe_webhook_events` + `upsert` de suscripción
- Frontend billing:
  - sección funcional en dashboard billing
  - muestra plan/estado actual
  - permite iniciar checkout y abrir customer portal
  - el redirect de Stripe solo dispara feedback visual; el estado real se lee del backend
- Config/env:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_PRO_ID`
  - `STRIPE_PRICE_PRO_PLUS_ID`
- Docs: `docs/stripe-billing-foundation.md`

### ⏳ Pendiente

- T2-5: Implementar queries Prisma reales en módulos stub (artists, pages, blocks)
- Public access en bucket R2 + CORS para uploads desde browser
- Custom domains UI + DNS verification
- Editor de bloques
- T4-4: Deduplicación por IP hash, filtrado bots avanzado, exclusión tráfico interno, geo/device
- T5-2: Feature gating por plan usando `subscriptions.plan` + `subscriptions.status`
- T6-4: Analytics Pro (rangos custom, comparación, CSV export)

---

## Patrones a Reutilizar

| Patrón                            | Archivo                                                                    | Reuse For                                              |
| --------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| Tenant resolution centralizada    | `modules/tenant/tenant-resolver.service.ts`                                | Cualquier endpoint que necesite resolver artista       |
| Reserved usernames                | `common/constants/reserved-usernames.ts`                                   | Validación en UI + backend                             |
| Username normalization            | `common/utils/username.util.ts`                                            | Todos los inputs de username                           |
| Public fetch helper               | `apps/web/src/lib/public-api.ts`                                           | Fetch sin auth con cache: no-store                     |
| Auth session (server)             | `apps/web/src/lib/auth.ts`                                                 | getSession(), apiFetch(), AuthSession type             |
| Authenticated fetch (backend)     | `apps/web/src/lib/auth.ts` → `apiFetch()`                                  | Server Components que necesitan datos del API          |
| @Public() opt-out de auth         | `common/decorators/index.ts`                                               | Endpoints públicos que no requieren JWT                |
| @CurrentUser() en controllers     | `common/decorators/index.ts`                                               | Acceder al User interno en cualquier controller        |
| Lazy user provisioning            | `common/guards/index.ts` → `resolveUser()`                                 | Primer request post-signup → crea User en DB           |
| Feature gating centralizado       | Helper único importado desde `packages/`                                   | Verificar plan activo                                  |
| Presigned PUT URL para uploads    | `lib/s3/s3.service.ts` → `generatePresignedPutUrl()`                       | Avatars, covers, cualquier asset futuro                |
| Upload pipeline (intent+confirm)  | `modules/assets/` → `createUploadIntent()` + `confirmUpload()`             | Cualquier nuevo tipo de asset                          |
| Asset config centralizada         | `modules/assets/assets.constants.ts`                                       | Agregar nuevos kinds con MIME + size limits            |
| Webhook handlers idempotentes     | Stripe events                                                              | Billing                                                |
| Ownership check en servicios      | `common/guards/index.ts`                                                   | Todos los endpoints de escritura                       |
| Honeypot field (anti-bot)         | `EmailCaptureRenderer` + `CreateSubscriberDto` → `website` field           | Formularios públicos sin CAPTCHA                       |
| Consentimiento con snapshot       | `public-pages.service.ts` → `createSubscriber()` → `consentText`           | Guardar qué texto vio el usuario al dar consentimiento |
| Idempotencia per-artista+email    | `@@unique([artistId, email])` en `subscribers`                             | Evitar duplicados sin error para el fan                |
| CSV export privado                | `SubscribersService.exportCsv()` + `res.setHeader(Content-Disposition)`    | Descarga de datos propios del artista                  |
| any cast con Prisma schema nuevo  | `subscribers.service.ts` → `prismaSubscriber as any`                       | Usar campos nuevos antes de que Prisma regen en CI/CD  |
| Discriminated union para bloques  | Tipo `Block` con campo `type`                                              | Editor de bloques                                      |
| Analytics write (fire-and-forget) | `public-pages.service.ts` → `prisma.analyticsEvent.create().catch(()=>{})` | Nunca bloquear el response por eventos de analytics    |
| IP hashing para privacidad        | `createHash('sha256').update(ip ?? 'unknown').digest('hex')`               | Todos los eventos que guardan IP                       |
| Range selector SSR (URL params)   | `dashboard/analytics/page.tsx` + `RangeSelector` con `router.push`         | Date range pickers sin client fetch                    |
| @CheckOwnership para analytics    | `analytics.controller.ts` + `@UseGuards(OwnershipGuard)`                   | Endpoints de lectura de datos propios                  |
| Link click desde browser          | `track.ts` → `fetch(..., { keepalive: true })`                             | Reportar eventos del browser que sobreviven navegación |

---

## Workflow de Git

Siempre crear una rama nueva antes de trabajar en cualquier feature o actualización. Nunca trabajar directamente en `main`.
