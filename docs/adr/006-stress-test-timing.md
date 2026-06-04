# ADR-006: Timing del stress-test controlado

- **Estado**: Aceptado
- **Fecha**: 2026-06-04
- **Deciders**: Roberto

---

## Contexto

El Final QA backlog (`LB-7` / decisión `D4`) dejó pendiente **decidir cuándo**
correr el stress-test controlado: antes o después del launch privado.

El stress-test real no debe correrse contra producción ni staging a la ligera —
necesita una ventana aprobada, monitoreo abierto y una condición de
stop/rollback. Lo que faltaba no era tooling sino la **decisión de timing**.

Evidencia disponible:

- Ya existe un load test registrado (`LB-6`) con 0% de fallos y sin `5xx` (warm
  p95 ~1026 ms vs target 1000 ms), corrido contra un preview ad-hoc.
- El launch privado es de bajo tráfico y está acotado por el modelo de trial.

## Decisión

**Opción B — correr el stress-test después del launch privado, antes del
tráfico público amplio.**

- El launch privado se hace con la evidencia del load test existente (`LB-6`),
  que es señal suficiente para su volumen.
- El stress-test controlado se agenda en la ventana **entre el launch privado y
  el tráfico público amplio**.

### Prerrequisitos para correrlo

- **Rate limiting distribuido**: ✅ ya implementado (PR #467, Upstash con
  fallback) — así el stress run ejercita el limiter real, no el in-memory.
- **Staging real**: pendiente / diferido — para no golpear producción. El stress
  test depende de que staging esté de pie.
- Ventana aprobada + monitoreo abierto (Sentry + uptime, ya activos) + condición
  de stop/rollback definida antes de arrancar.

## Trigger

Antes de **tráfico público amplio** / **paid acquisition**.

## Consecuencias

- El launch privado **no se bloquea** por el stress-test.
- Queda un trigger nombrado para que no se saltee silenciosamente.
- El stress test correrá contra una postura de producción realista (limiter
  distribuido ya activo), una vez que exista staging.
