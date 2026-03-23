# ADR-003: Custom Domain — Soporte futuro (plan Pro+)

- **Estado**: Aceptado (implementación diferida)
- **Fecha**: 2026-03-23
- **Deciders**: Roberto

---

## Contexto

Los artistas con marca establecida quieren usar su propio dominio (`rocketband.com`) en lugar de `stagelink.io/rocketband`. Esta es una feature diferenciadora para planes pagos.

La implementación completa requiere:
- Verificación de propiedad del dominio (DNS TXT record)
- Emisión/renovación de certificados SSL
- Routing de requests por header `Host`
- UI de gestión de dominio

Complejidad estimada: ~1 sprint completo. No entra en MVP.

---

## Decisión

**Incluir la tabla `custom_domains` en el schema inicial. Diferir toda la lógica de resolución a Fase 2.**

La tabla existe pero estará vacía en MVP. Esto garantiza:
- No hay migración destructiva cuando se implemente
- Los endpoints de creación de artista pueden aceptar el campo sin procesarlo
- La documentación de la API no cambia

---

## Arquitectura planificada para Fase 2

```
Cloudflare DNS
  → Artista crea CNAME: rocketband.com → proxy.stagelink.io
  → StageLink verifica el CNAME (DNS lookup desde backend)

Cloudflare Worker (edge function)
  → Intercepta requests con Host != stagelink.io
  → Lookup: custom_domains WHERE domain = host AND verified_at IS NOT NULL
  → Cache del lookup (TTL: 5 min) para no ir a DB en cada request
  → Si encontrado: rewrite interno a origin con header X-Artist-Username
  → Si no encontrado: redirect a stagelink.io

SSL
  → Opción A: Cloudflare SSL-for-SaaS (Certificados por subdominio/dominio delegado)
    → Más simple, costo por certificado ~$0.10/mes
  → Opción B: Let's Encrypt via backend worker
    → Más control, más complejidad operativa
  → Recomendación: Cloudflare SSL-for-SaaS para Fase 2
```

---

## Flujo de resolución planificado

```
1. Artista configura en dashboard:
   → Ingresa su dominio: rocketband.com
   → POST /api/artists/:id/custom-domain { domain: 'rocketband.com' }
   → Se crea registro en custom_domains (verified_at: NULL)
   → Se muestra el CNAME a apuntar en su DNS

2. Verificación (async, puede tardar hasta 48hs):
   → Cron job cada 1h: verifica CNAME del dominio pendiente
   → Si CNAME apunta a proxy.stagelink.io → marca verified_at
   → Notifica al artista por email

3. SSL (una vez verificado):
   → Cloudflare SSL-for-SaaS: issue cert para el dominio
   → Guarda ssl_provisioned_at en DB

4. Resolución live:
   → Cloudflare Worker: Host header lookup → X-Artist-Username header
   → Vercel/Next.js: usa header para cargar artista correcto
   → Mismo pipeline de render que /[username]
```

---

## Consecuencias

**Por diferir:**
- No hay configuración de Cloudflare Workers en MVP (menos complejidad de deploy)
- No hay lógica de DNS checking ni cert management
- No hay UI de custom domain

**Por preparar el modelo ahora:**
- `custom_domains` tabla existente, vacía en MVP
- FK `artist_id` ya presente
- Campos `verified_at`, `ssl_provisioned_at`, `cloudflare_zone_id` ya en schema

---

## Variables de entorno a agregar en Fase 2

```
CLOUDFLARE_API_TOKEN=           # Para SSL-for-SaaS
CLOUDFLARE_ZONE_ID=             # Zona de stagelink.io
CUSTOM_DOMAIN_PROXY_TARGET=     # proxy.stagelink.io (Cloudflare)
```
