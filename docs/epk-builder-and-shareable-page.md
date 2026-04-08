# EPK Builder and Shareable Page (T6-3)

## Objetivo

T6-3 agrega un EPK builder real dentro del dashboard de StageLink para que un artista pueda:

- editar un press kit dentro de `/dashboard/epk`
- reutilizar datos existentes del perfil cuando conviene
- sobrescribir contenido para contexto press
- publicar o despublicar el EPK
- compartir una URL pública profesional
- abrir una variante print-friendly pensada para “Save as PDF”

La solución evita un CMS complejo, no crea un sistema paralelo al perfil del artista y deja
base clara para crecer después.

## Modelo elegido

Se introduce una entidad `Epk` 1:1 con `Artist`.

Campos principales:

- `artistId`
- `isPublished`
- `headline`
- `shortBio`
- `fullBio`
- `pressQuote`
- `bookingEmail`
- `managementContact`
- `pressContact`
- `heroImageUrl`
- `galleryImageUrls[]`
- `featuredMedia[]`
- `featuredLinks[]`
- `highlights[]`
- `riderInfo`
- `techRequirements`
- `location`
- `availabilityNotes`

### Por qué este modelo

- mantiene una capa específica de EPK separada del perfil del artista
- evita contaminar `artists` con campos solo de press kit
- no fuerza un editor block-based nuevo
- permite overrides explícitos donde el contexto press los necesita
- deja una base simple de draft/publicación/share/export

## Qué hereda del artista

El editor devuelve un `inherited` snapshot con defaults reutilizables:

- `displayName`
- `username`
- `avatarUrl`
- `coverUrl`
- `bio`
- `websiteUrl`
- redes principales
- `contactEmail`
- categoría

## Qué es propio del EPK

Los siguientes campos son específicos del EPK y no deben interpretarse como “hard linked”
al perfil base:

- `headline`
- `fullBio`
- `pressQuote`
- `bookingEmail`
- `managementContact`
- `pressContact`
- `heroImageUrl`
- `galleryImageUrls`
- `featuredMedia`
- `featuredLinks`
- `highlights`
- `riderInfo`
- `techRequirements`
- `location`
- `availabilityNotes`

## Política de herencia y overrides

### Vista privada del editor

El dashboard muestra:

- datos heredados para contexto
- quick actions para reutilizar cover/avatar/socials/smart links
- campos explícitos del EPK que el usuario controla y guarda

### Vista pública

La página pública del EPK usa:

- `heroImageUrl` del EPK si existe
- si no existe, cae a `artist.coverUrl`, luego `artist.avatarUrl`
- `shortBio` del EPK si existe
- si no existe, cae a `artist.bio`
- `featuredLinks` del EPK si existen
- si están vacíos, cae a website/socials del artista

### Consolidación al publicar

Al publicar, el backend valida que el EPK tenga el mínimo necesario para un documento
shareable y además consolida algunos fallbacks dentro del propio registro del EPK:

- `shortBio` se completa desde `artist.bio` si seguía vacío
- `heroImageUrl` se completa desde `coverUrl` o `avatarUrl` si seguía vacío
- `featuredLinks` se completa desde website/socials si seguía vacío

Esto reduce la deriva entre “draft apoyado en defaults del profile” y “EPK ya publicado”.

### Contactos públicos

Los contactos **no** se heredan implícitamente en la capa pública.
Solo se publica lo que el EPK tenga guardado explícitamente en:

- `bookingEmail`
- `managementContact`
- `pressContact`

Esto evita exponer accidentalmente contactos privados.

## Feature gate

El EPK usa la feature key:

- `epk_builder`

En la matriz actual de planes:

- `free`: no incluido
- `pro`: incluido
- `pro_plus`: incluido

### Enforcement backend

La edición y publicación llaman a:

- `BillingEntitlementsService.assertFeatureAccess(artistId, 'epk_builder')`

La capa pública verifica:

- que el artista tenga acceso a `epk_builder`
- que exista `Epk`
- que `isPublished = true`

Si no, responde 404.

## Endpoints

### Privados

- `GET /api/artists/:artistId/epk`
  - devuelve `epk` + `inherited`
  - crea draft vacío lazily si no existe

- `PATCH /api/artists/:artistId/epk`
  - actualiza contenido del EPK

- `POST /api/artists/:artistId/epk/publish`
  - publica el EPK

- `POST /api/artists/:artistId/epk/unpublish`
  - despublica el EPK

### Público

- `GET /api/public/epk/by-username/:username`
  - devuelve la vista pública saneada del EPK
  - solo responde si el EPK está publicado y la feature existe

## Rutas frontend

### Dashboard

- `/{locale}/dashboard/epk`

### Públicas

- `/p/[username]/epk`
- `/p/[username]/epk/print`

## Estrategia de share y export

No se genera PDF binario desde backend.

La estrategia de export de esta fase es:

- una página pública shareable SSR
- una variante print-friendly separada
- el usuario usa el diálogo nativo del browser para `Save as PDF`

### Por qué esta estrategia

- es mucho más mantenible para esta etapa
- evita colas/jobs/Chromium server-side
- sirve bien para bookers, venues y prensa
- deja abierta una futura capa de PDF server-side si después hace falta

## Assets y media

Se agregó soporte para:

- `epk_image` como nuevo `AssetKind`
- listado básico de assets subidos del artista
- selección de hero y gallery desde avatar/cover/epk_image

No se implementa todavía una media library avanzada.

## Publicación

El flujo es simple:

1. el EPK puede existir en draft
2. el usuario guarda cambios
3. el usuario publica
4. el backend valida mínimos de publicación y consolida fallbacks esenciales
5. la ruta pública empieza a resolver
6. el usuario puede despublicar
7. la ruta pública vuelve a 404

La publicación del EPK es independiente de la página pública principal.

## SEO / metadata

La página pública del EPK implementa metadata razonable:

- title con nombre del artista + EPK
- description a partir de `headline`, `shortBio` o `bio`
- `og:image` si hay hero image
- SSR sin auth

La print view se marca como noindex.

## Limitaciones actuales

Esta fase **no** implementa todavía:

- múltiples templates visuales
- editor visual block-based del EPK
- PDF server-side
- access control por password
- analytics profundas del EPK
- comentarios o reviewer workflow
- zip/export de assets
- selección avanzada desde una media library compleja

## Próximos pasos recomendados

1. agregar selector más rico de assets EPK si el uso real lo pide
2. sumar una segunda plantilla visual del EPK
3. agregar server-side PDF export solo si el print flow no alcanza
4. evaluar analytics específicas del EPK si aparece demanda real

## Validación / QA checklist

### Dashboard

- [ ] `Free` ve lock state con CTA a billing
- [ ] `Pro` puede entrar a `/dashboard/epk`
- [ ] el editor prellena correctamente el snapshot heredado
- [ ] guardar cambios persiste headline/bios/contacts/media/highlights
- [ ] publicar desde un EPK incompleto devuelve error claro
- [ ] publicar cambia el badge a `Published`
- [ ] despublicar vuelve a `Draft`
- [ ] links “Open public EPK” y “Open print view” funcionan

### Público

- [ ] `/p/{username}/epk` devuelve 404 si está draft
- [ ] `/p/{username}/epk` renderiza contenido publicado
- [ ] `/p/{username}/epk/print` renderiza sin UI extra innecesaria
- [ ] metadata carga title/description/og-image razonables

### Datos / privacidad

- [ ] no aparecen contactos no configurados explícitamente
- [ ] `shortBio` cae correctamente a `artist.bio` si no hay override
- [ ] `heroImageUrl` cae correctamente a cover/avatar si no hay override
- [ ] featured links caen a socials/website si el EPK no define ninguno

### Assets

- [ ] subir `epk_image` funciona
- [ ] hero image se puede seleccionar desde avatar/cover/epk_image
- [ ] gallery acepta hasta 6 imágenes

### Gates

- [ ] backend responde 403 en endpoints privados si falta `epk_builder`
- [ ] capa pública responde 404 si el plan no incluye la feature
