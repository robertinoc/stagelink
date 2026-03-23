# StageLink — Modelo de Entidades

> Versión: 1.0 | Fecha: 2026-03-23 | Estado: Aprobado

---

## Diagrama Entidad-Relación

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    users     │ 1   N │     artists      │ 1   N │    pages     │
│──────────────│───────│──────────────────│───────│──────────────│
│ id           │       │ id               │       │ id           │
│ workos_id    │       │ user_id (FK)     │       │ artist_id FK │
│ email        │       │ username ◄────── │ ─ ─ ─ ┤ slug         │
│ created_at   │       │ display_name     │ (URL) │ is_published │
└──────────────┘       │ bio              │       │ theme JSONB  │
                       │ avatar_url       │       │ created_at   │
                       │ cover_url        │       │ updated_at   │
                       │ plan ◄──────     │       └──────┬───────┘
                       │ created_at  │    │              │
                       │ updated_at  │    │              │ 1
                       └─────────────│────┘              │
                                     │                   N
                       ┌─────────────┘       ┌──────────────┐
                       │ 1                   │    blocks    │
                       │                     │──────────────│
                       N                     │ id           │
              ┌────────────────┐             │ page_id (FK) │
              │  subscriptions │             │ artist_id FK │
              │────────────────│             │ type (ENUM)  │
              │ id             │             │ position INT │
              │ artist_id (FK) │             │ config JSONB │
              │ stripe_cust_id │             │ is_visible   │
              │ stripe_sub_id  │             │ created_at   │
              │ plan           │             │ updated_at   │
              │ status         │             └──────┬───────┘
              │ period_end     │                    │
              │ created_at     │             ┌──────┘
              │ updated_at     │             │ 1
              └────────────────┘             │
                                             N
                       ┌────────────────────────────────────┐
                       │         analytics_events           │
                       │────────────────────────────────────│
                       │ id                                 │
                       │ artist_id (FK, denormalized)       │
                       │ page_id (FK)                       │
                       │ block_id (FK, nullable)            │
                       │ event_type (ENUM)                  │
                       │ visitor_id (hashed, para dedup)    │
                       │ ip_hash                            │
                       │ country_code                       │
                       │ device_type                        │
                       │ referrer                           │
                       │ created_at                         │
                       └────────────────────────────────────┘

              ┌────────────────┐       ┌────────────────────┐
              │  subscribers   │       │  custom_domains    │
              │────────────────│       │ (plan Pro+, Fase2) │
              │ id             │       │────────────────────│
              │ artist_id (FK) │       │ id                 │
              │ block_id (FK)  │       │ artist_id (FK)     │
              │ email          │       │ domain (UNIQUE)    │
              │ consented_at   │       │ verified_at        │
              │ source_url     │       │ ssl_at             │
              │ created_at     │       │ created_at         │
              └────────────────┘       └────────────────────┘

              ┌────────────────┐
              │    stores      │
              │ (plan Pro+)    │
              │────────────────│
              │ id             │
              │ artist_id (FK) │
              │ provider ENUM  │
              │ config JSONB   │
              │ is_connected   │
              │ created_at     │
              └────────────────┘
```

---

## Definición de Tablas

### `users`

Cuenta de usuario. Creada al primer login vía WorkOS. Un user puede tener N artists (MVP: 1).

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() | |
| `workos_user_id` | TEXT | UNIQUE, NOT NULL | ID de WorkOS |
| `email` | TEXT | UNIQUE, NOT NULL | Email del usuario |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### `artists`

El tenant principal. Cada artista tiene un username único que define su URL pública.

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users, NOT NULL | Owner del artista |
| `username` | TEXT | UNIQUE, NOT NULL | URL slug: `stagelink.io/username` |
| `display_name` | TEXT | NOT NULL | Nombre artístico |
| `bio` | TEXT | MAX 280 chars | Descripción corta |
| `avatar_url` | TEXT | | S3 URL |
| `cover_url` | TEXT | | S3 URL |
| `category` | TEXT | | Género/tipo: musician, dj, visual_artist, etc. |
| `is_active` | BOOLEAN | DEFAULT true | Soft delete / bans |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

**Índices**: `idx_artists_username` (UNIQUE), `idx_artists_user_id`

**Regla de negocio**: `username` solo acepta `[a-z0-9_-]`, 3–30 caracteres. Lista de reserved words controlada en application layer.

---

### `pages`

La página pública del artista. En MVP: 1 página por artista. Diseñado para 1:N (EPK, etc.).

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | UUID | PK | |
| `artist_id` | UUID | FK → artists, NOT NULL | |
| `slug` | TEXT | UNIQUE within artist | Default: `main`. Futuro: `epk`, etc. |
| `is_published` | BOOLEAN | DEFAULT false | Controla visibilidad pública |
| `theme` | JSONB | DEFAULT `{}` | Colores, fuentes, layout |
| `seo_title` | TEXT | | Override para `<title>` |
| `seo_description` | TEXT | | Override para meta description |
| `og_image_url` | TEXT | | Imagen para Open Graph |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

**Índices**: `idx_pages_artist_id`, `idx_pages_artist_slug` (UNIQUE sobre artist_id + slug)

---

### `blocks`

Contenido ordenado de una página. Usa discriminated union por `type` con config en JSONB.

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | UUID | PK | |
| `page_id` | UUID | FK → pages, NOT NULL | |
| `artist_id` | UUID | FK → artists, NOT NULL | Denormalizado para ownership checks rápidos |
| `type` | TEXT | CHECK IN (...) | Ver tipos abajo |
| `position` | INTEGER | NOT NULL | Orden en la página (0-indexed) |
| `config` | JSONB | NOT NULL, DEFAULT `{}` | Datos específicos del tipo |
| `is_visible` | BOOLEAN | DEFAULT true | Toggle sin borrar |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

**Tipos de bloque y su `config` JSONB:**

```
type = 'link'
config: { url, title, icon_url?, description? }

type = 'music'
config: { url, provider (spotify|soundcloud), embed_id, title? }

type = 'video'
config: { url, provider (youtube|tiktok|vimeo), embed_id, title? }

type = 'fan_capture'
config: { heading, placeholder, button_label, consent_text }

type = 'merch'         ← Plan Pro, Fase 2
config: { store_id, product_ids[], layout (grid|list) }
```

**Índices**: `idx_blocks_page_id`, `idx_blocks_artist_id`, `idx_blocks_page_position` (sobre page_id + position)

---

### `analytics_events`

Eventos crudos. Append-only. Sin updates.

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | UUID | PK | |
| `artist_id` | UUID | FK → artists, NOT NULL | Denormalizado |
| `page_id` | UUID | FK → pages, NOT NULL | |
| `block_id` | UUID | FK → blocks, NULLABLE | NULL = page_view |
| `event_type` | TEXT | CHECK IN (...) | `page_view`, `block_click`, `embed_play` |
| `visitor_id` | TEXT | | Hash de IP+UA, no PII |
| `ip_hash` | TEXT | | Para deduplicación (no expuesto) |
| `country_code` | TEXT | | ISO 3166-1 alpha-2 |
| `device_type` | TEXT | | `mobile`, `desktop`, `tablet` |
| `referrer` | TEXT | | Referrer URL (sanitizado) |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Partición recomendada por mes |

**Deduplicación**: misma `(visitor_id, page_id, block_id)` dentro de 1 hora → ignorar el evento.

**Índices**: `idx_events_artist_id_created_at`, `idx_events_page_id`, `idx_events_block_id`

---

### `subscribers`

Emails capturados via bloque `fan_capture`. Sujeto a GDPR/CAN-SPAM.

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | UUID | PK | |
| `artist_id` | UUID | FK → artists, NOT NULL | |
| `block_id` | UUID | FK → blocks, NOT NULL | Qué bloque capturó el email |
| `email` | TEXT | NOT NULL | |
| `consented_at` | TIMESTAMPTZ | NOT NULL | Timestamp explícito de consentimiento |
| `consent_text` | TEXT | NOT NULL | Texto del checkbox al momento de suscripción |
| `source_url` | TEXT | | URL de la página pública donde se suscribió |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

**Índice único**: `(artist_id, email)` — un email por artista.

---

### `subscriptions`

Estado del plan Stripe por artista. Sincronizado via webhooks.

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | UUID | PK | |
| `artist_id` | UUID | FK → artists, UNIQUE | Un plan activo por artista |
| `stripe_customer_id` | TEXT | UNIQUE | |
| `stripe_subscription_id` | TEXT | UNIQUE, NULLABLE | NULL = plan Free (sin Stripe) |
| `plan` | TEXT | CHECK IN (...) | `free`, `pro`, `pro_plus` |
| `status` | TEXT | CHECK IN (...) | `active`, `past_due`, `cancelled`, `trialing` |
| `current_period_start` | TIMESTAMPTZ | | |
| `current_period_end` | TIMESTAMPTZ | | |
| `cancel_at_period_end` | BOOLEAN | DEFAULT false | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### `stores` *(Plan Pro, Fase 2)*

Configuración de tienda por artista. Las credenciales en `config` van cifradas.

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | UUID | PK | |
| `artist_id` | UUID | FK → artists, UNIQUE | Un store por artista (MVP) |
| `provider` | TEXT | CHECK IN ('shopify') | Extensible a futuro |
| `config` | JSONB | NOT NULL | Credenciales cifradas (AES-256) |
| `is_connected` | BOOLEAN | DEFAULT false | |
| `last_sync_at` | TIMESTAMPTZ | | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### `custom_domains` *(Plan Pro+, Fase 2)*

Mapeo dominio → artista. Implementación de resolución diferida (ver ADR-003).

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | UUID | PK | |
| `artist_id` | UUID | FK → artists, NOT NULL | |
| `domain` | TEXT | UNIQUE, NOT NULL | ej: `rocketband.com` |
| `verified_at` | TIMESTAMPTZ | NULLABLE | NULL = pendiente verificación DNS |
| `ssl_provisioned_at` | TIMESTAMPTZ | NULLABLE | NULL = cert no emitido |
| `cloudflare_zone_id` | TEXT | | Para gestión via API |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

---

## Cardinalidades Resumen

| Relación | Cardinalidad | Notas |
|---|---|---|
| user → artists | 1:N | MVP UI expone solo 1, pero el modelo soporta N |
| artist → pages | 1:N | MVP: 1 (`main`). Fase 2: `epk`, `tour`, etc. |
| page → blocks | 1:N | Ordenados por `position` |
| artist → subscriptions | 1:1 | Un plan activo por artista |
| artist → subscribers | 1:N | Por artista, dedup por email |
| artist → stores | 1:1 | MVP Pro |
| artist → custom_domains | 1:N | Soporta múltiples dominios (www + apex) |
| block → analytics_events | 1:N | NULL block_id = eventos de página |

---

## Decisiones de Diseño

- **`artist_id` denormalizado en `blocks` y `analytics_events`**: evita JOINs en el hot path de lectura pública. La fuente de verdad sigue siendo la FK en `pages`.
- **`config` JSONB en blocks**: flexibilidad para agregar tipos de bloque sin migraciones. Los tipos conocidos se validan en application layer con Zod.
- **`subscriptions` separado de `artists`**: permite que el plan exista incluso si el artista está en grace period o cancelado.
- **`subscribers.consent_text`**: guardar el texto exacto del checkbox al momento de suscripción es requerimiento legal (GDPR Art. 7).
- **`analytics_events` append-only**: nunca se actualizan, solo se insertan y agregan. Partición por mes recomendada cuando el volumen crezca.
