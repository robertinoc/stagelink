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
- **Storage**: AWS S3 (avatars, covers, assets de EPK)
- **Pagos**: Stripe (suscripciones Free / Pro / Pro+)
- **Analytics**: PostHog + eventos propios en DB
- **i18n**: next-intl
- **Deploy**: Vercel (frontend) + Railway o Fly.io (backend) + Cloudflare (DNS/CDN/proxy)
- **AI**: LLM para bio generada (Fase 3, no acoplado a un proveedor específico)
- **E-commerce**: Shopify Storefront API (plan Pro)

---

## Estructura del Proyecto

Monorepo pnpm con workspaces:

```
apps/
├── web/          # Next.js frontend
└── api/          # NestJS backend
packages/         # Código compartido (tipos, validaciones, etc.)
docs/
├── architecture/
│   ├── entities.md   # DER + definición completa de tablas
│   └── flows.md      # Flujos: registro, dashboard, página pública, analytics
└── adr/
    ├── 001-username-resolution.md    # Resolución por username vs UUID/subdomain
    ├── 002-user-artist-ownership.md  # Ownership 1:N user→artist
    └── 003-custom-domain-future.md   # Custom domain diferido a Fase 2
mvp.md                # PRD del MVP con criterios de aceptación
```

---

## Comandos

```bash
pnpm dev          # Levanta web + api en modo desarrollo
pnpm build        # Build de producción (todos los workspaces)
pnpm lint         # ESLint en todo el monorepo
pnpm test         # Tests en todos los workspaces
```

---

## Autenticación

WorkOS AuthKit con middleware de protección. El dashboard requiere sesión activa. Las páginas públicas de artistas (`/[username]`) son accesibles sin login.

- Login: `/api/auth/signin`
- Logout: `/api/auth/signout`
- Callback OAuth: `/api/auth/callback`

---

## Arquitectura Multi-Tenant

Cada artista tiene un `username` único que actúa como identificador de tenant:

- **URL pública**: `stagelink.io/username`
- **Resolución**: `username` → `artist` → `page` + `blocks`
- **Ownership**: cada `user` puede tener uno o más `artists` (MVP: uno por usuario)
- **Custom domain** (plan Pro+): preparado en DB, implementación en Fase 2

### Flujo de request público

```
request → Cloudflare → Vercel → Next.js middleware
  → lookup username en DB → render SSR/ISR con profile + blocks
```

---

## Modelos de Datos Principales

| Tabla | Descripción |
|---|---|
| `users` | Cuenta del usuario (vinculada a WorkOS) |
| `artists` | Perfil artístico (username, nombre, bio, avatar, cover) |
| `pages` | Página pública del artista (configuración, visibilidad) |
| `blocks` | Bloques de contenido ordenados (link, music, video, fan_capture) |
| `analytics_events` | Eventos crudos (page_view, link_click) |
| `subscribers` | Emails capturados via bloque fan capture |
| `subscriptions` | Estado de suscripción Stripe por artista |

---

## Tipos de Bloque (MVP)

| Tipo | Descripción |
|---|---|
| `link` | URL genérica con título e icono |
| `music` | Embed de Spotify o SoundCloud (auto-detecta por URL) |
| `video` | Embed de YouTube o TikTok (auto-detecta por URL) |
| `fan_capture` | Formulario de email con consentimiento |

---

## Planes

| Plan | Precio | Límites |
|---|---|---|
| Free | $0 | Hasta 10 bloques, analytics básico, branding "Powered by StageLink" |
| Pro | $5/mes | Links ilimitados, sin branding, analytics completo, custom domain, Shopify |
| Pro+ | $9/mes | EPK builder, fan email capture, multi-language, features prioritarias |

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

---

## Variables de Entorno

```
# Frontend (apps/web)
NEXT_PUBLIC_APP_URL=
WORKOS_CLIENT_ID=
WORKOS_API_KEY=
NEXT_PUBLIC_API_URL=

# Backend (apps/api)
DATABASE_URL=
WORKOS_API_KEY=
AWS_BUCKET=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
POSTHOG_API_KEY=
SHOPIFY_STOREFRONT_TOKEN=   # Solo plan Pro
```

---

## Roadmap de Etapas

| Etapa | Contenido | Horas est. |
|---|---|---:|
| 0 | Estrategia y definición | 12 h |
| 1 | Fundaciones técnicas (monorepo, scaffold, deploy) | 22 h |
| 2 | Plataforma core (DB, auth, S3, multi-tenant) | 34 h |
| 3 | Constructor MVP (onboarding, editor de bloques, página pública) | 54 h |
| 4 | Analytics y fan capture | 27 h |
| 5 | Monetización (Stripe, feature gating) | 24 h |
| 6 | Features Pro (Shopify, EPK, analytics pro, i18n) | 41 h |
| 7 | AI + hardening + launch | 28 h |

**MVP funcional + pagos**: Etapas 0–5 (~173 h / ~17 semanas a 2 h/día)

---

## Estado Actual del Proyecto

- [x] PRD del MVP definido (`mvp.md`)
- [x] Plan de proyecto con estimaciones (`stagelink_project_plan.md`)
- [x] Backlog importado en Asana (`stagelink_asana_import.csv`)
- [x] Landing page diseñada (`stagelink_landing_page_nextjs.jsx`)
- [x] Modelo de entidades definido (`docs/architecture/entities.md`)
- [x] Flujos de aplicación documentados (`docs/architecture/flows.md`)
- [x] ADRs de arquitectura (`docs/adr/`)
- [ ] Monorepo inicializado
- [ ] Schema de base de datos (migración SQL)
- [ ] Auth integrada
- [ ] Editor de bloques

---

## Patrones a Reutilizar

| Patrón | Dónde aplicarlo |
|---|---|
| Multi-tenant por username | Middleware Next.js + guards NestJS |
| Feature gating centralizado | Helper único importado desde `packages/` |
| Presigned URLs para uploads | Módulo S3 en NestJS |
| Webhook handlers idempotentes | Stripe events |
| Ownership check en servicios | Todos los endpoints de escritura |
| Discriminated union para bloques | Tipo `Block` con campo `type` |

---

## Workflow de Git

Siempre crear una rama nueva antes de trabajar en cualquier feature o actualización. Nunca trabajar directamente en `main`.
