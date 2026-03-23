# StageLink — plan de proyecto, etapas, tiempos y ejecución con Claude Code

## Base del plan
- Tomé como base el documento técnico/producto que define: Next.js + Tailwind + shadcn para frontend; NestJS sobre Node.js para backend; WorkOS para auth; PostgreSQL; AWS S3; Vercel; Railway/Fly.io; Cloudflare; PostHog; next i18n; Stripe; Shopify Storefront API; y arquitectura SaaS multi-tenant.
- El roadmap del documento separa claramente: MVP (perfil, links, embeds, analytics), luego tienda/EPK/analytics pro y luego AI/community/discovery.
- La estimación asume trabajo individual, 2 horas por día, y uso intensivo de Claude Code para acelerar scaffolding, CRUD, wiring y refactors. No asume que Claude elimina testing, debugging de integraciones ni QA manual.

## Resumen ejecutivo
- **Horas totales del plan completo:** 242 h
- **Días de trabajo a 2 h/día:** 121.0 días
- **Semanas calendario aproximadas (5 días/semana):** 24.2 semanas

- **MVP funcional + pagos:** 173 h (86.5 días / 17.3 semanas)
- **MVP listo para lanzar en producción:** 194 h (97.0 días / 19.4 semanas)
- **Features Pro posteriores (Shopify + EPK + analytics pro + multi-language):** 41 h
- **AI phase 3 posterior:** 7 h

## Recomendación de release
1. **Release 1 (lanzable):** Stages 0 a 5 + T7-2/T7-3/T7-4.
2. **Release 2 (upgrade Pro fuerte):** Stage 6.
3. **Release 3 (AI):** T7-1.

## Resumen por etapa

| Etapa | Horas | Días @2h | Semanas aprox. |
|---|---:|---:|---:|
| 0. Estrategia y definición | 12 | 6.0 | 1.2 |
| 1. Fundaciones técnicas | 22 | 11.0 | 2.2 |
| 2. Plataforma core | 34 | 17.0 | 3.4 |
| 3. Constructor MVP | 54 | 27.0 | 5.4 |
| 4. Analytics y fan capture | 27 | 13.5 | 2.7 |
| 5. Monetización | 24 | 12.0 | 2.4 |
| 6. Features Pro | 41 | 20.5 | 4.1 |
| 7. AI + hardening + launch | 28 | 14.0 | 2.8 |

## Detalle por tarea

### 0. Estrategia y definición

#### T0-1 — Congelar alcance MVP y criterio de éxito
- **Epic:** Scope
- **Estimación:** 3 h (1.5 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** Ninguna
- **Objetivo:** Definir qué entra y qué no entra en el MVP: perfil artista, links, embeds y analytics básico; dejar tienda, EPK, analytics pro, AI y discovery para fases posteriores.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude un PRD corto del MVP usando el PDF como fuente. 2) Hacé que lo convierta en 'in-scope / out-of-scope / riesgos / métricas'. 3) Validá que respete el roadmap del documento. 4) Guardá el PRD en /docs/product/mvp.md. 5) Pedile a Claude que derive criterios de aceptación por feature.

#### T0-2 — Mapear entidades y flujos multi-tenant
- **Epic:** Arquitectura
- **Estimación:** 4 h (2.0 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T0-1
- **Objetivo:** Definir relaciones entre users, artists, pages, blocks, links, analytics, stores y subscriptions; decidir resolución por username y preparar soporte futuro para dominio custom.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude un diagrama entidad-relación y flujo de request público. 2) Revisá tenant resolution: username -> artist -> page. 3) Definí ownership user->artist. 4) Guardá ADRs en /docs/adr. 5) Ajustá antes de tocar código.

#### T0-3 — Wireframes y catálogo de bloques
- **Epic:** UX
- **Estimación:** 3 h (1.5 días a 2 h/día)
- **Prioridad:** Media
- **Dependencias:** T0-1
- **Objetivo:** Diseñar el onboarding, dashboard editor, página pública y catálogo inicial de bloques: links, música, video, fan capture.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude wireframes low-fi en Markdown/ASCII o pseudo-layouts. 2) Convertí cada pantalla en checklist de componentes shadcn. 3) Definí props mínimas de cada bloque. 4) Cerrá el orden de creación de bloques.

#### T0-4 — Armar tablero Asana y backlog inicial
- **Epic:** Gestión
- **Estimación:** 2 h (1.0 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T0-1,T0-2,T0-3
- **Objetivo:** Crear el proyecto, secciones por etapa, prioridades, dependencias y custom fields de horas/días.
- **Cómo hacerlo con Claude Code:** 1) Importá el CSV generado. 2) Pedile a Claude que te sugiera milestones y dependencias desde el backlog. 3) Marcá bloqueos manuales. 4) Definí una rutina diaria de 2h: build / test / notes.

### 1. Fundaciones técnicas

#### T1-1 — Crear monorepo y estándares del repo
- **Epic:** Repositorio
- **Estimación:** 4 h (2.0 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T0-2
- **Objetivo:** Definir workspace para frontend y backend, convenciones de nombres, lint, format, commits y estructura de carpetas.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude que inicialice un monorepo pnpm con apps/web y apps/api más packages compartidos. 2) Sumá ESLint, Prettier, Husky y commitlint. 3) Pedile README raíz con scripts. 4) Ejecutá todo y corregí paths rotos.

#### T1-2 — Scaffold frontend Next.js + Tailwind + shadcn + i18n shell
- **Epic:** Frontend
- **Estimación:** 5 h (2.5 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T1-1
- **Objetivo:** Crear la app web con App Router, diseño base, theme tokens de marca e infraestructura mínima de internacionalización.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude una app Next.js TypeScript con Tailwind y shadcn. 2) Definí layout base, navegación marketing/app y theme con colores del PDF. 3) Sumá next-i18n/next-intl según convenga. 4) Revisá hydration, fonts y responsive. 5) Dejás '/[locale]' listo aunque actives 2 idiomas al inicio.

#### T1-3 — Scaffold backend NestJS y módulos base
- **Epic:** Backend
- **Estimación:** 5 h (2.5 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T1-1
- **Objetivo:** Crear API NestJS con módulos de auth, artists, pages, blocks, analytics, billing y common.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude una estructura NestJS modular. 2) Sumá config, validation pipe, exception filters y logger. 3) Definí DTOs y carpetas por bounded context. 4) Probá healthcheck y rutas stub. 5) Documentá variables de entorno.

#### T1-4 — Configurar entorno local, PostgreSQL y secretos
- **Epic:** Infra local
- **Estimación:** 3 h (1.5 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T1-1,T1-2,T1-3
- **Objetivo:** Levantar Postgres local, plantillas .env, acceso a S3 dev y claves sandbox de WorkOS/Stripe/PostHog/Shopify.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude docker-compose para Postgres y quizá Mailhog. 2) Generá .env.example para web y api. 3) Separá secrets dev/staging/prod. 4) Validá arranque de punta a punta.

#### T1-5 — Deploy preview: Vercel + Railway/Fly + Cloudflare
- **Epic:** Deploy
- **Estimación:** 5 h (2.5 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T1-2,T1-3,T1-4
- **Objetivo:** Dejar frontend en Vercel, backend en Railway o Fly.io, DNS/proxy/CDN en Cloudflare y variables de entorno por ambiente.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude scripts/build configs para Vercel y Railway/Fly. 2) Publicá healthcheck y app preview. 3) Configurá Cloudflare con subdominios api/staging. 4) Probá CORS, cookies y cache headers. 5) Documentá el runbook de deploy.

### 2. Plataforma core

#### T2-1 — Diseñar schema PostgreSQL y migraciones
- **Epic:** Database
- **Estimación:** 8 h (4.0 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T0-2,T1-3,T1-4
- **Objetivo:** Crear tablas users, artists, pages, blocks, links, analytics, stores, subscriptions y tablas auxiliares; definir índices, unique constraints y soft delete donde aplique.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude el schema basado en el PDF y tus ADRs. 2) Revisá cardinalidades y nombres. 3) Generá migraciones y seed mínimo. 4) Probá casos borde: username único, orden de bloques, plan activo. 5) Documentá el modelo.

#### T2-2 — Implementar resolución multi-tenant por username y dominio
- **Epic:** Tenanting
- **Estimación:** 8 h (4.0 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T2-1,T1-2,T1-3
- **Objetivo:** Resolver requests públicas a través de slug/username y dejar preparado mapping para custom domains de planes pagos.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude middleware/guards/resolvers para tenant context. 2) Implementá lookup por username en web y api. 3) Diseñá tabla/domain mapping para futuro custom domain. 4) Probá colisiones, 404 y caché incorrecta.

#### T2-3 — Integrar WorkOS Auth y sesiones
- **Epic:** Auth
- **Estimación:** 8 h (4.0 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T2-1,T1-2,T1-3
- **Objetivo:** Agregar login, signup, sesiones, protección de dashboard y mapping entre identidad WorkOS y usuario interno.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude integración WorkOS/AuthKit en web y api. 2) Definí callback URLs por ambiente. 3) Guardá user interno con provider_id. 4) Agregá guards para dashboard y ownership checks. 5) Probá login/logout/expired session.

#### T2-4 — Implementar pipeline S3 para assets
- **Epic:** Storage
- **Estimación:** 5 h (2.5 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T2-1,T1-3,T1-4
- **Objetivo:** Subida de avatar, cover e imágenes del EPK a S3 con presigned URLs, validación y pathing por tenant.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude un módulo de uploads con presigned URLs. 2) Definí límites, mime types y carpetas s3://tenant/... 3) Subí desde frontend con progress. 4) Probá reemplazo, borrado lógico y ACL/CDN URL.

#### T2-5 — Ownership, permisos y auditoría básica
- **Epic:** Seguridad base
- **Estimación:** 5 h (2.5 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T2-2,T2-3
- **Objetivo:** Asegurar que un usuario sólo pueda editar sus artistas/páginas; registrar acciones críticas en logs/audit trail simple.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude policies por artist_id y page_id. 2) Aplicá checks en controladores y servicios. 3) Registrá create/update/publish/delete. 4) Escribí tests de acceso no autorizado.

### 3. Constructor MVP

#### T3-1 — Crear onboarding del artista
- **Epic:** Onboarding
- **Estimación:** 6 h (3.0 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T2-2,T2-3
- **Objetivo:** Al primer login, crear artist, reservar username, seleccionar tipo de creador y generar página vacía con bloques iniciales.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude un wizard corto de 3-4 pasos. 2) Validá username único en tiempo real. 3) Creá artist/page inicial desde backend. 4) Redirigí al dashboard con checklist de setup.

#### T3-2 — Construir shell del dashboard
- **Epic:** Dashboard
- **Estimación:** 5 h (2.5 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T3-1
- **Objetivo:** Crear layout autenticado con sidebar, tabs de profile/page/analytics/billing y feedback visual consistente.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude una app shell con shadcn y server actions o fetchers. 2) Definí estados vacíos y loading. 3) Agregá breadcrumbs y navegación estable. 4) Revisá responsive tablet/móvil.

#### T3-3 — Editor de perfil del artista
- **Epic:** Perfil
- **Estimación:** 6 h (3.0 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T3-2,T2-4
- **Objetivo:** Formularios para nombre, bio, avatar, cover, redes, categoría y metadata básica de SEO/open graph.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude forms con zod/react-hook-form. 2) Conectá uploads S3 para avatar/cover. 3) Guardá cambios con validación server-side. 4) Probá preview en tiempo real.

#### T3-4 — Motor de bloques: schema, CRUD, orden y publish
- **Epic:** Bloques
- **Estimación:** 8 h (4.0 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T2-1,T3-2
- **Objetivo:** Crear modelo de bloques flexible para links, music, video y fan capture; permitir crear/editar/eliminar/reordenar/publicar.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude un bloque base con discriminated union por tipo. 2) Implementá endpoints CRUD + reorder. 3) En frontend armá lista editable. 4) Para MVP usá reorder simple drag-and-drop o move up/down. 5) Probá persistencia del orden.

#### T3-5 — Implementar bloque Links / CTA
- **Epic:** Links
- **Estimación:** 6 h (3.0 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T3-4
- **Objetivo:** Permitir múltiples links con label, URL, icon, prioridad y tracking.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude formulario dinámico de links. 2) Normalizá URLs y sanitizá labels. 3) Renderizá CTA consistente en página pública. 4) Dispará evento de click al abrir.

#### T3-6 — Implementar bloques Music y Video embeds
- **Epic:** Embeds
- **Estimación:** 8 h (4.0 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T3-4
- **Objetivo:** Agregar embeds de Spotify, SoundCloud, Apple Music, YouTube, Vimeo y TikTok con previews seguras.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude parsers por proveedor. 2) Validá URLs soportadas y guardá provider + embed config. 3) Renderizá iframes responsivos. 4) Probá CSP, lazy loading y fallbacks.

#### T3-7 — Construir página pública SSR/SEO del artista
- **Epic:** Pública
- **Estimación:** 10 h (5.0 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T3-3,T3-4,T3-5,T3-6,T2-2
- **Objetivo:** Renderizar la página del artista en Next.js con SSR/ISR, metadata social, performance y tema visual alineado a la marca.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude una ruta pública por username. 2) Traé profile + bloques desde API con caching controlado. 3) Agregá OG tags, sitemap hints y structured metadata básica. 4) Optimiza imágenes y lazy loading. 5) Hacé pruebas Lighthouse.

#### T3-8 — Implementar Smart Link v1
- **Epic:** Smart Link
- **Estimación:** 5 h (2.5 días a 2 h/día)
- **Prioridad:** Media
- **Dependencias:** T3-5,T3-7
- **Objetivo:** Resolver el destino preferido según plataforma/dispositivo cuando existan links equivalentes (Spotify vs Apple Music, etc.).
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude una estrategia simple basada en user-agent/referrer/storage. 2) Definí fallback explícito. 3) Registrá el destino resuelto para analytics. 4) Testeá en iOS/Android/desktop.

### 4. Analytics y fan capture

#### T4-1 — Pipeline de eventos + PostHog
- **Epic:** Tracking
- **Estimación:** 7 h (3.5 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T3-5,T3-6,T3-7
- **Objetivo:** Capturar page view, click de CTA, smart-link resolution y submit de fan capture; combinar eventos propios y PostHog.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude un plan de tracking. 2) Definí event names y payloads estables. 3) Implementá eventos server/client. 4) Enviá a PostHog y/o guardá raw events en tu DB cuando haga falta. 5) Verificá duplicados.

#### T4-2 — Dashboard de analytics básico
- **Epic:** Analytics
- **Estimación:** 7 h (3.5 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T4-1
- **Objetivo:** Mostrar clicks, views, CTR simple, top links y países/plataformas básicas para el artista.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude queries agregadas y endpoints. 2) Construí cards + tablas simples, no sobrediseñes. 3) Filtrá bots básicos. 4) Verificá que los números cierren contra PostHog.

#### T4-3 — Bloque Fan Email Capture
- **Epic:** Fan list
- **Estimación:** 7 h (3.5 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T3-4,T3-7
- **Objetivo:** Bloque público para captar emails con consentimiento; guardar suscriptores por artista y permitir exportación CSV.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude modelo subscribers y endpoint submit. 2) Validá email, consentimiento y rate limit. 3) Renderizá bloque editable en dashboard y público en page. 4) Agregá export CSV para el artista.

#### T4-4 — Consentimiento, filtros anti-bot y QA de analytics
- **Epic:** Privacidad
- **Estimación:** 6 h (3.0 días a 2 h/día)
- **Prioridad:** Media
- **Dependencias:** T4-1,T4-2,T4-3
- **Objetivo:** Agregar consentimiento mínimo, exclusión de bots internos y pruebas de tracking antes de monetizar.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude un checklist privacy-first. 2) Implementá exclusión de QA/admin traffic. 3) Configurá banderas de consentimiento si corresponde. 4) Corré tests manuales con eventos reales.

### 5. Monetización

#### T5-1 — Stripe: productos, checkout, portal y webhooks
- **Epic:** Stripe
- **Estimación:** 9 h (4.5 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T2-1,T2-3,T4-2
- **Objetivo:** Implementar planes Free/Pro/Pro+ y preparar Enterprise manual; persistir estado de suscripción en subscriptions.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude integración Stripe Checkout + Billing Portal. 2) Definí products/prices y webhook handlers idempotentes. 3) Sincronizá customer/subscription/status en DB. 4) Probá upgrade/downgrade/cancelación y reintentos.

#### T5-2 — Feature gating por plan
- **Epic:** Gating
- **Estimación:** 7 h (3.5 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T5-1
- **Objetivo:** Restringir custom domain, Shopify, EPK, multi-language, pro analytics y fan insights según plan activo.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude una matriz de features por plan. 2) Implementá helper único en backend y frontend. 3) Mostrá locks y upsell sin romper UX. 4) Cubrí edge cases: webhook atrasado, trial, grace period.

#### T5-3 — UI de billing y upgrade flows
- **Epic:** Billing UI
- **Estimación:** 5 h (2.5 días a 2 h/día)
- **Prioridad:** Media
- **Dependencias:** T5-1,T5-2
- **Objetivo:** Pantalla para ver plan actual, límites, CTA de upgrade y acceso al portal de Stripe.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude una vista simple y clara. 2) Mostrá uso actual vs límite. 3) Conectá checkout/portal. 4) Probá mensajes de error y estado pendiente.

#### T5-4 — Reglas de branding / ads del plan Free
- **Epic:** Free plan
- **Estimación:** 3 h (1.5 días a 2 h/día)
- **Prioridad:** Media
- **Dependencias:** T5-2
- **Objetivo:** Mostrar Powered by StageLink y reservar espacio para promos/ads sólo en free, sin afectar Core UX.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude una regla centralizada de rendering según plan. 2) Agregá badge/footer free. 3) Dejá feature flag para ads reales más adelante.

### 6. Features Pro

#### T6-1 — Integración Shopify Storefront API
- **Epic:** Shopify
- **Estimación:** 9 h (4.5 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T5-2
- **Objetivo:** Conectar tienda del artista vía Storefront API y persistir credenciales/config segura por store.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude un diseño de integración usando Storefront API, no Admin. 2) Decidí si la conexión será por domain + token manual en MVP. 3) Guardá config cifrada. 4) Probá fetch de productos y errores de auth.

#### T6-2 — Bloque Smart Merch
- **Epic:** Merch
- **Estimación:** 6 h (3.0 días a 2 h/día)
- **Prioridad:** Media
- **Dependencias:** T6-1,T3-4
- **Objetivo:** Mostrar productos destacados, stock/precio básico y CTA a checkout externo o PDP del store.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude un bloque merch desacoplado del provider. 2) Renderizá grilla simple con cache. 3) Trackeá clicks a productos. 4) Manejá productos no disponibles.

#### T6-3 — EPK builder y página/share exportable
- **Epic:** EPK
- **Estimación:** 10 h (5.0 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T3-3,T2-4,T5-2
- **Objetivo:** Generar un press kit electrónico con bio, fotos, música, contacto y rider en una página dedicada.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude una estructura EPK reutilizando datos existentes. 2) Sumá secciones editables y assets de S3. 3) Publicá URL shareable y versión printable/PDF-friendly. 4) Testeá con un artista demo.

#### T6-4 — Analytics Pro y fan insights
- **Epic:** Analytics Pro
- **Estimación:** 5 h (2.5 días a 2 h/día)
- **Prioridad:** Media
- **Dependencias:** T4-2,T5-2
- **Objetivo:** Expandir dashboard con filtros por rango, top countries, platform preference y conversiones simples.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude nuevas agregaciones y filtros. 2) Reutilizá eventos existentes antes de crear más. 3) Validá performance con índices y cache. 4) Marcá claramente qué es Pro.

#### T6-5 — Multi-language pages e infraestructura de traducción
- **Epic:** i18n
- **Estimación:** 11 h (5.5 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T1-2,T3-7,T5-2
- **Objetivo:** Agregar páginas en varios idiomas con fallback, traducciones de UI y estrategia para contenido traducido del artista.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude separar i18n de interfaz vs contenido del usuario. 2) Implementá locales, routing y dictionaries. 3) Para contenido del artista, arrancá con campos manuales o traducción asistida. 4) Probá SEO hreflang y fallbacks.

### 7. AI + hardening + launch

#### T7-1 — AI Artist Bio / press kit assistant
- **Epic:** AI
- **Estimación:** 7 h (3.5 días a 2 h/día)
- **Prioridad:** Media
- **Dependencias:** T6-3,T6-5
- **Objetivo:** Feature Phase 3: generar bio profesional y variantes reutilizables para página y EPK.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude diseñar prompts, límites y flujo de edición humana. 2) Elegí proveedor LLM después; no acoples la app a un solo modelo. 3) Guardá outputs versionados. 4) Exigí revisión manual antes de publicar.

#### T7-2 — Seguridad, rate limits, validaciones y observabilidad
- **Epic:** Hardening
- **Estimación:** 6 h (3.0 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T4-4,T5-1,T6-1
- **Objetivo:** Cerrar superficie antes del lanzamiento: rate limits, sanitización, logs, alertas y manejo de errores.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude un security review sobre tu código existente. 2) Sumá rate limiting, input sanitization, CSP/CORS seguros y redacción de logs. 3) Conectá monitoreo mínimo y alertas.

#### T7-3 — QA/UAT, seed data y smoke tests
- **Epic:** QA
- **Estimación:** 7 h (3.5 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T7-2
- **Objetivo:** Preparar cuentas demo, datos de ejemplo, checklist UAT y tests críticos para deploys.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude seeds realistas con 2-3 artistas demo. 2) Escribí smoke tests para login, editar página, click tracking, checkout y fan capture. 3) Corré checklist cross-browser y mobile.

#### T7-4 — Lanzamiento productivo, documentación y backlog post-launch
- **Epic:** Launch
- **Estimación:** 8 h (4.0 días a 2 h/día)
- **Prioridad:** Alta
- **Dependencias:** T7-3
- **Objetivo:** Lanzar producción, configurar dominios, runbooks, soporte inicial y backlog de mejoras basado en uso real.
- **Cómo hacerlo con Claude Code:** 1) Pedile a Claude un launch checklist final. 2) Publicá prod en Vercel/Railway/Fly y revisá Cloudflare. 3) Documentá operación, rollback y known issues. 4) Armá backlog post-launch con métricas reales.

## Cómo usar este plan en tu rutina diaria
1. Arrancá cada sesión con 1 mini-brief para Claude: contexto, objetivo de la tarea, restricciones del stack, criterio de aceptación.
2. Pedile siempre cambios pequeños y testeables: una ruta, un módulo, un componente o una migración por vez.
3. Después de cada bloque, hacé run local, revisá logs, probá happy path + edge cases y recién después commit.
4. Cuando haya integraciones externas (WorkOS, Stripe, Shopify, PostHog, S3), pedile a Claude sandbox setup + checklist de debugging, no sólo código.
5. No delegues a Claude decisiones de producto ambiguas: scope, pricing, naming de planes, métricas y aceptación final siempre cerralas vos.

## Prompts base recomendados para Claude Code

### Prompt de implementación
```
Contexto: estoy construyendo StageLink. Stack fijo: Next.js + Tailwind + shadcn + next-i18n en frontend; NestJS en backend; WorkOS auth; PostgreSQL; S3; Vercel; Railway/Fly; Cloudflare; PostHog; Stripe; Shopify Storefront API. Arquitectura multi-tenant por artist username.

Tarea: [describir tarea puntual].

Quiero que:
1. propongas un plan mínimo de implementación,
2. generes los archivos estrictamente necesarios,
3. no sobre-ingenierices la solución,
4. incluyas validaciones, tipos y manejo de errores,
5. agregues tests o checks manuales mínimos,
6. expliques qué debo probar yo al final.
```

### Prompt de refactor
```
Refactorizá esta parte sin romper la arquitectura multi-tenant ni el contract actual de API. Mantené tipado fuerte, validaciones y compatibilidad con el resto del stack. Si hay tradeoffs, listalos antes de tocar código.
```

### Prompt de QA
```
Actuá como lead engineer. Revisá este cambio buscando bugs funcionales, problemas de seguridad, performance, edge cases, faltantes de tests y riesgos de deploy. Devolveme primero una lista priorizada y después patches concretos.
```