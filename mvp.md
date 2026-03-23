# StageLink — PRD del MVP

> "Your digital stage." — Una landing page profesional para artistas, creada en minutos.

---

## Objetivo del MVP

Validar que artistas (músicos, DJs, creadores visuales) adoptan y comparten activamente su página de StageLink como su link principal de presencia digital.

El MVP debe demostrar que un artista puede crear su página en menos de 5 minutos, compartirla, y que esa página convierte visitas en clicks hacia sus plataformas.

**No es un objetivo del MVP**: monetizar, escalar infraestructura, ni cubrir todos los tipos de creadores.

---

## Features In-Scope

### 1. Registro y onboarding
- Crear cuenta con email + contraseña (o Google OAuth).
- Al registrarse, elegir username → genera `stagelink.io/username`.
- Onboarding de 3 pasos: subir foto, escribir bio, agregar primer link.

### 2. Perfil público del artista
- Página pública en `stagelink.io/username`.
- Foto de perfil, nombre de artista, bio corta (hasta 280 caracteres).
- Lista de links con título e icono (máx. 10 en plan Free).

### 3. Editor de bloques (simplificado)
- Agregar / reordenar / eliminar links desde un editor visual.
- Drag & drop para reordenar.
- Tipos de bloque en MVP:
  - **Link** (URL genérica con título)
  - **Embed de música** (Spotify, SoundCloud — solo URL paste → autodetecta y embebe)
  - **Embed de video** (YouTube, TikTok — solo URL paste → autodetecta y embebe)

### 4. Analytics básico
- Contador de visitas a la página (page views).
- Contador de clicks por link.
- Vista en el dashboard: últimos 30 días.

### 5. Planes y billing (Free vs Pro)
- **Free**: hasta 10 links, analytics básico, branding "Powered by StageLink".
- **Pro ($5/mes)**: links ilimitados, sin branding, analytics completo (países, dispositivos).
- Pago via Stripe (tarjeta de crédito).
- Upgrade / downgrade desde el dashboard.

### 6. Branding "Powered by StageLink"
- Footer visible en todas las páginas públicas del plan Free.
- Link al home de StageLink para tracción viral orgánica.

---

## Features Out-of-Scope (MVP)

| Feature | Motivo |
|---|---|
| EPK (Electronic Press Kit) | Complejidad alta, validar primero el core |
| AI Bio Generator | Depende de que el core funcione; agregar en Fase 2 |
| Store / Shopify integration | Complejidad técnica y legal; Fase 2 |
| Fan email capture | Requiere lista de correo + compliance (GDPR); Fase 2 |
| Smart Link (detect Spotify/Apple) | Nice-to-have; no bloquea adopción inicial |
| Multi-language pages | Solo en planes altos; Fase 3 |
| Dominio personalizado | Complejidad de DNS; Pro+ en Fase 2 |
| Events calendar | Nicho; Fase 2 |
| Releases / discografía | Cubierto parcialmente con embeds de Spotify |
| Portfolio visual (artistas plásticos) | Segundo tipo de usuario; post-MVP |
| Enterprise / team accounts | Post PMF |
| Mobile app | Web-first; la página pública ya es mobile-friendly |
| Discovery / comunidad | Funcionalidad de red social; Fase 3 |

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Linktree ya cubre la necesidad y los artistas no cambian | Alta | Alto | Diferenciarse en UX enfocada en artistas y embeds nativos de música; apuntar a artistas emergentes que no tienen marca fuerte aún |
| Bajo rate de activación (crean cuenta pero no comparten el link) | Media | Alto | Onboarding corto + notificación de "tu página está lista, compártela" con URL copiada al clipboard |
| Los embeds de plataformas (Spotify, YouTube) rompen o cambian su API | Media | Medio | Usar oEmbed estándar; tener fallback a link simple |
| Stripe onboarding rechaza el pago de algún país | Baja | Medio | Aceptar solo mercados donde Stripe opera bien en lanzamiento |
| Spam / páginas abusivas en `stagelink.io/username` | Media | Medio | Username review manual en primeros 1000 usuarios; CAPTCHA en registro |
| Costos de infra escalan antes de monetizar | Baja | Medio | Arquitectura serverless (Vercel + PlanetScale/Neon), escala con usuarios reales |

---

## Métricas de Éxito del MVP

**Objetivo a 90 días del launch:**

| Métrica | Target |
|---|---|
| Usuarios registrados | 500 |
| Páginas activas (al menos 1 link + foto) | 300 (60% de registrados) |
| Páginas compartidas (al menos 10 page views externos) | 150 |
| Conversión Free → Pro | 5% (≈ 15 usuarios) |
| Tiempo promedio de setup (registro → página publicada) | < 5 minutos |
| NPS de artistas activos | ≥ 40 |

---

## Criterios de Aceptación por Feature

---

### Feature 1 — Registro y Onboarding

**AC-1.1** — El usuario puede registrarse con email + contraseña desde la home de StageLink.

**AC-1.2** — El usuario puede registrarse con Google OAuth (un click).

**AC-1.3** — Durante el registro se pide un username. El sistema valida que:
- Solo contiene letras, números y guiones.
- Tiene entre 3 y 30 caracteres.
- No está en uso por otro artista.
- No es una palabra reservada (`admin`, `api`, `settings`, `login`, `signup`, etc.).

**AC-1.4** — Al completar registro, el usuario ve una pantalla de onboarding de 3 pasos:
1. Subir foto de perfil (JPG/PNG, max 5 MB).
2. Escribir nombre artístico y bio (máx 280 caracteres).
3. Agregar su primer link externo (URL + título).

**AC-1.5** — Al finalizar el onboarding, el sistema copia automáticamente la URL `stagelink.io/username` al clipboard del usuario y muestra un banner: "¡Tu página está lista! Ya puedes compartirla."

**AC-1.6** — El usuario puede saltarse cualquier paso del onboarding y completarlo después desde el dashboard.

---

### Feature 2 — Perfil Público del Artista

**AC-2.1** — La URL `stagelink.io/username` es pública y accesible sin login para cualquier visitante.

**AC-2.2** — La página muestra: foto de perfil, nombre artístico, bio, y lista de links/embeds en el orden definido por el artista.

**AC-2.3** — La página es mobile-first y se ve correctamente en pantallas desde 320px de ancho.

**AC-2.4** — La página carga el contenido visible (above the fold) en menos de 2 segundos en conexión 4G simulada (Lighthouse Performance ≥ 80).

**AC-2.5** — Si el username no existe, la página muestra un 404 con CTA "Crea tu página en StageLink".

**AC-2.6** — Las páginas de plan Free muestran al fondo el texto "Powered by StageLink" con link al home. Las páginas Pro no lo muestran.

---

### Feature 3 — Editor de Bloques

**AC-3.1** — El artista accede a su editor desde el dashboard (login requerido).

**AC-3.2** — El artista puede agregar un bloque de tipo **Link** con: URL (validada como URL válida), título (hasta 60 caracteres), e icono automático (favicon de la URL o genérico).

**AC-3.3** — El artista puede agregar un bloque de tipo **Embed de música**: pega una URL de Spotify o SoundCloud; el sistema detecta la plataforma y renderiza el player embebido nativo. Si la URL no es válida, muestra error claro.

**AC-3.4** — El artista puede agregar un bloque de tipo **Embed de video**: pega una URL de YouTube o TikTok; el sistema detecta la plataforma y renderiza el player embebido. Si la URL no es válida, muestra error claro.

**AC-3.5** — Los bloques se pueden reordenar con drag & drop. El nuevo orden se refleja inmediatamente en la página pública al guardar.

**AC-3.6** — El artista puede editar el título de cualquier bloque existente.

**AC-3.7** — El artista puede eliminar cualquier bloque. Se muestra un diálogo de confirmación antes de eliminar.

**AC-3.8** — Los cambios en el editor se guardan manualmente con un botón "Guardar cambios". Mientras haya cambios sin guardar, el botón indica "Cambios sin guardar".

**AC-3.9** — El plan Free limita a 10 bloques en total. Al intentar agregar el bloque 11, el sistema muestra un modal de upgrade a Pro.

**AC-3.10** — El editor tiene un panel de preview en tiempo real que muestra cómo quedará la página pública.

---

### Feature 4 — Analytics Básico

**AC-4.1** — El dashboard del artista muestra el total de visitas a su página en los últimos 30 días.

**AC-4.2** — El dashboard muestra la cantidad de clicks por bloque/link en los últimos 30 días.

**AC-4.3** — Un click de la misma IP dentro de 1 hora no cuenta como click adicional (deduplicación básica).

**AC-4.4** — Las visitas y clicks generados por el propio artista logueado no se contabilizan.

**AC-4.5** — En plan Pro: el dashboard muestra adicionalmente el breakdown de visitas por país (top 5) y por tipo de dispositivo (mobile / desktop).

**AC-4.6** — Los datos de analytics no están disponibles para los visitantes de la página pública; solo para el artista propietario logueado.

---

### Feature 5 — Planes y Billing

**AC-5.1** — Al registrarse, todo usuario queda en plan Free por defecto. No se requiere tarjeta de crédito para el Free.

**AC-5.2** — Desde el dashboard, el artista puede hacer upgrade a Pro ($5/mes) a través de un flujo de pago con Stripe (tarjeta de crédito). El pago es recurrente mensual.

**AC-5.3** — Al completar el pago, el plan Pro se activa en menos de 10 segundos y las restricciones del Free se eliminan inmediatamente.

**AC-5.4** — El artista Pro puede hacer downgrade a Free desde el dashboard. El plan Pro permanece activo hasta el fin del período ya pagado.

**AC-5.5** — Si el pago mensual falla (tarjeta vencida, fondos insuficientes), el sistema envía un email de aviso. Tras 3 días sin pago exitoso, el plan vuelve a Free automáticamente.

**AC-5.6** — El artista puede ver el historial de pagos y descargar recibos desde el dashboard.

**AC-5.7** — No hay lógica de reembolso automático en el MVP; los reembolsos se gestionan manualmente.

---

### Feature 6 — Branding "Powered by StageLink"

**AC-6.1** — Todas las páginas públicas de usuarios Free muestran en el footer el texto "Powered by StageLink" con un link a `stagelink.io`.

**AC-6.2** — El texto y el link son visibles en fondos oscuros y claros (contraste WCAG AA mínimo).

**AC-6.3** — El branding no puede ser ocultado, deshabilitado ni sobreescrito via CSS desde el perfil del artista Free.

**AC-6.4** — Las páginas de usuarios Pro no muestran el branding.

---

*Documento generado: 2026-03-23*
*Versión: 1.0 — MVP*
