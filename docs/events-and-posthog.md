# StageLink — Analytics Events & PostHog Integration

**Fecha:** Marzo 2026
**Estado:** Implementado en Etapa 4 (T4-1)

---

## Principios de diseño

1. **Capa propia sobre PostHog** — Ningún componente llama a `posthog.capture()` directamente. Todo pasa por helpers tipados (`track.ts` en el frontend, `PostHogService` en el backend). Refactorizaciones y renombrados quedan en un solo lugar.

2. **Separación frontend / backend** — Los eventos que ocurren en el servidor (page views SSR, resolución de smart links, fan capture) son emitidos desde NestJS con `posthog-node`. Los eventos de interacción real del visitante (link click) son emitidos desde el browser con `posthog-js`.

3. **Privacy-first**:
   - `ip: false` — PostHog nunca recibe la IP del visitante.
   - Referrer: dominio únicamente, nunca la URL completa.
   - Destino de links: dominio únicamente.
   - Sin emails en eventos.
   - `$process_person_profiles: false` en todos los eventos — no se crean perfiles de personas para eventos públicos.

4. **Fire-and-forget** — Los eventos nunca bloquean la respuesta al usuario. Fallos son loggeados y descartados silenciosamente.

5. **Desactivación limpia** — Si `POSTHOG_KEY` (frontend) o `POSTHOG_KEY` (backend) no están configurados, el tracking se desactiva sin errores ni builds rotos.

---

## Catálogo de eventos

Definidos como fuente única de verdad en `packages/types/src/analytics.ts`.

### Eventos públicos (visitantes)

| Evento                | Dónde se emite                        | Descripción                                         |
| --------------------- | ------------------------------------- | --------------------------------------------------- |
| `public_page_view`    | Backend NestJS (`PublicPagesService`) | Un visitante cargó la página pública de un artista  |
| `public_link_click`   | Frontend browser (`PublicPageClient`) | Un visitante hizo clic en un link/CTA               |
| `smart_link_resolved` | Backend NestJS (`SmartLinksService`)  | Un Smart Link fue resuelto a una URL de destino     |
| `fan_capture_submit`  | Backend NestJS (`PublicPagesService`) | Un visitante envió su email en un bloque de captura |

### Eventos de dashboard (artistas autenticados)

| Evento                   | Dónde se emite                       | Descripción                                            |
| ------------------------ | ------------------------------------ | ------------------------------------------------------ |
| `onboarding_completed`   | Backend NestJS (`OnboardingService`) | Un artista completó el wizard de onboarding            |
| `artist_profile_updated` | Backend NestJS (`ArtistsService`)    | Un artista actualizó su perfil                         |
| `block_created`          | Backend NestJS (`BlocksService`)     | Se creó un bloque                                      |
| `block_updated`          | Backend NestJS (`BlocksService`)     | Se actualizó la config o título de un bloque           |
| `block_deleted`          | Backend NestJS (`BlocksService`)     | Se eliminó un bloque                                   |
| `block_published`        | Backend NestJS (`BlocksService`)     | Un bloque fue publicado (visible en la página pública) |
| `block_unpublished`      | Backend NestJS (`BlocksService`)     | Un bloque fue despublicado                             |

---

## Arquitectura de archivos

### Frontend (`apps/web`)

```
src/lib/analytics/
├── posthog.ts          # Singleton de posthog-js. initPostHog() + getPostHog()
├── track.ts            # Helpers tipados: trackPublicLinkClick()
└── PostHogProvider.tsx # 'use client' — llama initPostHog() en useEffect
```

**PostHogProvider** está montado en:

- `src/app/[locale]/layout.tsx` — dashboard y app autenticada
- `src/app/(public)/p/[username]/layout.tsx` — páginas públicas de artistas

### Backend (`apps/api`)

```
src/modules/analytics/
├── posthog.service.ts  # NestJS Injectable — wraps posthog-node, fire-and-forget
└── analytics.module.ts # @Global() — PostHogService injectable en toda la app
```

---

## Variables de entorno

### Web (`apps/web/.env.local`)

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxx   # PostHog Project API Key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com  # o https://eu.posthog.com
```

Si `NEXT_PUBLIC_POSTHOG_KEY` no está definida, PostHog queda desactivado silenciosamente.

### API (`apps/api/.env`)

```env
POSTHOG_KEY=phc_xxxxxxxxxxxx             # Mismo proyecto, misma key
POSTHOG_HOST=https://app.posthog.com     # o https://eu.posthog.com
```

---

## distinctId y cómo funciona en PostHog

- **Eventos públicos** (`public_page_view`, `smart_link_resolved`, `fan_capture_submit`): `distinctId = artistId` (UUID interno). Agrupa todos los eventos de un artista en PostHog dashboards.
- **Eventos de dashboard** (`block_*`, `artist_profile_updated`, `onboarding_completed`): `distinctId = userId` (WorkOS user ID).
- **`public_link_click`** (frontend): `distinctId` no está disponible server-side — se usa `username` (estable, inmutable). Los dashboards pueden unir eventos por el campo `username` presente en ambas fuentes.

---

## Agregar un nuevo evento

1. **Agregar la constante** en `packages/types/src/analytics.ts`:

   ```typescript
   export const ANALYTICS_EVENTS = {
     ...
     MY_NEW_EVENT: 'my_new_event',
   } as const;
   ```

2. **Definir el tipo de propiedades** en el mismo archivo:

   ```typescript
   export interface MyNewEventProps extends BaseDashboardProps {
     my_field: string;
   }
   ```

3. **Agregar al union type** en `apps/api/src/modules/analytics/posthog.service.ts`:

   ```typescript
   type EventProps = ... | MyNewEventProps;
   ```

4. **Emitir el evento** desde el servicio NestJS apropiado:

   ```typescript
   this.posthog.capture(ANALYTICS_EVENTS.MY_NEW_EVENT, distinctId, {
     actor_user_id: userId,
     artist_id: artistId,
     environment: process.env.NODE_ENV ?? 'development',
     my_field: value,
   });
   ```

5. **O desde el frontend** (si es un evento de interacción browser):
   ```typescript
   // En track.ts:
   export function trackMyNewEvent(props: MyNewEventProps): void {
     const ph = getPostHog();
     if (!ph) return;
     ph.capture(ANALYTICS_EVENTS.MY_NEW_EVENT, props);
   }
   ```

---

## Decisiones de diseño

### ¿Por qué `public_page_view` es server-side?

El artista SSR en Next.js (`ArtistPageView`) es un Server Component. Si el evento se emitiera client-side, habría un "double fire" (SSR render + hydration). Emitirlo desde `PublicPagesService.getPageByUsername()` garantiza exactamente un evento por visita real. Los bots y crawlers que no ejecutan JS también quedan excluidos porque el backend detecta el contexto por headers.

### ¿Por qué `public_link_click` es client-side?

Es un evento de interacción real del usuario (onClick). No puede emitirse desde el servidor porque el servidor no sabe cuándo el visitante hace clic.

### ¿Por qué `smart_link_resolved` es server-side?

El handler de `/go/[id]` en Next.js llama al endpoint de resolución del backend. El backend tiene contexto completo (artistId, plataforma, fallback) sin necesidad de queries adicionales. Emitirlo desde el frontend requeriría esperar la respuesta del redirect — añadiría latencia.

### ¿Por qué `$process_person_profiles: false`?

StageLink no necesita perfiles de personas en PostHog para los eventos actuales. Los dashboards de artistas agrupan por `artist_id`. Crear perfiles de personas para visitantes anónimos consumiría créditos innecesariamente y podría ser un problema de privacidad en algunas jurisdicciones.

---

_Documento generado al cierre de T4-1. Última actualización: Marzo 2026._
