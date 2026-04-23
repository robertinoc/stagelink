# Multi-language Pages And Translation Infra

## Objetivo

T6-5 agrega soporte real para:

1. UI translations del producto con `next-intl`
2. content translations del artista y la página pública

La implementación prioriza una base mínima, SSR-friendly y extensible sin montar un CMS multilenguaje enterprise.

## Locales soportados

- `en`
- `es`

Fuente compartida:

- `packages/types/src/i18n.ts`

## Routing

### App shell

Se mantiene el routing existente con locale explícito:

- `/{locale}/dashboard/...`
- `/{locale}/pricing`
- `/{locale}/login`

### Página pública del artista

La página pública localizada vive en:

- `/{locale}/{username}`

Compatibilidad:

- `/{username}` sigue funcionando, pero hace redirect al locale detectado:
  - `/{username}` -> `/{locale}/{username}`
- `/p/{username}` queda como ruta interna/compatibilidad y también redirige

### EPK público

El EPK público sigue expuesto en:

- `/p/{username}/epk`
- `/p/{username}/epk/print`

Pero ahora puede resolver textos por `locale` vía query interna al backend.

## Separación entre UI i18n y content i18n

### UI i18n

Usa `next-intl` y archivos:

- `apps/web/src/i18n/messages/en.json`
- `apps/web/src/i18n/messages/es.json`

Aplica a:

- navegación
- dashboard shell
- labels del sistema
- billing
- public page labels
- editor de profile

### Content i18n

Se persiste por entidad y se resuelve con fallback explícito.

Entidades cubiertas:

- `Artist`
- `Epk`
- `Block` (solo contenido textual simple donde ya tenía sentido)

## Modelo de datos elegido

Se eligió JSON por entidad en vez de tabla separada.

### Artist

- campo base legacy:
  - `displayName`
  - `bio`
  - `contactEmail`
  - `seoTitle`
  - `seoDescription`
  - `tags`
- nuevo:
  - `translations Json`

Shape esperada:

```json
{
  "displayName": { "es": "..." },
  "bio": { "es": "..." },
  "seoTitle": { "es": "..." },
  "seoDescription": { "es": "..." }
}
```

### Epk

- campos base legacy permanecen
- nuevo:
  - `translations Json`

Campos textuales soportados:

- `headline`
- `shortBio`
- `fullBio`
- `pressQuote`
- `riderInfo`
- `techRequirements`
- `availabilityNotes`

### Block

- se agrega:
  - `localized_content Json`

Uso actual:

- `title`
- `email_capture` texts
- `links` title e item labels

Esto deja documentado el patrón para extenderlo a más bloques después.

### Base locale

`Artist` y `Epk` ahora guardan:

- `baseLocale`

Este campo define en qué idioma están escritos los campos base legacy de cada documento.

Ejemplos:

- un perfil puede tener `baseLocale = es`
- un EPK puede tener `baseLocale = en`

Las traducciones adicionales viven en `translations`, pero el contenido base sigue estando en los campos legacy principales.

## Política de fallback

El fallback sigue siendo conservador y nunca deja la página vacía si existe contenido base, pero ahora se diferencia entre dos casos:

### Campos simples

Para campos localizados simples, donde una mezcla no rompe la UX:

1. locale solicitado
2. fallback a `en`
3. campo base legacy

Se usa:

- `resolveLocalizedText(...)`

### Documentos completos

Para superficies completas donde una mezcla de idiomas es confusa, como:

- página pública del artista
- EPK público
- EPK print view

la resolución ahora es por documento:

1. si el locale solicitado es el `baseLocale`, se renderiza todo el documento con los campos base
2. si el locale solicitado es adicional y está suficientemente completo, se renderiza todo el documento en ese locale
3. si ese locale está incompleto, se hace fallback a `baseLocale` para todo el documento

Se usa:

- `resolveDocumentLocale(...)`
- `resolveDocumentText(...)`

Helper central:

- `apps/api/src/common/utils/localized-content.util.ts`

## Feature gating

Feature:

- `multi_language_pages`

Política:

- todos pueden editar contenido base
- contenido real adicional en otros locales requiere acceso a `multi_language_pages`
- hoy esa feature está alineada con `Pro+`

Enforcement:

- backend:
  - `ArtistsService.update()` rechaza contenido extra por locale si falta la feature
- frontend:
  - profile editor muestra lock/upsell para locales adicionales

## Backend

### Lectura pública por locale

La API pública ya acepta `locale` explícito:

- `/api/public/pages/by-username/:username?locale=en|es`
- `/api/public/epk/by-username/:username?locale=en|es`

### Edición

Profile editor envía:

- campos base
- `translations`

El backend:

- sanitiza locales soportados
- descarta strings vacíos
- aplica gating
- persiste `baseLocale`

## Frontend

### Página pública SSR

La página pública localizada usa:

- `apps/web/src/app/[locale]/[username]/page.tsx`

La composición pública actual organiza el contenido en:

- hero del artista
- descriptor line (`category` + `secondaryCategories`)
- tags/descriptors públicos
- social icons
- links destacados desde bloques `links`
- featured media desde bloques `music_embed` / `video_embed`
- info adicional desde `bio` + bloques `text`
- CTA de booking desde `contactEmail`

Metadata:

- `title` y `description` por locale
- `alternates.languages` para `en` y `es`
- canonical por locale

### Editor de profile

El editor mantiene:

- contenido base editable por locale principal
- tabs para `en` / `es`
- fallback claro cuando falta traducción
- autocompletado de traducción opcional desde el contenido base

## Traducción automática opcional

Profile y EPK ahora pueden rellenar el locale secundario con una traducción automática
del contenido base.

Comportamiento:

- el resultado se inserta en el formulario
- el artista puede editar cualquier campo antes de guardar
- si la traducción automática no está configurada, el botón muestra error claro

Configuración:

- `OPENAI_API_KEY` en el frontend (`apps/web/.env.local` o entorno equivalente en Vercel)
- opcional: `OPENAI_TRANSLATION_MODEL`

La traducción automática está acotada a:

- `en -> es`
- `es -> en`

No reemplaza el fallback ni el guardado manual. Solo acelera el primer borrador del
contenido localizado.

- contenido base legacy
- `baseLocale`
- nueva sección `Localized content`

Permite editar por locale:

- artist name
- short bio
- SEO title
- SEO description

Además:

- deja elegir el idioma base del documento
- marca el locale base como tal
- deja copiar el contenido base al locale traducido como punto de partida

### Editor de EPK

El editor de EPK ahora expone una UX dedicada para `EN / ES`:

- tabs por locale
- idioma base explícito
- fallback note
- copy-from-base
- guardado de `epk.translations`

## SEO

Base SEO implementada:

- metadata por locale en página pública
- alternates/hreflang para `en` y `es`
- canonical alineado al route locale-prefixed

## Edge cases cubiertos

- locale inválido -> fallback a locale soportado/default
- traducción faltante -> fallback a `en` o campo base en campos simples
- traducción parcial en profile/EPK -> fallback coherente al `baseLocale` del documento
- tenant sin feature premium -> no puede guardar contenido extra por locale
- labels de UI faltantes -> quedan centralizadas en `next-intl`

## Limitaciones actuales

- no hay traducción automática
- no hay workflow editorial avanzado
- no todos los bloques tienen UI de edición multilenguaje todavía
- los `tags/descriptors` todavía no se traducen por locale
- featured media es manual-first: el artista controla qué destacar por orden de bloques
- los bloques `text` siguen siendo locale-agnostic por ahora
- featured links / media labels del EPK todavía no tienen traducción por locale
- elegir `baseLocale` correctamente sigue siendo importante para documentos legacy ya escritos antes de este cambio

## Cómo extender

Para agregar un nuevo campo textual:

1. agregarlo al JSON de traducciones de la entidad
2. sanitizarlo con `sanitizeTranslationFieldMap`
3. decidir si usa fallback por campo (`resolveLocalizedText`) o por documento (`resolveDocumentText`)
4. exponerlo en frontend editor si corresponde

Para agregar un nuevo locale:

1. sumarlo en `packages/types/src/i18n.ts`
2. agregar archivo de mensajes UI
3. agregar labels de locale en el editor
4. revisar reserved usernames y metadata alternates

## Próximos pasos recomendados

1. exponer edición localizada para bloques textuales en dashboard page builder
2. sumar un indicador de completitud por locale más explícito
3. agregar acción para copiar traducción desde IA o proveedor externo, opcional y controlada
4. sumar sitemap dinámico con páginas públicas localizadas
5. considerar selector de idioma visible en la página pública
