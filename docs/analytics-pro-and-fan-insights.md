# Analytics Pro and Fan Insights (T6-4)

## Objetivo

Extender el dashboard básico de analíticas (T4-2) con una capa Pro útil y mantenible,
sin crear un sistema paralelo ni prometer señales que StageLink todavía no puede sostener
con precisión.

La experiencia sigue viviendo en `/dashboard/analytics`:

- todos los tenants ven el overview básico
- tenants con `analytics_pro` ven módulos avanzados adicionales
- tenants con `advanced_fan_insights` ven insights agregados de captación

## Qué entra en Analytics Pro ahora

### `analytics_pro`

- rango premium de `365d`
- tendencias por día de:
  - `page_view`
  - `link_click`
  - `smart_link_resolution`
- rendimiento de Smart Links:
  - clicks
  - resolutions
  - top Smart Links en el rango

### `advanced_fan_insights`

- total de capturas (`fan_capture_submit`)
- capturas por día
- `fanCaptureRate` aproximado
- top capture blocks

## Qué se deja para después

No se implementa todavía porque la fuente actual no es lo suficientemente confiable o
porque agregaría complejidad desproporcionada:

- top countries
- breakdown general por plataforma / device
- top locales de captación
- cohortes
- attribution compleja
- exports avanzados
- benchmarks
- insights por IA

## Relación con T4-2 y T4-3

### T4-2

T6-4 reutiliza la misma fuente de verdad básica:

- tabla `analytics_events`
- mismos filtros de calidad de T4-4
- misma lógica de rangos (`7d`, `30d`, `90d`, `365d`)

No se crea una capa paralela.

### T4-3

Los fan insights se construyen sobre:

- eventos `fan_capture_submit` en `analytics_events`
- metadata de bloques para atribución agregada

No se usa la lista de subscribers como centro del dashboard, para evitar mezclar analytics
agregadas con una experiencia tipo CRM.

## Feature gates

- `analytics_pro`
  - protege:
    - `GET /api/analytics/:artistId/pro/trends`
    - `GET /api/analytics/:artistId/pro/smart-links`
    - rango `365d` del overview básico

- `advanced_fan_insights`
  - protege:
    - `GET /api/analytics/:artistId/pro/fan-insights`

En la matriz actual de T5-2, ambas viven en `Pro+`.

## Endpoints

### `GET /api/analytics/:artistId/overview?range=7d|30d|90d|365d`

Devuelve:

- page views
- link clicks
- CTR
- smart link resolutions
- top links

### `GET /api/analytics/:artistId/pro/trends?range=7d|30d|90d|365d`

Devuelve series diarias para:

- page views
- link clicks
- smart link resolutions

### `GET /api/analytics/:artistId/pro/smart-links?range=7d|30d|90d|365d`

Devuelve top Smart Links agregados por:

- clicks
- resolutions

### `GET /api/analytics/:artistId/pro/fan-insights?range=7d|30d|90d|365d`

Devuelve:

- total captures
- page views usados
- `fanCaptureRate`
- captures over time
- top capture blocks

## Definiciones de métricas

### `fanCaptureRate`

Se muestra como una aproximación explícita:

`fan_capture_submit / page_view`

No representa una conversión de marketing exacta ni una métrica session-based.

### Smart Link performance

Se muestran:

- clicks sobre links marcados como Smart Link
- resolutions registradas por el resolver público

No se muestra todavía una tasa derivada, porque StageLink también puede recibir
resolutions por caminos distintos al click registrado en la página.

## Privacidad

El dashboard Pro **no** expone:

- emails
- filas individuales de subscribers
- PII de fans

Solo se muestran agregaciones.

## Calidad de datos

Las consultas reutilizan la política de T4-4:

- `isBotSuspected = false`
- `isQa = false`
- `environment = production`

`isInternal` sigue ausente del filtro porque el preview interno todavía no inyecta el
header correspondiente desde el web tier.

## Empty states y limitaciones

La UI debe manejar:

- cero tráfico
- cero Smart Links
- cero fan captures
- división por cero en capture rate

Cuando no hay suficiente señal, la interfaz muestra contexto en lugar de `NaN`,
gráficos vacíos crípticos o tablas rotas.

## Cómo extender esta capa después

Los próximos pasos naturales serían:

1. poblar `country` y `device` de forma confiable en `analytics_events`
2. agregar breakdowns por país/plataforma
3. introducir comparativas contra período anterior
4. agregar exports o vistas más profundas si el uso real lo justifica

No conviene adelantar esas capas antes de tener la señal base completa.

## Demo seed y cleanup

Para probar T6-4 antes del lanzamiento, StageLink incluye dos scripts reversibles
que siembran y limpian data ficticia para un artista `free` y otro `pro+`.

### Seed

```bash
pnpm --filter @stagelink/api seed:demo-analytics -- --free=<free_username> --pro=<pro_username> --tag=t6-4-demo
```

Qué hace:

- carga `page_view` y `link_click` para el artista `free`
- carga `page_view`, `link_click`, `smart_link_resolution`, `fan_capture_submit` y `subscribers`
  para el artista `pro+`
- crea bloques y Smart Links demo mínimos si hacen falta para generar atribución útil
- marca todo con un `tag` para poder borrarlo después sin tocar datos reales

### Cleanup

```bash
pnpm --filter @stagelink/api seed:demo-analytics:cleanup -- --free=<free_username> --pro=<pro_username> --tag=t6-4-demo
```

Qué borra:

- `analytics_events` sembrados por el seed
- `subscribers` demo
- bloques demo creados por el seed
- Smart Links demo creados por el seed
- páginas demo creadas por el seed, si aplicara

Recomendación:

- usalo en local, staging o una base controlada
- si querés correrlo contra una base remota, verificá primero qué `DATABASE_URL` tenés activa
