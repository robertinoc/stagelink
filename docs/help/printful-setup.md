# Cómo conectar Printful a StageLink

Esta guía te explica cómo obtener tu API token de Printful y conectarlo a StageLink para mostrar tus productos de print-on-demand en tu página pública.

---

## Lo que necesitás

- Una cuenta en [Printful](https://www.printful.com)
- Productos ya creados en Printful ("Mis productos")

---

## Paso 1 — Ir al portal de desarrolladores de Printful

Abrí esta URL directamente en el browser:

```
developers.printful.com/tokens
```

> Si no estás logueado en Printful, te va a pedir que inicies sesión primero.

---

## Paso 2 — Crear un nuevo token

1. Hacé click en **"+ Add new token"**
2. Poné un nombre descriptivo (ej: `StageLink`)
3. En la sección de **scopes (permisos)**, seleccioná únicamente:
   - `stores` → **read**
   - `sync_products` → **read** (o "Catalog" / "Products" según la versión de la UI)
4. Confirmá la creación

> StageLink solo necesita permisos de **lectura**. No requiere acceso a órdenes, fulfillment, webhooks ni ningún permiso de escritura.

---

## Paso 3 — Copiar el token

Inmediatamente después de crear el token, Printful te muestra el valor completo **una sola vez**.

**Copialo en ese momento** — una vez que cerrás esa pantalla, no podés volver a ver el token. Si lo perdés, tenés que crear uno nuevo.

---

## Paso 4 — Conectar en StageLink

1. En tu dashboard de StageLink → **Configuración** → **Printful**
2. Pegá el token copiado en el campo correspondiente
3. Hacé click en **Conectar**

StageLink va a verificar la conexión y mostrar el nombre de tu tienda Printful si todo está correcto.

---

## Paso 5 — Configurar qué productos mostrar

Una vez conectado, podés elegir qué productos de Printful aparecen en tu página pública.

Los productos se sincronizan desde tu catálogo de **"Mis productos"** en Printful.

---

## Preguntas frecuentes

**¿Necesito una tienda Printful conectada a algún marketplace?**
No necesariamente. Printful funciona de forma standalone — podés tener productos en "Mis productos" sin necesitar una tienda de Shopify, Etsy o similar conectada.

**¿Perdí mi token, qué hago?**
Volvé a `developers.printful.com/tokens`, hacé click en tu token existente, y creá uno nuevo desde ahí. El token anterior deja de funcionar una vez que lo reemplazás.

**¿StageLink procesa los pagos de Printful?**
No. Cuando alguien hace click en un producto de Printful, es redirigido para completar la compra. StageLink solo muestra el catálogo.

**¿Puedo desconectar Printful?**
Sí. En **Configuración → Printful**, hacé click en **Desconectar**. Para volver a conectar, necesitás ingresar un token válido de nuevo.

**¿Se actualizan los productos automáticamente?**
Sí. Los productos se leen directamente desde tu cuenta de Printful cada vez que alguien visita tu página pública.
