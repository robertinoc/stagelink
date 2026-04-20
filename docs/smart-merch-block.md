# Smart Merch Block

## Objetivo

T6-2 agrega un bloque real de merch inteligente para artistas:

- `type = "smart_merch"`
- proveedor v1: `Printful`
- render SSR en la página pública
- CTA externo por producto
- gating real por plan

La implementación evita carrito interno, checkout custom y sincronizaciones complejas.

## Decisión de producto y arquitectura

### Printful como proveedor v1

Printful funciona bien como fuente de verdad del catálogo de productos sincronizados.

### Por qué el CTA no va directo a un checkout interno

Printful no expone una experiencia de storefront público equivalente a Shopify Storefront.
Por eso, en esta v1:

- StageLink usa Printful para leer productos reales
- cada producto seleccionado guarda una `purchaseUrl` externa
- la compra final ocurre fuera de StageLink

Esto mantiene la feature honesta y usable sin inventar un checkout parcial.

## Modelo del bloque

El bloque vive dentro del motor de bloques existente:

- `type = "smart_merch"`

Config principal:

- `provider`
- `headline`
- `subtitle`
- `displayMode`
- `sourceMode`
- `selectedProducts`
- `maxItems`
- `ctaLabel`

### v1: source mode

La v1 soporta solo:

- `selected_products`

No hay collections en esta etapa.

### selectedProducts

Cada selección incluye:

- `productId`
- `purchaseUrl`

`productId` se valida contra Printful desde backend.
`purchaseUrl` es la URL externa real de compra que verá el fan.

## Modelo de conexión por artista

Se persiste una entidad dedicada:

- `MerchProviderConnection`

Campos:

- `artistId`
- `provider`
- `apiToken`
- `storeId`
- `storeName`
- `isConnected`
- `createdAt`
- `updatedAt`

Regla:

- un artista tiene como máximo una conexión de merch activa en esta v1

El bloque no guarda secretos.

## Provider layer

Se agregó una capa provider-aware mínima:

- `MerchProviderAdapter`
- `PrintfulProviderService`

Responsabilidades del provider:

- validar token y store
- listar productos disponibles
- obtener productos por ID

## Endpoints creados

### Backend privado

- `GET /api/artists/:artistId/merch`
- `POST /api/artists/:artistId/merch/validate`
- `PATCH /api/artists/:artistId/merch`
- `GET /api/artists/:artistId/merch/products`

### Frontend proxy

- `/api/artists/[artistId]/merch`
- `/api/artists/[artistId]/merch/validate`
- `/api/artists/[artistId]/merch/products`

## Qué expone públicamente el bloque

La página pública recibe solo una shape saneada:

- `id`
- `title`
- `description`
- `imageUrl`
- `priceAmount`
- `currencyCode`
- `availableForSale`
- `productUrl`

Nunca se exponen:

- `apiToken`
- config sensible del provider

## Feature gating

Capability nueva:

- `smart_merch`

Política actual:

- disponible en `Pro+`

Enforcement:

- backend:
  - `MerchService`
  - `BlocksService`
  - `PublicPagesService`
- frontend:
  - Settings muestra lock/upsell
  - `My Page` oculta el bloque si no hay acceso

## Render público SSR

El bloque público:

- se resuelve server-side
- trae productos saneados desde backend
- funciona en `grid` o `list`
- muestra imagen, nombre, precio si existe y CTA externo
- no rompe la página si el provider falla

### Cache corta

La resolución pública usa cache corta en memoria del backend:

- TTL aproximado: 60s

Objetivo:

- bajar latencia
- amortiguar errores transitorios de Printful
- conservar SSR simple

## Seguridad

Reglas aplicadas:

1. el token de Printful solo vive en backend y DB
2. el frontend público nunca ve secretos
3. membership real por artista para configurar
4. gating real por `smart_merch`
5. validación backend de productos seleccionados
6. no mezclar conexión o catálogo entre tenants
7. no loggear secretos

## Limitaciones actuales

- solo `Printful` implementado
- `Printify` todavía no implementado
- no hay selector visual con búsqueda/paginación avanzada
- no hay collections
- no hay checkout interno
- `purchaseUrl` se define manualmente por producto
- el token todavía no está cifrado en reposo

## Cómo sumar Printify después

1. crear `PrintifyProviderService`
2. implementar `MerchProviderAdapter`
3. extender el resolver de provider en `MerchService`
4. agregar validación y fetch de productos de Printify
5. habilitar `provider = "printify"` en la UI si se decide publicar

No hace falta rehacer:

- modelo del bloque
- shape pública
- gating
- integración SSR

## Próximos pasos recomendados

- selector de productos con búsqueda y paginación
- preview más rico en el editor
- soporte real para `Printify`
- analytics de clics de compra por producto

### Seguridad de credenciales

El `apiToken` del provider ahora se cifra en reposo a nivel de aplicación antes de persistirse en la base de datos,
usando `SECRETS_ENCRYPTION_KEY`, y solo se desencripta en el backend al momento de invocar al provider.

La v1 evita exponer el secreto al frontend público y ya reduce el blast radius de un dump de base respecto a texto plano.
Como siguiente hardening, todavía conviene evaluar rotación de claves y/o backing con KMS si el módulo de merch crece.
