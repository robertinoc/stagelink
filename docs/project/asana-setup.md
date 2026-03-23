# StageLink — Setup del tablero Asana

> Versión: 1.0 | Fecha: 2026-03-23
> Referencia: `stagelink_asana_import.csv` (30 tareas, 8 etapas, 242h totales)

---

## 1. Estructura del proyecto en Asana

### Tipo de proyecto recomendado
**Board view** (Kanban) como vista principal + **List view** para ver dependencias.
Timeline view para los milestones.

### Secciones del Board

```
BACKLOG → NOW → IN PROGRESS → BLOCKED → DONE
```

Adicionalmente, en List view, organizar por **secciones de etapa** (0 a 7) para poder ver el roadmap completo.

---

## 2. Custom Fields a configurar

Ir a **Customize → Add field** en el proyecto:

| Campo | Tipo | Opciones / Formato |
|---|---|---|
| `Estimated Hours` | Number | Número entero |
| `Estimated Days` | Number | Decimal (1 decimal) |
| `Epic` | Single-select | Scope, Arquitectura, UX, Gestión, Repositorio, Frontend, Backend, Infra local, Deploy, Database, Tenanting, Auth, Storage, Seguridad base, Onboarding, Dashboard, Perfil, Bloques, Links, Embeds, Pública, Smart Link, Tracking, Analytics, Fan list, Privacidad, Stripe, Gating, Billing UI, Free plan, Shopify, Merch, EPK, Analytics Pro, i18n, AI, Hardening, QA, Launch |
| `Priority` | Single-select | 🔴 Alta, 🟡 Media, 🟢 Baja |
| `Stage` | Single-select | 0-Estrategia, 1-Fundaciones, 2-Core, 3-Constructor, 4-Analytics, 5-Monetización, 6-Pro Features, 7-Launch |

---

## 3. Milestones

Crear como **tareas de tipo Milestone** (star icon en Asana):

| # | Nombre | Tareas que lo cierran | Horas acum. | Semanas @2h/día |
|---|---|---|---|---|
| M1 | **Definición completa** | T0-1 ✓, T0-2 ✓, T0-3 ✓, T0-4 | 12h | ~1.2 |
| M2 | **Repo y scaffold listos** | T1-1 → T1-5 | 34h | ~3.4 |
| M3 | **Core platform + Auth** | T2-1 → T2-5 | 68h | ~6.8 |
| M4 | **Primera página pública** | T3-1 → T3-7 | 122h | ~12.2 |
| M5 | **Analytics + Fan capture** | T4-1 → T4-4 | 149h | ~14.9 |
| M6 | **Monetización activa** | T5-1 → T5-4 | 173h | ~17.3 |
| M7 | **Launch ready** | T7-2, T7-3, T7-4 | 194h | ~19.4 |

> M1 ya está completo con las tareas T0-1 a T0-3. T0-4 (esta sesión) lo cierra.

---

## 4. Now / Next / Later

### NOW — Empezar esta semana

| Tarea | Descripción | Horas | Bloquea a |
|---|---|---|---|
| **T0-4** | Armar tablero Asana y backlog | 2h | T1-1 |
| **T1-1** | Crear monorepo y estándares del repo | 4h | T1-2, T1-3, T1-4 |
| **T1-2** | Scaffold frontend Next.js + Tailwind + shadcn | 5h | T1-4, T1-5 |
| **T1-3** | Scaffold backend NestJS y módulos base | 5h | T1-4, T1-5 |

**Por qué ahora:** T1-1 bloquea todo lo demás. Sin monorepo, no hay frontend ni backend. T1-2 y T1-3 se pueden hacer en paralelo (misma sesión: avanzar uno, luego el otro).

---

### NEXT — Próximas 3–5 semanas

| Tarea | Descripción | Horas | Depende de |
|---|---|---|---|
| **T1-4** | Entorno local + PostgreSQL + secrets | 3h | T1-1, T1-2, T1-3 |
| **T1-5** | Deploy preview: Vercel + Railway + Cloudflare | 5h | T1-2, T1-3, T1-4 |
| **T2-1** | Schema PostgreSQL y migraciones | 8h | T0-2 ✓, T1-3, T1-4 |
| **T2-2** | Multi-tenant por username y dominio | 8h | T2-1, T1-2, T1-3 |
| **T2-3** | WorkOS Auth y sesiones | 8h | T2-1, T1-2, T1-3 |
| **T2-4** | Pipeline S3 para assets | 5h | T2-1, T1-3, T1-4 |
| **T2-5** | Ownership, permisos y auditoría | 5h | T2-2, T2-3 |

**Por qué next:** Son las fundaciones técnicas. Sin DB + auth + multi-tenant, no se puede construir nada del editor ni la página pública.

---

### LATER — Después de que el core funcione

**Bloque A — Constructor MVP (construir en este orden):**

| Tarea | Descripción | Horas |
|---|---|---|
| T3-1 | Onboarding del artista | 6h |
| T3-2 | Shell del dashboard | 5h |
| T3-3 | Editor de perfil | 6h |
| T3-4 | Motor de bloques: CRUD + orden | 8h |
| T3-5 | Bloque Links / CTA | 6h |
| T3-6 | Bloques Music + Video embeds | 8h |
| T3-7 | Página pública SSR/SEO | 10h |
| T3-8 | Smart Link v1 *(puede diferirse)* | 5h |

**Bloque B — Analytics + Fans:**
T4-1 → T4-2 → T4-3 → T4-4

**Bloque C — Monetización:**
T5-1 → T5-2 → T5-3 → T5-4

**Bloque D — Features Pro (post-launch):**
T6-1 → T6-2 → T6-3 → T6-4 → T6-5

**Bloque E — Hardening + Launch:**
T7-2 → T7-3 → T7-4

**T7-1 (AI Bio):** diferir hasta post-PMF.

---

## 5. Dependencias críticas (cadena de bloqueo)

```
T0-2 ✓
  └→ T1-1
       ├→ T1-2 ─────────────┐
       ├→ T1-3 ─────────────┤
       └→ T1-4 ─────────────┤
                             ├→ T2-1
                             │    ├→ T2-2 ──→ T3-1 ──→ T3-2 ──→ T3-4
                             │    ├→ T2-3 ──→     └──→ T3-3 ──→ T3-5 ──→ T3-7
                             │    └→ T2-4          └──→ T3-6 ──→ T3-7
                             └→ T1-5
```

**Tareas sin dependencia técnica (pueden hacerse en cualquier momento):**
- T3-8 (Smart Link) — solo depende de T3-5 y T3-7
- T4-3 (Fan Capture) — puede construirse en paralelo con T4-1/T4-2
- T5-3 (Billing UI) — puede diseñarse mientras T5-1 está en curso

---

## 6. Rutina diaria de 2 horas

```
┌─────────────────────────────────────────────────────────┐
│  SESIÓN DIARIA — 2 horas                                │
│                                                         │
│  ⏱ 0:00 – 0:15  CONTEXTO (15 min)                     │
│  ─────────────────────────────────────────────────────  │
│  • Leer notas de la sesión anterior (si las hay)        │
│  • Revisar la tarea activa en Asana                     │
│  • Leer los criterios de aceptación de esa tarea        │
│  • Tener claro: ¿qué define "terminado" hoy?            │
│                                                         │
│  ⏱ 0:15 – 1:30  CONSTRUIR (75 min)                    │
│  ─────────────────────────────────────────────────────  │
│  • Un cambio pequeño y testeable por vez                │
│  • Usar el prompt de implementación del project plan    │
│  • Si aparece un bloqueante → anotar, no perder tiempo  │
│  • Commit al final de cada sub-tarea completada         │
│                                                         │
│  ⏱ 1:30 – 1:50  TESTEAR (20 min)                      │
│  ─────────────────────────────────────────────────────  │
│  • Happy path: ¿funciona el caso principal?             │
│  • Edge case: ¿qué pasa con datos vacíos / inválidos?   │
│  • Si algo rompe → fix inmediato o anotar como bug      │
│  • No pasar a la siguiente tarea con tests fallando     │
│                                                         │
│  ⏱ 1:50 – 2:00  DOCUMENTAR (10 min)                   │
│  ─────────────────────────────────────────────────────  │
│  • Actualizar estado en Asana (In Progress / Done)      │
│  • Anotar qué quedó pendiente y por qué                 │
│  • Escribir el commit message final con contexto        │
│  • Si terminó la tarea: marcar Done + iniciar la next   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Reglas de la rutina

1. **Una tarea activa a la vez.** No empezar T1-3 si T1-2 no tiene al menos un commit funcional.
2. **Si estás bloqueado más de 20 min**, anotarlo y saltar a una tarea paralela. No perder la sesión entera.
3. **Los viernes** (o el último día de la semana): 10 min extra para revisar el progreso vs. estimación y ajustar el backlog si hace falta.
4. **No acumular WIP.** Máximo 2 tareas en "In Progress" al mismo tiempo.

---

## 7. Pasos para armar el tablero en Asana

### Paso 1 — Importar el CSV
1. Ir a **Asana → New Project → Import spreadsheet**
2. Subir `stagelink_asana_import.csv`
3. Mapear columnas:
   - `Name` → Task Name
   - `Notes` → Description
   - `Section/Column` → Section
   - `Priority` → (campo custom que crearás en el paso 3)

### Paso 2 — Configurar secciones
Crear estas secciones en el Board:
```
BACKLOG | NOW | IN PROGRESS | BLOCKED | DONE
```

Mover manualmente las tareas del NOW a la columna NOW (ver lista arriba).

### Paso 3 — Agregar Custom Fields
Ir a **Customize → Fields → Add field** y crear los 5 campos listados en la sección 2.
Completar los valores para cada tarea (están en el CSV como `Estimated Hours`, `Estimated Days`, `Epic`, `Priority`).

### Paso 4 — Crear los Milestones
Crear 7 tareas de tipo Milestone (ícono ⭐) con los nombres del apartado 3.
Asignar las tareas correspondientes como dependencias de cada milestone.

### Paso 5 — Configurar dependencias
Para cada tarea, ir a **Add dependency** y cargar las dependencias del campo `Dependencies` del CSV.
Las principales (críticas) están en el diagrama de la sección 5.

### Paso 6 — Configurar la Timeline view
Activar **Timeline** y organizar los milestones en el tiempo.
Referencia: M1 ya completado. M2 en ~2 semanas desde hoy (2026-03-23).

---

## 8. Calendario orientativo (desde 2026-03-23)

| Milestone | Fecha objetivo | Horas restantes |
|---|---|---|
| M1 — Definición completa | ✅ 2026-03-23 | 0h |
| M2 — Repo y scaffold | 2026-04-06 | 22h (~2 sem.) |
| M3 — Core platform | 2026-04-27 | 34h (~3.5 sem.) |
| M4 — Primera página pública | 2026-06-01 | 54h (~5.5 sem.) |
| M5 — Analytics + Fan capture | 2026-06-22 | 27h (~2.5 sem.) |
| M6 — Monetización activa | 2026-07-13 | 24h (~2.5 sem.) |
| M7 — Launch ready | 2026-08-03 | 21h (~2 sem.) |

> Base: 2 horas/día, 5 días/semana. Fechas aproximadas, ajustar según ritmo real.
> **Target de lanzamiento orientativo: Julio–Agosto 2026.**
