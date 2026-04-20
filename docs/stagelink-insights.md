# StageLink Insights

## Propósito

`StageLink Insights` es la futura capa PRO+ de analytics unificadas para artistas dentro de StageLink.

No busca clonar Songstats. La meta del módulo es:

- centralizar métricas útiles de plataformas conectadas
- mostrar tendencias y top content en un solo dashboard
- mantener una base honesta y mantenible
- evitar prometer datos que las APIs oficiales no exponen

## Plataformas previstas para MVP

- Spotify
- YouTube
- SoundCloud

## Qué entra en esta fundación

Esta primera etapa implementa solo la base arquitectónica:

- feature gate nuevo: `stage_link_insights`
- modelos de conexión por artista
- almacenamiento de snapshots periódicos por plataforma
- provider layer mínima y extensible
- endpoint privado para dashboard skeleton
- ruta privada en dashboard: `/{locale}/dashboard/analytics/insights`
- UI inicial con estados vacíos, lock state y capacidades por plataforma

Todavía **no** implementa:

- OAuth real
- scheduled sync real
- fetch de métricas contra APIs externas
- charts con datos reales
- flujos de “connect account” productivos

## Modelo de datos

### `ArtistPlatformInsightsConnection`

Conexión por artista y plataforma.

Campos relevantes:

- `artistId`
- `platform`
- `connectionMethod`
- `status`
- `externalAccountId`
- `externalHandle`
- `externalUrl`
- `displayName`
- `accessToken`
- `refreshToken`
- `tokenExpiresAt`
- `scopes`
- `metadata`
- `lastSyncStartedAt`
- `lastSyncedAt`
- `lastSyncStatus`
- `lastSyncError`

Notas:

- `accessToken` / `refreshToken` quedan listos para OAuth futuro
- la ausencia de fila equivale a “not connected”
- los secretos viven solo en backend

### `ArtistPlatformInsightsSnapshot`

Snapshot periódico normalizado por plataforma.

Campos relevantes:

- `artistId`
- `connectionId`
- `platform`
- `capturedAt`
- `profile`
- `metrics`
- `topContent`
- `notes`

Esto permite:

- persistir historia por plataforma
- renderizar el dashboard sin llamar al provider en cada request
- evitar mezclar modelos incompatibles entre plataformas

## Provider layer

Archivo base:

- `apps/api/src/modules/insights/providers/insights-provider.interface.ts`

Providers iniciales:

- `spotify-insights.provider.ts`
- `youtube-insights.provider.ts`
- `soundcloud-insights.provider.ts`

Cada provider declara:

- `platform`
- `connectionMethod`
- `getCapabilities()`
- `syncLatestSnapshot()`

En esta fundación, `syncLatestSnapshot()` queda como contrato preparado para el próximo Epic.

## Soporte y limitaciones por plataforma

### Spotify

Realista para:

- artist profile basics
- followers públicos
- popularity
- top tracks

Limitación importante:

- Spotify no ofrece una API pública equivalente a Spotify for Artists para analytics profundas de artistas

Referencias:

- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Get Artist](https://developer.spotify.com/documentation/web-api/reference/get-an-artist)

### YouTube

Realista para:

- channel basics
- subscribers
- views
- top videos

Limitación importante:

- las métricas más confiables y profundas dependen de acceso owner-authorized
- YouTube Analytics API requiere scopes y flujo OAuth del propietario del canal

Referencias:

- [YouTube Data API](https://developers.google.com/youtube/v3)
- [channels.list](https://developers.google.com/youtube/v3/docs/channels/list)
- [YouTube Analytics API](https://developers.google.com/youtube/analytics)

### SoundCloud

Realista para:

- profile basics
- summary data pública limitada

Limitación importante:

- el acceso oficial a analytics es más restringido
- no conviene prometer señales profundas sin un owner flow documentado y estable

Referencia:

- [SoundCloud API docs](https://developers.soundcloud.com/docs/api)

## Shape pública / privada

El dashboard de insights es **privado**. No se expone nada de este módulo en la página pública del artista.

Endpoint actual:

- `GET /api/insights/:artistId/dashboard`

Protecciones:

- JWT válido
- membership read sobre el `artistId`
- feature gate `stage_link_insights`

Respuesta actual:

- cards de resumen del módulo
- lista de plataformas soportadas
- estado de conexión por plataforma
- último snapshot por plataforma cuando exista
- capacidades declaradas por provider

## Feature gating

`stage_link_insights` vive en `Pro+`.

Se aplica en:

- backend, desde `BillingEntitlementsService`
- web dashboard, mostrando lock state claro
- settings feature matrix, para visibilidad de plan

## Seguridad

- no se exponen secretos al frontend
- el dashboard es privado y multi-tenant safe
- las conexiones están asociadas al `artistId`
- el módulo queda listo para reutilizar cifrado en reposo sobre tokens cuando el flujo OAuth se active

## Setup / env vars

Esta fundación **no agrega nuevas env vars obligatorias**.

Todavía no se activaron credenciales externas porque:

- no hay OAuth productivo en esta etapa
- no hay sync jobs reales en esta etapa

Cuando se avance el próximo Epic, probablemente hagan falta:

- credenciales OAuth de Spotify / YouTube / SoundCloud
- callback URLs
- tal vez API key de YouTube Data API según el flujo elegido

## Sync behavior actual

No hay scheduler real todavía.

El modelo ya soporta:

- `lastSyncStartedAt`
- `lastSyncedAt`
- `lastSyncStatus`
- `lastSyncError`
- snapshots históricos

Eso deja la base lista para sumar:

- cron/scheduler
- manual refresh
- retry/backoff
- provider-specific refresh logic

## Cómo extender después

### Próximo Epic recomendado

1. elegir el primer provider “real” a conectar
2. implementar flow de conexión por plataforma
3. persistir tokens/metadata mínimos
4. crear primer sync real de snapshots
5. mostrar métricas reales en cards y top content

### Orden sugerido

1. Spotify reference/public-data flow
2. YouTube owner OAuth
3. SoundCloud public-summary support

### Por qué ese orden

- Spotify es buen candidato para empezar con reference/public data
- YouTube entrega mucho valor, pero con más complejidad de auth
- SoundCloud conviene tratarlo con más cuidado por limitaciones de acceso
