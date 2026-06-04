# ADR-005: Backups de base de datos — diferir Supabase Pro hasta revenue

- **Estado**: Aceptado
- **Fecha**: 2026-06-04
- **Deciders**: Roberto

---

## Contexto

El Security Audit (P1) y el Final QA backlog (`LB-5`) marcaron **backups
gestionados + un restore drill real** como condición previa al tráfico público
amplio con datos de usuarios.

Hechos relevantes:

- La base de datos productiva es **Supabase** (no el Postgres de Railway, que
  está sin uso — ver "Limpieza"). Esto se confirmó al rotar el password: rotar
  el de Supabase arregló la conexión de la API.
- El **plan Free de Supabase no incluye backups automáticos**. Los backups
  diarios (retención 7 días) y el Point-in-Time Recovery (PITR) requieren
  **Supabase Pro** (~USD 25/mes + add-on de PITR).
- StageLink está **pre-revenue**.

## Decisión

**Diferir el upgrade a Supabase Pro** (y por lo tanto los backups gestionados +
PITR) hasta tener tracción comercial.

- **Trigger de activación**: más de **100 MAU pagando** / revenue recurrente.
- El **restore drill** (`LB-5`) se difiere junto con esto, ya que necesita una
  fuente de backup gestionada para ser representativo.

## Riesgo aceptado

Entre el launch y el trigger, **la data real de usuarios no tiene backup
automático gestionado**. Esto es:

- **Aceptable** para un launch privado / primeros usuarios, donde el volumen y
  el valor de los datos es bajo.
- **NO aceptable** para tráfico público amplio con datos significativos — momento
  en el que este ADR debe revisarse y activarse Supabase Pro.

## Mitigación interina ($0, recomendada)

Para no quedar sin ningún punto de recuperación en el Free tier, se recomienda un
**backup lógico periódico** (pg_dump) usando el tooling que ya existe en el repo
(`pnpm data:backup`), idealmente como un **GitHub Action programado** que suba el
dump a un bucket de almacenamiento. No reemplaza a PITR, pero da un punto de
recuperación reciente sin pagar Pro.

> Estado: **pendiente de implementar** (opcional). Se puede agregar como un
> workflow chico cuando se decida.

## Limpieza relacionada

Borrar el servicio **Postgres de Railway** (con su `postgres-volume`): está sin
uso desde que la DB vive en Supabase. Ahorra el costo del volumen y elimina la
ambigüedad sobre cuál es la base de datos real.

## Consecuencias

- Se evita un costo fijo mensual mientras la app no genera ingresos.
- Queda registrado de forma explícita que el launch (privado / temprano) corre
  **sin backups gestionados**, con un trigger claro para corregirlo.
- El gate `LB-5` no queda "olvidado": queda diferido con condición de
  reactivación y una mitigación gratuita disponible.
