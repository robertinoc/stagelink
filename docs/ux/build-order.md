# StageLink — Orden de Construcción del MVP

> Versión: 1.0 | Fecha: 2026-03-23
> Define qué se construye primero y por qué.

---

## Principio guía

Construir el camino más corto hacia una página pública funcional y compartible.
Cada paso debe producir algo testeable de punta a punta.

---

## Orden de pantallas

```
1. Layout base + Sidebar + AppShell
   → Sin esto, nada del dashboard funciona
   → Componentes: AppShell, Sidebar, AppLayout

2. Landing Marketing
   → Primer touch con el usuario externo
   → No requiere backend. Solo HTML/CSS.
   → Incluye: NavBar, Hero, Features, Pricing, Footer

3. Login / Auth
   → Desbloquea todo lo demás
   → Componentes: AuthCard, formularios, WorkOS integration

4. Onboarding (3 pasos)
   → Crea el primer artista + página + bloque
   → Depende de: Auth + API endpoints de artists, pages, blocks

5. Página Pública (read-only)
   → Validación del MVP: ¿la página se ve bien y rápido?
   → Depende de: DB schema + artist + blocks + SSR/ISR

6. Editor de bloques
   → Corazón del producto
   → Depende de: Página pública (para preview)
   → Orden interno: Link → Music → Video → Fan Capture

7. Dashboard home
   → Puede ser stub con datos hardcoded en primeras iteraciones
   → Depende de: Editor + Página pública

8. Analytics
   → Requiere que haya datos: construir después de que haya páginas con visitas reales
   → Primero: eventos + tabla. Después: UI

9. Billing
   → Construir cuando el producto ya tenga usuarios activos
   → Stripe sandbox first, prod credentials al final
```

---

## Orden de bloques (dentro del Editor)

| Orden | Bloque | Justificación |
|---|---|---|
| 1 | **Link** | Valida todo el pipeline sin dependencias externas (sin iframes) |
| 2 | **Music** | Agrega parsing de URL + iframe Spotify/SoundCloud |
| 3 | **Video** | Reutiliza 90% de Music, provider diferente |
| 4 | **Fan Capture** | Agrega formulario público + tabla subscribers + rate limit |

---

## Checkpoints de validación

Antes de pasar a la siguiente etapa, verificar:

**Checkpoint A — Página pública funciona:**
- [ ] `stagelink.io/username` renderiza sin login
- [ ] Performance Lighthouse ≥ 80
- [ ] Mobile (320px) sin overflow
- [ ] 404 si username no existe

**Checkpoint B — Editor cierra el loop:**
- [ ] Artista puede agregar un Link block desde el editor
- [ ] El bloque aparece en la página pública inmediatamente después de guardar
- [ ] El click en el link dispara un analytics_event
- [ ] El artista puede ver ese click en el dashboard (aunque sea como número simple)

**Checkpoint C — Bloque Music/Video funciona:**
- [ ] URL de Spotify/YouTube parseada correctamente
- [ ] Iframe renderiza en página pública
- [ ] Error claro si la URL no es soportada
- [ ] CSP headers no bloquean el embed

**Checkpoint D — Fan Capture en producción:**
- [ ] Email se guarda en DB con consentimiento
- [ ] Rate limit funciona (max 5/10min por IP)
- [ ] El artista puede ver y exportar sus subscribers
- [ ] El propio artista no puede suscribirse a sí mismo

**Checkpoint E — Billing funciona:**
- [ ] Stripe sandbox: plan Free → Pro activa correctamente
- [ ] Webhook recibido y plan actualizado en DB < 10 segundos
- [ ] Branding "Powered by StageLink" desaparece al activar Pro
- [ ] Downgrade mantiene Pro hasta fin del período pagado

---

## Lo que NO construir primero (aunque parezca tentador)

| Feature | Por qué esperar |
|---|---|
| Temas / personalización visual | Requiere que el core funcione. Agregar en iteración 2 del Editor |
| Analytics por país/dispositivo | Solo útil cuando hay tráfico real. Construir con datos reales |
| Custom domain | Depende de Cloudflare Workers. Post-MVP |
| AI Bio Generator | Fase 3 |
| Smart Link (detect Spotify/Apple) | Nice-to-have, no bloquea adopción |
| Multi-language | Solo en planes altos |
| EPK | Fase 2, semanas después del MVP |
| Settings avanzados | Hacer settings básico (cambiar nombre/bio) solo cuando se necesite |
