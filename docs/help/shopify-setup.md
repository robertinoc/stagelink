# Cómo conectar tu tienda Shopify a StageLink

Esta guía te explica cómo obtener las credenciales de Shopify y conectar tu tienda para mostrar tu merch en tu página pública de StageLink.

---

## Lo que necesitás

- Una tienda Shopify (puede ser plan Basic o superior)
- Acceso al admin de tu tienda (`admin.shopify.com/store/tu-tienda`)

---

## Paso 1 — Habilitar el canal Headless en Shopify

El canal Headless es la forma oficial de Shopify para conectar tiendas externas a su Storefront API. Es gratuito.

1. Abrí el admin de tu tienda Shopify
2. En el sidebar izquierdo → **Canales de ventas** → click en el **"+"**
3. Buscá **"Headless"** y hacé click en **Agregar**

> Si ya tenés el canal Headless instalado, saltá directamente al Paso 2.

---

## Paso 2 — Crear una tienda externa

1. Dentro del canal **Headless**, hacé click en **"Crear tienda externa"**
2. Poné un nombre (ej: `StageLink`) y confirmá

---

## Paso 3 — Obtener el token de la API Storefront

1. Dentro de la tienda externa que acabás de crear → **"Gestionar"** al lado de **API Storefront**
2. En la sección **"Token de acceso público"**, copiá el valor que aparece en el campo de texto

> Este token es una cadena hexadecimal (ej: `c722f6682cda1ecd2828668d2e306dec`).
> Es seguro usarlo — está diseñado para acceso público de lectura.

---

## Paso 4 — Obtener el dominio de tu tienda

El dominio de tu tienda tiene este formato:

```
tu-tienda.myshopify.com
```

Lo podés ver en la URL del admin de Shopify o en la barra de direcciones cuando estás en el admin.

**Importante:** usá el dominio `.myshopify.com`, no el dominio personalizado que puedas tener.

---

## Paso 5 — Conectar en StageLink

1. En tu dashboard de StageLink → **Configuración** → **Shopify**
2. Ingresá:
   - **Dominio de la tienda**: `tu-tienda.myshopify.com`
   - **Storefront token**: el token copiado en el Paso 3
3. Hacé click en **Conectar**

---

## Paso 6 — Configurar qué productos mostrar

Una vez conectada la tienda, podés elegir cómo mostrar tu merch:

- **Por colección**: ingresá el handle de una colección de Shopify (ej: `camisetas`). StageLink va a mostrar los productos de esa colección.
- **Por productos individuales**: ingresá los handles de productos específicos separados por comas (ej: `camiseta-negra, gorra-blanca`).

> **¿Dónde encuentro el handle?** En el admin de Shopify → Productos → click en el producto → al final de la página, en la sección SEO, aparece el "URL y vista previa". El handle es la última parte de la URL (ej: en `/products/camiseta-negra`, el handle es `camiseta-negra`).

---

## Preguntas frecuentes

**¿Necesito el plan Shopify Plus?**
No. El canal Headless y la Storefront API están disponibles en todos los planes de Shopify.

**¿StageLink puede procesar pagos?**
No. Cuando alguien hace click en un producto, es redirigido directamente a tu tienda Shopify para completar la compra. StageLink solo muestra el catálogo.

**¿Se sincronizan los precios e inventario en tiempo real?**
Los precios y disponibilidad se actualizan cada 60 segundos aproximadamente. No hay sincronización en tiempo real permanente.

**¿Puedo desconectar la tienda?**
Sí. En **Configuración → Shopify**, hacé click en **Desconectar**. Si querés volver a conectar, necesitás ingresar el dominio y el token de nuevo.

**¿El token de acceso público es seguro?**
Sí. El token de acceso público de la Storefront API solo permite leer catálogo público (productos, colecciones, precios). No permite crear órdenes, ver datos de clientes ni modificar nada en tu tienda.
