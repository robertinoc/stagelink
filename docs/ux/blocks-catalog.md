# StageLink — Catálogo de Bloques MVP

> Versión: 1.0 | Fecha: 2026-03-23
> Define los 4 tipos de bloque del MVP: props, validaciones, render público y render en editor.

---

## Estructura base de todos los bloques

Todos los bloques comparten estos campos en DB (ver `entities.md`):

```typescript
interface BlockBase {
  id: string;           // UUID
  page_id: string;      // FK → pages
  artist_id: string;    // FK → artists (denormalizado)
  type: BlockType;      // discriminant
  position: number;     // 0-indexed, ordenado
  is_visible: boolean;  // toggle sin borrar
  created_at: string;
  updated_at: string;
  config: BlockConfig;  // tipo-específico (ver abajo)
}

type BlockType = 'link' | 'music' | 'video' | 'fan_capture';
```

---

## Bloque 1 — Link

El bloque más básico: un botón que lleva a una URL externa.

### Config

```typescript
interface LinkBlockConfig {
  url: string;         // URL destino. HTTPS requerido.
  title: string;       // Texto del botón. Máx 60 chars.
  icon_url?: string;   // Favicon autofetcheado o null para icono genérico.
  description?: string;// Subtítulo opcional debajo del título. Máx 80 chars.
}
```

### Validaciones (Zod)

```typescript
const LinkBlockSchema = z.object({
  url: z.string()
    .url('URL inválida')
    .refine(u => u.startsWith('https://'), 'Solo se permiten URLs HTTPS'),
  title: z.string()
    .min(1, 'El título es requerido')
    .max(60, 'Máx 60 caracteres'),
  icon_url: z.string().url().optional().nullable(),
  description: z.string().max(80).optional().nullable(),
});
```

### Render público

```
┌─────────────────────────────────────────────────────────────────┐
│  [favicon/icon]  Título del link                       →        │
│                  descripción opcional (muted, smaller)          │
└─────────────────────────────────────────────────────────────────┘
```

- Botón full-width con hover lift
- `target="_blank" rel="noopener noreferrer"`
- Al click: fire `block_click` analytics event antes de navegar

### Render en editor

```
⠿  [🔗]  Título del link
         url.destino.com
         [ Editar ]  [ 👁 ]  [ 🗑 ]
```

### Comportamiento del icono

1. Al guardar el URL, el backend hace `GET https://icon.horse/icon/{domain}` (o similar) para fetchear el favicon.
2. Si falla o timeout > 2s → usa `icon:Link2` (lucide) como fallback.
3. El `icon_url` se guarda en config. No se re-fetchea en cada render.

---

## Bloque 2 — Music Embed

Reproduce música inline desde Spotify o SoundCloud.

### Config

```typescript
interface MusicBlockConfig {
  url: string;                          // URL original pegada por el artista
  provider: 'spotify' | 'soundcloud';  // Detectado automáticamente
  embed_id: string;                    // ID/path extraído para construir el iframe src
  title?: string;                      // Título opcional visible sobre el player
}
```

### Validaciones (Zod)

```typescript
const MusicBlockSchema = z.object({
  url: z.string()
    .url()
    .refine(
      url => isSupportedMusicUrl(url),
      'Solo Spotify y SoundCloud son soportados'
    ),
  title: z.string().max(80).optional().nullable(),
});

// Lógica de detección de proveedor
function isSupportedMusicUrl(url: string): boolean {
  return (
    url.includes('spotify.com') ||
    url.includes('soundcloud.com')
  );
}
```

### Parsing de URLs → embed_id

```typescript
// Spotify
// Input:  https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC
// Output: { provider: 'spotify', embed_id: 'track/4uLU6hMCjMI75M1A2tKUQC' }
// iFrame: https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC

// SoundCloud (usa oEmbed)
// Input:  https://soundcloud.com/artist/track-name
// Output: { provider: 'soundcloud', embed_id: 'soundcloud.com/artist/track-name' }
// iFrame: generado via SoundCloud oEmbed API

function parseMusicUrl(url: string): { provider: Provider; embed_id: string } {
  if (url.includes('spotify.com')) {
    const match = url.match(/spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
    if (!match) throw new Error('URL de Spotify inválida');
    return { provider: 'spotify', embed_id: `${match[1]}/${match[2]}` };
  }
  if (url.includes('soundcloud.com')) {
    const path = new URL(url).pathname.slice(1); // 'artist/track-name'
    return { provider: 'soundcloud', embed_id: path };
  }
  throw new Error('Proveedor no soportado');
}
```

### Render público

```
┌────────────────────────────────────────────────────────────┐
│  titulo opcional (si se configuró)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │   [iframe: Spotify/SoundCloud player embed]          │  │
│  │   height: 152px (Spotify compact) /                  │  │
│  │           166px (SoundCloud)                         │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

- `loading="lazy"` en el iframe
- Wrapper con `aspect-ratio` fijo para evitar layout shift
- CSP: permitir `frame-src spotify.com soundcloud.com`

### Render en editor

```
⠿  [🎵]  "Nombre del track" (fetched via oEmbed)
          open.spotify.com/track/...
          [ Editar ]  [ 👁 ]  [ 🗑 ]
```

---

## Bloque 3 — Video Embed

Reproduce video inline desde YouTube o TikTok.

### Config

```typescript
interface VideoBlockConfig {
  url: string;                          // URL original
  provider: 'youtube' | 'tiktok';     // Detectado automáticamente
  embed_id: string;                    // Video ID extraído
  title?: string;                      // Título opcional sobre el player
}
```

### Validaciones (Zod)

```typescript
const VideoBlockSchema = z.object({
  url: z.string()
    .url()
    .refine(
      url => isSupportedVideoUrl(url),
      'Solo YouTube y TikTok son soportados'
    ),
  title: z.string().max(80).optional().nullable(),
});

function isSupportedVideoUrl(url: string): boolean {
  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('tiktok.com')
  );
}
```

### Parsing de URLs → embed_id

```typescript
// YouTube
// Input:  https://www.youtube.com/watch?v=dQw4w9WgXcQ
// Input:  https://youtu.be/dQw4w9WgXcQ
// Output: { provider: 'youtube', embed_id: 'dQw4w9WgXcQ' }
// iFrame: https://www.youtube.com/embed/dQw4w9WgXcQ

// TikTok
// Input:  https://www.tiktok.com/@artista/video/7123456789012345678
// Output: { provider: 'tiktok', embed_id: '7123456789012345678' }
// iFrame: https://www.tiktok.com/embed/v2/7123456789012345678

function parseVideoUrl(url: string): { provider: Provider; embed_id: string } {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (!match) throw new Error('URL de YouTube inválida');
    return { provider: 'youtube', embed_id: match[1] };
  }
  if (url.includes('tiktok.com')) {
    const match = url.match(/video\/(\d+)/);
    if (!match) throw new Error('URL de TikTok inválida');
    return { provider: 'tiktok', embed_id: match[1] };
  }
  throw new Error('Proveedor no soportado');
}
```

### Render público

```
┌────────────────────────────────────────────────────────────┐
│  titulo opcional                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │   [iframe: YouTube/TikTok embed]                     │  │
│  │   aspect-ratio: 16/9                                 │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

- `loading="lazy"` + `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"`
- CSP: permitir `frame-src youtube.com tiktok.com`
- No autoplay (respeta preferencias del usuario)

### Render en editor

```
⠿  [📹]  "Título del video" (fetched via oEmbed si disponible)
          youtube.com/watch?v=...
          [ Editar ]  [ 👁 ]  [ 🗑 ]
```

---

## Bloque 4 — Fan Email Capture

Formulario para capturar emails de fans con consentimiento explícito.

### Config

```typescript
interface FanCaptureBlockConfig {
  heading: string;       // Título del bloque. Máx 80 chars.
  placeholder: string;   // Placeholder del input. Máx 60 chars.
  button_label: string;  // Texto del botón de submit. Máx 40 chars.
  consent_text: string;  // Texto de consentimiento GDPR. Máx 300 chars.
}
```

### Defaults al crear

```typescript
const FAN_CAPTURE_DEFAULTS: FanCaptureBlockConfig = {
  heading: 'Sumate a mi lista de fans',
  placeholder: 'Tu email...',
  button_label: 'Suscribirme',
  consent_text:
    'Acepto recibir novedades, lanzamientos y noticias de este artista. ' +
    'Podés darte de baja en cualquier momento.',
};
```

### Validaciones del formulario de config (Zod)

```typescript
const FanCaptureBlockSchema = z.object({
  heading: z.string().min(1).max(80),
  placeholder: z.string().min(1).max(60),
  button_label: z.string().min(1).max(40),
  consent_text: z.string().min(20, 'El texto de consentimiento debe ser claro').max(300),
});
```

### Validaciones del submit público (fan enviando email)

```typescript
const FanSubscribeSchema = z.object({
  email: z.string().email('Email inválido'),
  consent: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar para continuar' }) }),
  block_id: z.string().uuid(),
  artist_id: z.string().uuid(),
});
```

### Render público

```
┌────────────────────────────────────────────────────────────┐
│  Sumate a mi lista de fans                                 │
│                                                            │
│  ┌──────────────────────────────┐  ┌──────────────────┐  │
│  │  Tu email...                 │  │   Suscribirme    │  │
│  └──────────────────────────────┘  └──────────────────┘  │
│                                                            │
│  ☐ Acepto recibir novedades... [texto completo]           │
│                                                            │
└────────────────────────────────────────────────────────────┘

→ Estado success:
┌────────────────────────────────────────────────────────────┐
│  ✓  ¡Gracias! Estás en la lista.                           │
└────────────────────────────────────────────────────────────┘
```

### Render en editor

```
⠿  [📧]  "Sumate a mi lista de fans"
          Formulario de captura de email
          [ Editar ]  [ 👁 ]  [ 🗑 ]
```

### Comportamiento del submit

1. Validación client-side con Zod antes de enviar
2. Rate limit: máx 5 envíos por IP por 10 minutos (backend)
3. `POST /api/public/subscribers` → responde 201 o 200 (ya existía, no exponer)
4. El artista logueado no puede suscribirse a su propio formulario (same-user check por IP/sesión)
5. La respuesta no distingue "ya suscripto" de "nuevo" para evitar email enumeration

---

## Tabla resumen de bloques

| Bloque | Config fields | Validación clave | Providers | Fase |
|---|---|---|---|---|
| Link | url, title, icon_url?, description? | URL HTTPS válida, title ≤ 60 | N/A | MVP |
| Music | url, provider, embed_id, title? | URL de Spotify/SoundCloud | Spotify, SoundCloud | MVP |
| Video | url, provider, embed_id, title? | URL de YouTube/TikTok | YouTube, TikTok | MVP |
| Fan Capture | heading, placeholder, button_label, consent_text | consent_text ≥ 20 chars | N/A | MVP |
| Merch | store_id, product_ids, layout | store conectada y activa | Shopify | Fase 2 (Pro) |

---

## Límites por plan

| Plan | Máx bloques | Fan Capture | Merch |
|---|---|---|---|
| Free | 10 | ✓ | ✗ |
| Pro | Ilimitados | ✓ | ✓ |
| Pro+ | Ilimitados | ✓ | ✓ |

---

## Orden de construcción recomendado

1. **Link** — más simple, valida el pipeline completo: DB → API → editor → página pública → analytics
2. **Music** — agrega el parsing de URL y el iframe embed
3. **Video** — idéntico a Music, proveedor diferente
4. **Fan Capture** — agrega el formulario público, la tabla subscribers, rate limiting y validaciones GDPR
