# StageLink — Flujos de la Aplicación

> Versión: 1.0 | Fecha: 2026-03-23

---

## 1. Flujo completo: desde registro hasta fans visitando la página

```
┌─────────────────────────────────────────────────────────────────┐
│  ARTISTA                                                        │
│                                                                 │
│  1. REGISTRO                                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Visita stagelink.io                                     │  │
│  │  → Click "Crear mi página"                              │  │
│  │  → WorkOS AuthKit: email/pass o Google OAuth            │  │
│  │  → WorkOS callback → /api/auth/callback                 │  │
│  │  → Crear user interno (si no existe)                    │  │
│  │  → Redirect → /onboarding                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ▼                                      │
│  2. ONBOARDING (3 pasos)                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Paso 1: Elegir username                                 │  │
│  │    → Input con validación en tiempo real (debounced)    │  │
│  │    → API: GET /api/artists/check-username?u=rockstar    │  │
│  │    → Responde: { available: true/false }                │  │
│  │    → Al confirmar: POST /api/artists                    │  │
│  │      { username, display_name }                         │  │
│  │    → Crea: artist + page (slug: 'main', published: F)  │  │
│  │                                                          │  │
│  │  Paso 2: Subir foto + bio                               │  │
│  │    → Upload foto: GET presigned URL → PUT directo a S3  │  │
│  │    → PATCH /api/artists/:id { avatar_url, bio }         │  │
│  │                                                          │  │
│  │  Paso 3: Agregar primer link                            │  │
│  │    → POST /api/pages/:pageId/blocks                     │  │
│  │      { type: 'link', config: { url, title } }           │  │
│  │    → Bloque creado con position: 0                      │  │
│  │                                                          │  │
│  │  Fin onboarding:                                         │  │
│  │    → PATCH /api/pages/:pageId { is_published: true }    │  │
│  │    → Copy to clipboard: stagelink.io/username           │  │
│  │    → Banner: "¡Tu página está lista!"                   │  │
│  │    → Redirect → /dashboard                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ▼                                      │
│  3. CONFIGURAR BLOQUES (Editor)                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  GET /api/pages/:pageId/blocks → lista ordenada         │  │
│  │                                                          │  │
│  │  Agregar bloque:                                         │  │
│  │    → Seleccionar tipo (link / music / video)            │  │
│  │    → Completar formulario con validación Zod            │  │
│  │    → POST /api/pages/:pageId/blocks                     │  │
│  │    → UI optimistic update → sincroniza con respuesta    │  │
│  │                                                          │  │
│  │  Reordenar:                                             │  │
│  │    → Drag & drop → nuevo array de positions            │  │
│  │    → PATCH /api/pages/:pageId/blocks/reorder            │  │
│  │      { order: [blockId1, blockId2, ...] }               │  │
│  │    → Batch update de positions en DB                    │  │
│  │                                                          │  │
│  │  Editar:                                                │  │
│  │    → PATCH /api/pages/:pageId/blocks/:blockId           │  │
│  │      { config: { ... } }                                │  │
│  │                                                          │  │
│  │  Eliminar:                                              │  │
│  │    → Dialog de confirmación                             │  │
│  │    → DELETE /api/pages/:pageId/blocks/:blockId          │  │
│  │                                                          │  │
│  │  Guardar:                                               │  │
│  │    → Botón "Guardar cambios" (no auto-save en MVP)      │  │
│  │    → Mientras hay cambios: botón = "Cambios sin guardar"│  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ▼                                      │
│  4. PUBLICAR                                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PATCH /api/pages/:pageId { is_published: true }        │  │
│  │  → Revalida caché ISR de Next.js para /username         │  │
│  │  → La página es accesible públicamente                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  FAN                                                            │
│                                                                 │
│  5. VISITA PÁGINA PÚBLICA                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Navega a: stagelink.io/rockstar                        │  │
│  │                ▼                                         │  │
│  │  Cloudflare CDN                                          │  │
│  │    → Cache HIT → sirve HTML directamente                │  │
│  │    → Cache MISS → forward a Vercel                      │  │
│  │                ▼                                         │  │
│  │  Next.js App Router: app/[username]/page.tsx            │  │
│  │    → getArtistByUsername('rockstar')                    │  │
│  │    → SELECT * FROM artists WHERE username = 'rockstar'  │  │
│  │    → Si no existe → 404 + CTA "Crea tu página"          │  │
│  │    → Si existe:                                          │  │
│  │      - getPageWithBlocks(artist.id)                     │  │
│  │      - Si page.is_published = false → 404               │  │
│  │      - Render SSR con profile + blocks                  │  │
│  │    → Cache ISR: revalidate cada 60s (configurable)      │  │
│  │                ▼                                         │  │
│  │  Página renderizada en browser del fan                   │  │
│  │    → Fire & forget: POST /api/analytics/events          │  │
│  │      { type: 'page_view', artist_id, page_id,           │  │
│  │        visitor_id, country, device }                     │  │
│  │                ▼                                         │  │
│  │  Fan hace click en un link:                             │  │
│  │    → Fire & forget: POST /api/analytics/events          │  │
│  │      { type: 'block_click', block_id, ... }             │  │
│  │    → Browser navega al destino (target="_blank")        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Flujo: Usuario entra al dashboard (sesión existente)

```
Usuario navega a stagelink.io/dashboard
           │
           ▼
Next.js middleware (src/proxy.ts)
  → Verifica sesión WorkOS (cookie / JWT)
  → Sin sesión → redirect /login
  → Con sesión → extrae workos_user_id
           │
           ▼
Server Component: app/dashboard/page.tsx
  → getUser(workos_user_id) → user interno
  → getArtistsByUser(user.id) → lista de artists
  → Si 0 artists → redirect /onboarding
  → Si ≥ 1 artists → selecciona el primero (MVP)
           │
           ▼
Carga en paralelo (Promise.all):
  → getPage(artist.id)             → page + blocks
  → getSubscription(artist.id)     → plan activo
  → getAnalyticsSummary(artist.id) → views + clicks 30d
           │
           ▼
Render dashboard con contexto del artista
  → Sidebar: avatar, username, plan badge
  → Editor de bloques
  → Analytics básico
  → Billing / upgrade CTA
```

---

## 3. Flujo: Resolución multi-tenant

```
REQUEST: GET stagelink.io/rockstar
             │
             ▼
    Cloudflare (DNS/Proxy)
    - CDN cache check
    - DDoS protection
    - (Futuro: custom domain resolution aquí)
             │
             ▼
    Vercel Edge Network
             │
             ▼
    Next.js Middleware (src/proxy.ts)
    - Detecta ruta pública: no requiere auth
    - Extrae username del path: "rockstar"
    - Pasa a la ruta: app/[username]/page.tsx
             │
             ▼
    Next.js Page (Server Component)
    - Llama a API: getArtistByUsername("rockstar")
      SELECT a.*, p.*
      FROM artists a
      JOIN pages p ON p.artist_id = a.id
      WHERE a.username = 'rockstar'
        AND a.is_active = true
        AND p.slug = 'main'
        AND p.is_published = true
    - ENCONTRADO → render público
    - NO ENCONTRADO → notFound() → 404 page
             │
             ▼
    Render SSR con:
    - Metadata SEO (title, og:image, og:description)
    - Profile (avatar, nombre, bio)
    - Blocks ordenados por position
    - Theme del artista
    - Footer "Powered by StageLink" (si plan Free)

```

---

## 4. Flujo: Resolución con custom domain (Fase 2)

```
REQUEST: GET rocketband.com/
             │
             ▼
    Cloudflare Worker (edge)
    - Lee header: Host = "rocketband.com"
    - Lookup: SELECT artist_id FROM custom_domains
               WHERE domain = 'rocketband.com'
               AND verified_at IS NOT NULL
    - Si no existe → error 404 o redirect a stagelink.io
    - Si existe → rewrite interno a stagelink.io/{username}
               (transparente para el usuario)
             │
             ▼
    [mismo flujo de resolución por username]
```

---

## 5. Flujo: Upgrade Free → Pro

```
Artista en dashboard
  → Click "Upgrade a Pro"
           │
           ▼
  POST /api/billing/checkout
  → Crea/recupera Stripe Customer con artist email
  → Crea Stripe Checkout Session (modo subscription)
  → Redirect a Stripe Checkout hosted page
           │
           ▼
  Artista completa pago en Stripe
  → Stripe callback → /billing/success?session_id=...
           │
           ▼
  Stripe Webhook → POST /api/webhooks/stripe
  → Evento: customer.subscription.created
  → Upsert subscriptions:
    { artist_id, plan: 'pro', status: 'active',
      stripe_customer_id, stripe_subscription_id,
      current_period_end }
  → Feature gating actualizado inmediatamente
           │
           ▼
  Dashboard muestra plan Pro activo
  → Branding "Powered by StageLink" removido de página pública
  → Límite de bloques eliminado
```

---

## 6. Flujo: Tracking de analytics

```
Fan visita página pública:
           │
           ▼
  Server-side (en getArtistByUsername):
  → Registra page_view server-side (evita ad-blockers)
  → Ignora si request tiene cookie de sesión del artista

  Browser (client-side):
  → Analytics script cargado async (no bloquea render)
  → Envía events a PostHog (si habilitado)

  POST /api/analytics/events:
  → Extrae: IP → hash(IP + UA) = visitor_id
  → Verifica dedup: mismo visitor_id + page_id en 1h → skip
  → INSERT analytics_events
  → Responde 202 Accepted (no bloquea al fan)
```

---

## 7. Flujo: Ingesta de suscriptor (bloque fan_capture)

```
Fan completa el formulario en la página pública:
           │
           ▼
  POST /api/public/subscribers
  { artist_id, block_id, email, consent: true }
           │
           ▼
  Rate limit: max 5 submissions por IP por 10 min
  → Si excede → 429 Too Many Requests
           │
           ▼
  Validaciones:
  → Email válido (regex + disposable email check)
  → consent = true (requerido)
  → block_id pertenece al artist_id
           │
           ▼
  INSERT subscribers (artist_id, block_id, email,
    consented_at: now(), consent_text, source_url)
  ON CONFLICT (artist_id, email) DO NOTHING
           │
           ▼
  Responde 201 Created o 200 OK (ya existía, sin error al usuario)
  → UI muestra: "¡Gracias! Estás en la lista."
```

---

## Notas de Implementación

| Área | Decisión | Justificación |
|---|---|---|
| Caché pública | ISR con `revalidate: 60` | Balance entre frescura y performance |
| Analytics server-side | Endpoint propio en API (no solo PostHog) | Control de datos, dedup, plan-gating |
| Presigned URLs | Frontend sube directo a S3 | No pasa el binario por el backend |
| Webhook Stripe | Idempotente por `stripe_subscription_id` | Stripe puede enviar eventos duplicados |
| Checkout redirect | Stripe Hosted Checkout (no Elements) | Más rápido de implementar, PCI-compliant |
