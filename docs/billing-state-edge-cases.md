# Billing State Edge Cases

## Objetivo

T6-6 endurece el manejo de billing para que StageLink resuelva acceso y UX de forma consistente ante estados transitorios o ambiguos de Stripe.

Cadena de responsabilidad:

1. Stripe raw subscription status
2. `Subscription.status` persistido internamente
3. `effectiveBillingState`
4. `effectivePlan`
5. feature gating / billing UI

La app no gatea por redirects de checkout ni por strings crudos de Stripe repartidos por el código.

## Estados considerados

### Stripe raw / persistidos

- `inactive`
- `active`
- `trialing`
- `past_due`
- `unpaid`
- `incomplete`
- `incomplete_expired`
- `canceled`

`Subscription.status` mantiene estos estados casi 1:1, salvo `paused` de Stripe que se normaliza a `inactive`.

## Effective billing state

StageLink expone un estado de producto/UX más claro:

- `free`
- `active`
- `trialing`
- `canceling`
- `canceled`
- `payment_issue`
- `pending_checkout`
- `syncing`

## Reglas de effective plan

La resolución vive en `packages/types/src/billing.ts`.

### Dan acceso premium

- `active`
- `trialing`
- `past_due` si `currentPeriodEnd` sigue en el futuro
- `canceled` si `currentPeriodEnd` sigue en el futuro

### No dan acceso premium

- `inactive`
- `incomplete`
- `incomplete_expired`
- `unpaid`
- `canceled` sin período vigente

## Política por edge case

### Checkout success redirect, webhook no llegó

- El redirect no habilita premium por sí mismo.
- La UI muestra estado conservador de confirmación pendiente.
- Si el webhook todavía no sincronizó, `billingSyncPending`/`syncing` mantiene el copy honesto.

### Checkout cancelado

- No cambia `effectivePlan`.
- La UI puede mostrar feedback de cancelación, pero el estado real de billing no se toca.

### `incomplete`

- No otorga premium.
- `effectiveBillingState = pending_checkout`

### `incomplete_expired`

- No otorga premium.
- `effectiveBillingState = payment_issue`

### `trialing`

- Otorga premium.
- `effectiveBillingState = trialing`

### `past_due`

- Si el período vigente todavía no terminó: mantiene acceso premium.
- Si no hay período vigente claro: cae a Free.
- `effectiveBillingState = payment_issue`

### `unpaid`

- Fallback conservador: no otorga premium.
- `effectiveBillingState = payment_issue`

### `cancel_at_period_end = true`

- Si la suscripción sigue activa/trialing y el período no terminó, mantiene acceso premium.
- `effectiveBillingState = canceling`

### Cancelación inmediata / deleted

- Si no queda período vigente, cae a Free.
- Si todavía existe `currentPeriodEnd` en el futuro, mantiene acceso hasta esa fecha.

### Customer sin subscription activa

- No otorga premium solo por tener `stripeCustomerId`.
- `refresh` reconcilia el registro y vuelve a `free/inactive` si no hay suscripción real.

### Datos legacy o parciales

- Fallback conservador.
- Nunca habilitar premium si no hay respaldo suficiente.

## Webhooks, idempotencia y ordering

### Idempotencia

- Se mantiene idempotencia por `stripe_event_id` en `stripe_webhook_events`.

### Eventos fuera de orden

- `subscriptions.last_stripe_event_at` guarda el timestamp del último evento Stripe aplicado.
- Si llega un evento más viejo que el último aplicado, se registra pero no pisa el estado actual.

Esto no busca “ordering perfecto” de Stripe; solo evita degradaciones obvias por eventos viejos.

## Checkout / portal / refresh

### Checkout

- `checkout.session.completed` guarda referencias Stripe y un estado conservador (`incomplete`) si todavía no hay confirmación de suscripción final.
- Si ya existía acceso activo/trialing, no se degrada por un checkout intermedio.

### Portal

- El portal sigue usando Stripe como source of truth.
- La vuelta del portal no cambia localmente el plan por sí sola.
- `refresh` o webhook sincronizan el estado real.

### Refresh manual

- `POST /billing/:artistId/refresh` consulta Stripe directamente.
- Si ya no existe una suscripción activa para ese customer, StageLink vuelve el registro a `free/inactive` sin borrar el `stripeCustomerId`.

## Payload para frontend

`BillingUiSummary` ahora expone:

- `effectivePlan`
- `billingPlan`
- `subscriptionStatus`
- `effectiveBillingState`
- `billingState` (alias de compatibilidad)
- `billingSyncPending`
- `billingMessages`
- `cancelAtPeriodEnd`
- `currentPeriodEnd`

La UI usa estos campos para mostrar estado honesto sin interpretar strings crudos de Stripe.

## Impacto en feature gating

`BillingEntitlementsService` sigue leyendo `buildTenantEntitlements(...)`.

La regla importante es:

- raw/persisted billing state
  -> `resolveEffectivePlan(...)`
  -> entitlements
  -> `assertFeatureAccess(...)`

No se gatea por redirects, banners ni suposiciones del frontend.

## Limitaciones actuales

- No hay dunning ni recovery automático de pagos.
- `pending_checkout` se resuelve por estado sincronizado + UX conservadora, no por una máquina de estados aparte.
- No existe soporte de ordering perfecto entre todos los eventos Stripe; solo mitigación razonable por timestamp.

## Próximos pasos recomendados

1. Agregar smoke tests remotos para `past_due`, `cancel_at_period_end` y `unpaid`.
2. Persistir `checkout session id` si más adelante se quiere una UX todavía más fina para returns.
3. Agregar telemetry/audit para refresh manual y cambios de effective access.
