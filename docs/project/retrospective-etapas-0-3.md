# StageLink — Retrospectiva Ejecutiva: Etapas 0–3

**Fecha:** Marzo 2026
**Estado:** Etapas 0–3 completadas. Listo para Etapa 4.

---

## Qué se construyó

En 45 pull requests y 14 migraciones de base de datos, StageLink pasó de cero a una plataforma funcional con:

- **Infraestructura completa:** Vercel (web) + Railway (API) + Supabase (DB) + AWS S3 (assets) + Cloudflare (CDN/DNS)
- **Autenticación:** WorkOS AuthKit v3 con soporte i18n (inglés / español)
- **Arquitectura multi-tenant:** artistas, membresías, roles, audit trail
- **Constructor de páginas:** motor de bloques con Links/CTA, embeds de música y video
- **Smart Links v1:** redirección según plataforma del visitante (iOS / Android / Desktop) con rate limiting, validación de ownership y revisión de seguridad
- **Página pública de artista:** SSR con SEO, Open Graph, robots.txt y sitemap.xml
- **Base para Etapa 4:** modelos de base de datos para analytics y captura de fans ya creados

---

## Decisiones clave

| Decisión                                        | Razonamiento                                                                                                |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Monorepo pnpm con `@stagelink/types`            | Evita desincronización de tipos entre frontend y backend. Fue la decisión más correcta del proyecto.        |
| NestJS en Railway separado de Next.js           | Separación de concerns. El API escala independientemente del frontend.                                      |
| Supabase como base de datos                     | Reemplazó Docker local. Simplifica infra, agrega UI de administración y soporte para Realtime en el futuro. |
| Bloques con `config: JSON` validado server-side | Permite agregar nuevos tipos de bloque sin migraciones de DB.                                               |
| Review obligatorio antes de merge               | Atrapó bugs reales antes de producción (ver sección de bloqueos).                                           |

---

## Bloqueos y cómo se resolvieron

### 1. Migración a Supabase

Las migraciones acumulaban deuda: una asumía un estado de DB limpio que no existía en Supabase. Se parcharon para ser idempotentes respecto al estado real de la base de datos.

### 2. Módulo de tipos compartido (ESM vs CJS)

Node v25 dejó de resolver módulos ESM sin extensión explícita. El paquete `@stagelink/types` compilaba en formato incompatible con NestJS. Solución: compilar a CommonJS.

### 3. Composición de middleware (AuthKit + i18n)

WorkOS AuthKit v3 no acepta callbacks en su middleware. La documentación oficial era para v2. Se resolvió usando la API low-level de AuthKit y componiendo manualmente con el middleware de next-intl.

### 4. Bug silencioso en autenticación de Smart Links

El controller de Smart Links accedía `user.sub` (undefined) en lugar de `user.id`. Todos los CRUD autenticados de smart links fallaban silenciosamente. Detectado en el proceso de review antes de llegar a producción.

### 5. Merge conflicts en integración con main

Trabajo paralelo en ramas de larga duración generó 12 archivos en conflicto. Resolución manual preservando las mejoras. Lección: mergear `main` hacia la feature branch con más frecuencia.

---

## Bugs encontrados en review (antes de producción)

El proceso de review sistemático antes de cada merge atrapó los siguientes problemas:

| Severidad     | Bug                                                                  | Impacto evitado                                       |
| ------------- | -------------------------------------------------------------------- | ----------------------------------------------------- |
| 🔴 Crítico    | `Cache-Control` ausente en redirect 302                              | Redirects cacheados imposibles de invalidar           |
| 🔴 Crítico    | `user.sub` en vez de `user.id`                                       | Todos los CRUD de smart links rompían silenciosamente |
| 🔴 Crítico    | `from` param sin validación de longitud                              | Strings arbitrarios almacenados en audit log          |
| 🟠 Importante | `extractClientIp` duplicado en 2 controllers                         | Divergencia futura de comportamiento                  |
| 🟠 Importante | Delete de SmartLink sin verificar referencias                        | Páginas publicadas con links rotos                    |
| 🟡 Calidad    | Rate limiter documentado como "sliding window" siendo "fixed window" | Confusión al extender el código                       |

---

## Estado actual por área

| Área                         | Estado                 | Notas                             |
| ---------------------------- | ---------------------- | --------------------------------- |
| Monorepo y tipos compartidos | ✅ Sólido              | —                                 |
| Autenticación                | ✅ Funcional           | Verificar env vars en producción  |
| Multi-tenancy y permisos     | ✅ Con audit trail     | —                                 |
| Motor de bloques             | ✅ Extensible          | 3 tipos de bloque implementados   |
| Smart Links v1               | ✅ Revisado y hardened | —                                 |
| Página pública SSR/SEO       | ✅ Completo            | Con sitemap y robots.txt          |
| Infraestructura              | ✅ Deployada           | Sin health check automatizado aún |
| Analytics (modelo de datos)  | ⚠️ Solo schema         | Sin endpoints de escritura        |
| Captura de fans              | ⚠️ Solo schema         | Sin endpoint funcional            |
| Assets / S3                  | ✅ Módulo existe       | Sin test de upload en producción  |

---

## Checklist antes de avanzar a Etapa 4

- [ ] Confirmar que las 14 migraciones están aplicadas en Supabase (`_prisma_migrations`)
- [ ] Verificar que `audit_logs.actor_id` es nullable en producción
- [ ] Smoke test del flujo de auth completo en producción (signin → callback → dashboard)
- [ ] Confirmar que `GET /{username}` renderiza con SSR en producción (ver source HTML)
- [ ] Confirmar que `GET /go/{id}` devuelve 302 con `Cache-Control: no-store`
- [ ] Verificar que las tablas `analytics_events` y `subscribers` existen en Supabase
- [ ] Auditar variables de entorno en Vercel y Railway (especialmente `NEXT_PUBLIC_API_URL`)
- [ ] Agregar validación de usernames reservados (`en`, `es`) en el onboarding wizard

---

## Próximo paso: Etapa 4 — Analytics y Fan Capture

El modelo de datos está listo. Lo que falta construir:

1. **Tracking de eventos:** endpoint para registrar `page_view` y `link_click` desde la página pública
2. **Dashboard de métricas:** vistas y clicks por artista, por bloque, por período
3. **Formulario de captura funcional:** guardar subscribers en DB desde el bloque de email capture
4. **Export de fans:** permitir al artista descargar su lista de subscribers

---

_Documento generado al cierre de Etapas 0–3. Última actualización: Marzo 2026._
