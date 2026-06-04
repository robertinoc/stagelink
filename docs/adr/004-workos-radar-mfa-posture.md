# ADR-004: WorkOS Radar y postura de MFA para el launch

- **Estado**: Aceptado
- **Fecha**: 2026-06-04
- **Deciders**: Roberto

---

## Contexto

El Security Audit (riesgo P1) y el Final QA backlog (`LB-1`) dejaron pendiente
**confirmar la postura de abuso/challenge de WorkOS** y **decidir MFA** para el
acceso de administradores antes del tráfico público.

Restricciones relevantes:

- StageLink usa self-signup público con WorkOS AuthKit.
- El E2E autenticado (`e2e/auth/auth.setup.ts`) inicia sesión llenando
  email + password en la hosted UI de WorkOS y **no maneja un challenge
  TOTP/MFA**. Corre solo en `push` a `main` contra staging.
- El switch "Multi-factor auth" de WorkOS es **todo-o-nada**: exige MFA a
  **todos** los usuarios non-SSO, no admite un modo "opcional" por usuario.
- Passkeys ya está habilitado como método de autenticación (phishing-resistant).

## Decisión

### Radar (producción)

Se habilita WorkOS Radar en producción con esta configuración:

| Protección          | Modo                          | Razón                                                  |
| ------------------- | ----------------------------- | ------------------------------------------------------ |
| Bot detection       | **Enabled** (bloquea/desafía) | Núcleo anti-abuso del signup público                   |
| Brute force attack  | **Enabled**                   | Anti credential-stuffing en login                      |
| Impossible travel   | **Logging**                   | Falsos positivos con VPN/viaje; observar primero       |
| Repeat sign up      | **Logging**                   | `ensureProfile` ya maneja emails repetidos             |
| Stale account       | **Logging**                   | Señal de ciclo de vida, no de ataque                   |
| Unrecognized device | **Logging**                   | Evita fricción en el primer login de cada dispositivo  |
| SMS challenges      | **Disabled**                  | Costo + fricción; reservado por si hay spam de signups |

Postura: bloquear los wins claros (bots + brute force) y observar el resto en
modo Logging, promoviendo a Enabled según lo que muestre la pestaña Detections.

### MFA

- **MFA obligatoria global: diferida (Disabled).** Activarla exigiría MFA a
  todos los usuarios non-SSO (fricción en el launch) y rompería el E2E.
- **Cuentas de administrador**: se protegen con **Passkey** (ya habilitado y
  enrolado en las cuentas owner/admin), que es phishing-resistant y no afecta al
  resto de los usuarios.
- **User impersonation (dashboard de WorkOS): Disabled** — la app tiene su propio
  sistema de impersonation auditado; no se usa el de WorkOS.

### Endurecimiento de contraseñas

- Email + Password: rechazar contraseñas filtradas ("reject breached passwords")
  habilitado, además del mínimo de 10 caracteres y complejidad "safely
  unguessable" ya existentes.

## Trigger de revisión

Activar **MFA obligatoria** para administradores/operadores antes de:

- abrir a **tráfico público amplio**, o
- sumar **operadores externos** al panel `behind.stagelink.art`.

**Prerrequisito antes de activarla**: actualizar `e2e/auth/auth.setup.ts` para
resolver el challenge TOTP, o el E2E de staging se romperá.

## Consecuencias

- Postura anti-abuso activa en producción sin bloquear el signup legítimo.
- Las cuentas de mayor valor (admins) quedan protegidas con passkey desde el día
  uno, sin imponer fricción de MFA al resto.
- El gate `LB-1` queda cerrado con la decisión registrada y un trigger explícito,
  en lugar de quedar como una charla sin documentar.
