# Shopify Storefront Integration

## Objetivo

T6-1 agrega una integración real y mínima con Shopify Storefront API para que un artista pueda:

- conectar su tienda Shopify
- validar credenciales desde StageLink
- seleccionar qué merch mostrar
- renderizar productos reales en su página pública
- delegar la compra final a Shopify

La implementación prioriza una base segura, SSR-friendly y mantenible sin sumar Admin API, carrito interno ni sincronización compleja.

## Modelo de conexión por artista

Se persistió una entidad dedicada:

- `ShopifyConnection`

Asociación:

- `artistId` es único
- cada artista puede tener como máximo una conexión Shopify activa

Campos principales:

- `artistId`
- `storeDomain`
- `storefrontToken`
- `storeName`
- `isConnected`
- `selectionMode`
- `collectionHandle`
- `productHandles`
- `createdAt`
- `updatedAt`

### Selection mode

La selección de merch soporta dos modos:

- `collection`
- `products`

#### `collection`

StageLink consulta una colección por handle y muestra una cantidad acotada de productos.

#### `products`

StageLink consulta productos puntuales por handle.

## Datos persistidos

Persistimos por artista:

- dominio de la tienda Shopify
- Storefront token
- nombre visible de la tienda
- modo de selección
- handle de colección o lista de handles de productos

No persistimos:

- catálogo completo
- inventario sincronizado
- precios cacheados de largo plazo
- checkout state
- órdenes o fulfillment

### Cache SSR

La selección pública de merch usa una cache corta en memoria del backend:

- TTL aproximado: 60 segundos
- scope: por artista + selección + límite de productos

Objetivo:

- reducir latencia variable contra Shopify
- evitar que la sección de merch desaparezca ante fallos transitorios
- mantener una base simple sin jobs ni persistencia adicional

## Endpoints creados

### Privados

- `GET /api/artists/:artistId/shopify`
- `POST /api/artists/:artistId/shopify/validate`
- `PATCH /api/artists/:artistId/shopify`

Uso:

- leer configuración actual
- validar dominio/token antes de guardar
- guardar o actualizar la conexión

### Públicos

No se expuso un endpoint público nuevo dedicado.  
La selección saneada se resuelve dentro del flujo SSR de la página pública a través de:

- `PublicPagesService`

Eso permite renderizar merch sin exponer secretos ni agregar una superficie pública extra innecesaria.

## Storefront API queries usadas

La integración usa GraphQL Storefront API contra:

- `https://{storeDomain}/api/2026-01/graphql.json`

Header:

- `X-Shopify-Storefront-Access-Token`

### Query de validación

Se consulta información mínima del shop para verificar:

- token válido
- tienda accesible
- nombre del store

### Query de colección

Se consulta:

- `collection(handle: ...)`
- `title`
- `products(first: N)`

### Query de productos

Se consulta por handle con aliases dinámicos:

- `product(handle: ...)`

Campos públicos mínimos usados:

- `id`
- `title`
- `handle`
- `featuredImage`
- `priceRange.minVariantPrice`
- `onlineStoreUrl`
- `availableForSale`

## Qué se expone públicamente y qué no

### Público

Solo exponemos datos saneados necesarios para render:

- nombre del producto
- imagen
- precio
- moneda
- disponibilidad básica
- URL pública del producto en Shopify

### Privado

Nunca exponemos en frontend público:

- Storefront token
- configuración completa del shop
- metadata sensible de la conexión

En la UI privada tampoco devolvemos el token; solo:

- `hasStorefrontToken`
- estado de conexión
- preview de productos

## Feature gating aplicado

Capability:

- `shopify_integration`

Política actual:

- solo artistas con esa feature pueden:
  - conectar Shopify
  - validar credenciales
  - guardar configuración
  - crear o usar el bloque `shopify_store`
  - renderizar merch real en su página pública

Enforcement:

- backend:
  - `ShopifyService`
  - `BlocksService`
  - `PublicPagesService` vía `ShopifyService.getPublicStoreSelection(...)`
- frontend:
  - lock/upsell en dashboard settings
  - ocultamiento del bloque en el page builder cuando no hay acceso

## Render público del bloque de merch

Se agregó el bloque:

- `shopify_store`

Renderiza:

- imagen del producto
- título
- precio
- estado de disponibilidad
- CTA a Shopify

Características:

- SSR-compatible
- responsive
- integrado en la página pública del artista
- sin carrito interno

### Copy localizado del bloque

El bloque `shopify_store` soporta copy localizado por locale para:

- `headline`
- `description`
- `ctaLabel`

Política:

- el copy base del bloque sigue siendo el fallback
- las traducciones adicionales se guardan en `localizedContent.shopifyStore`
- el catálogo de Shopify sigue siendo único; solo cambia la capa editorial del bloque

El checkout ocurre completamente en Shopify a través de `onlineStoreUrl`.

## Seguridad

La integración sigue estas reglas:

1. el Storefront token solo vive en backend y DB
2. el frontend público nunca recibe secretos
3. cada operación privada valida membership real del artista
4. el backend valida `shopify_integration`
5. no se mezclan tiendas entre tenants porque la conexión se resuelve por `artistId`

### Limitación actual

En esta v1, el `storefrontToken` se guarda en la base de datos sin cifrado en reposo.
No se expone al frontend público y no se devuelve en la UI privada, pero sigue siendo una mejora recomendada para una siguiente iteración de seguridad. 6. no se loggea el token

### Nota sobre secretos

En esta v1 el Storefront token se persiste en DB tal como llega, pero nunca se expone.  
Si más adelante queremos endurecerlo más, el próximo paso natural es cifrado en reposo.

## Edge cases cubiertos

- dominio inválido
- token inválido
- tienda inaccesible
- colección inexistente
- productos inexistentes
- selección vacía
- feature no disponible
- errores temporales de Shopify
- tienda conectada pero sin merch válida para mostrar

Fallbacks actuales:

- si no hay feature o no hay conexión válida, el bloque se omite del render público
- si la selección guardada no devuelve productos, no se renderiza merch

## Limitaciones actuales

- no hay selector visual de catálogo; la selección es por handles
- no hay sincronización automática de catálogo
- no hay checkout embebido
- no hay carrito dentro de StageLink
- no hay webhooks Shopify
- no hay cifrado en reposo del token todavía
- no hay analytics de e-commerce avanzada

## Cómo extender después

Siguientes extensiones razonables:

1. selector visual de productos/colecciones desde el dashboard
2. caché corta de respuestas Shopify
3. cifrado en reposo del Storefront token
4. badges de “sold out” o variantes más ricas
5. analytics básica de clicks en productos
6. soporte para múltiples bloques de merch con distintas colecciones

## Próximos pasos recomendados

1. agregar test de integración backend con respuestas mockeadas de Shopify
2. endurecer almacenamiento del token
3. mejorar UX del page builder para merch
4. evaluar un layout público de merch más editorial
5. medir clicks hacia Shopify como evento analítico propio
