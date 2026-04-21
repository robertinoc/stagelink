# StageLink Insights

## Propósito

`StageLink Insights` es la capa PRO+ de analytics unificadas para artistas dentro de StageLink.

No busca clonar Songstats. La meta del módulo es:

- centralizar métricas útiles de plataformas conectadas
- mostrar tendencias y top content en un solo dashboard
- mantener una base honesta y mantenible
- evitar prometer datos que las APIs oficiales no exponen

## Plataformas previstas para MVP

- Spotify
- YouTube
- SoundCloud

## Qué está activo hoy

La base arquitectónica ya existe y Epic 1 suma el primer provider real:

- feature gate nuevo: `stage_link_insights`
- modelos de conexión por artista
- almacenamiento de snapshots periódicos por plataforma
- provider layer mínima y extensible
- endpoint privado para dashboard skeleton
- ruta privada en dashboard: `/{locale}/dashboard/analytics/insights`
- UI privada con estados vacíos, lock state y capacidades por plataforma
- conexión real de Spotify por referencia de artista
- sync manual real para Spotify
- snapshots reales de Spotify con profile basics, followers, popularity y top tracks

Todavía **no** implementa:

- OAuth owner-authorized para YouTube
- scheduled sync automático
- alertas o reportes
- charts históricos avanzados
- flows productivos para YouTube o SoundCloud

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

### Spotify (Epic 1)

Spotify usa:

- `connectionMethod = reference`
- input del usuario: URL / URI / ID del artista
- validación contra Spotify Web API
- client credentials flow del lado backend para obtener el app access token
- sync manual que escribe un snapshot normalizado

No se guarda ningún token del usuario/artista para Spotify en esta etapa.

El access token de Spotify:

- se obtiene server-side con `client_credentials`
- se cachea en memoria hasta su expiración
- se renueva automáticamente cuando expira

## Spotify: métricas soportadas ahora

Epic 1 soporta únicamente datos realistas accesibles vía Spotify Web API:

- datos básicos del perfil del artista
- followers públicos (`followers.total`)
- popularity del artista
- top tracks por mercado

El snapshot de Spotify guarda:

- `profile.displayName`
- `profile.imageUrl`
- `profile.externalUrl`
- `metrics.followers_total`
- `metrics.popularity`
- `metrics.genres_count`
- `metrics.top_tracks_count`
- `topContent[]` con top tracks ligeros

## Spotify: limitaciones reales

- Spotify **no** expone una API pública equivalente a Spotify for Artists
- no hay “monthly listeners” oficiales por API pública
- no hay analytics profundas de audiencia por artista
- top tracks dependen del mercado elegido
- por eso StageLink Insights no intenta fingir una capa tipo Songstats con datos que Spotify no publica

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
- [Get Artist's Top Tracks](https://developer.spotify.com/documentation/web-api/reference/get-an-artists-top-tracks)
- [Client Credentials Flow](https://developer.spotify.com/documentation/web-api/tutorials/client-credentials-flow)

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

Endpoints actuales:

- `GET /api/insights/:artistId/dashboard`
- `POST /api/insights/:artistId/spotify/validate`
- `PATCH /api/insights/:artistId/spotify`
- `POST /api/insights/:artistId/spotify/sync`

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

Spotify sí agrega env vars reales en Epic 1:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_TOP_TRACKS_MARKET`

Notas:

- `SPOTIFY_TOP_TRACKS_MARKET` acepta un código de mercado de 2 letras
- si no se define, StageLink usa `US`
- no hay callback URL de Spotify todavía porque esta etapa no usa OAuth de usuario

Los providers futuros probablemente agreguen:

- credenciales OAuth de YouTube / SoundCloud
- callback URLs
- scheduler config cuando exista infraestructura de sync automático

## Sync behavior actual

Spotify ya tiene sync manual real.

Hoy el comportamiento es:

- el artista conecta Spotify por referencia de artista
- StageLink valida el artista usando la Web API oficial
- el artista puede disparar `Sync now`
- el backend obtiene o reutiliza un app access token
- el backend consulta el artista y sus top tracks
- se escribe un snapshot nuevo en `ArtistPlatformInsightsSnapshot`
- se actualiza el estado de sync en `ArtistPlatformInsightsConnection`

Todavía no hay scheduler real ni cron automático.

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

1. YouTube owner-authorized connection flow
2. scheduler / periodic sync infra
3. historical trends sobre snapshots reales
4. SoundCloud public-summary integration
5. UI comparativa más rica por plataforma

### Orden sugerido

1. YouTube owner OAuth
2. scheduler / sync jobs
3. SoundCloud public-summary support

### Por qué ese orden

- Spotify ya cubre el primer caso realista con public artist data
- YouTube entrega mucho valor, pero con más complejidad de auth
- SoundCloud conviene tratarlo con más cuidado por limitaciones de acceso
