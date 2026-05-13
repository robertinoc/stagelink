# StageLink - Security Audit E2.11: File Upload / Asset Security

Fecha: 2026-05-13

Estado: cerrado con fixes aplicados.

## Alcance

E2.11 revisa la seguridad de uploads y assets:

| Tarea                         | Estado               | Resultado                                                                                             |
| ----------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------- |
| T2.11.1 MIME validation       | Cerrado con fix      | MIME permitido server-side y `confirmUpload` ahora exige `Content-Type` exacto reportado por storage. |
| T2.11.2 File size             | Cerrado con fix      | Size min/max queda explícito por kind; uploads vacíos no pueden crear intents ni confirmarse.         |
| T2.11.3 Signed URLs           | Cerrado              | Presigned PUT expira en 5 minutos y no expone credenciales AWS/R2.                                    |
| T2.11.4 Public/private access | Cerrado con decisión | Assets artísticos son públicos por diseño; no guardar documentos privados en este bucket.             |
| T2.11.5 Malicious files       | Cerrado con warning  | Se bloquea SVG y tipos no imagen; queda backlog de magic-byte/AV scanning si se amplían formatos.     |
| T2.11.6 Asset ownership       | Cerrado              | Intent, confirm y list validan membership/ownership server-side.                                      |

## Fixes aplicados

### Extensiones canónicas por MIME

Antes, el `objectKey` usaba la extensión del `originalFilename`. Aunque el
backend validaba MIME y el path completo seguía siendo generado server-side, el
cliente podía influir en la extensión final del asset público.

Fix:

- el backend ahora deriva la extensión desde el MIME validado;
- `image/jpeg` siempre genera `.jpg`;
- `image/png` siempre genera `.png`;
- `image/webp` siempre genera `.webp`;
- `originalFilename` queda solo como metadata/auditoría y no controla storage.

Impacto: reduce confusión de navegador/CDN, evita URLs con extensiones engañosas
y mantiene la decisión de no aceptar SVG por riesgo XSS.

### Size floor explícito

Los DTOs ya exigían `sizeBytes >= 1`, pero la config de assets solo declaraba el
máximo. Se agregó `minSizeBytes` por kind para que el contrato sea explícito y
se use también durante confirmación contra storage.

Resultado:

- `upload-intent` rechaza archivos vacíos;
- `confirmUpload` rechaza objetos en storage por debajo del mínimo;
- los tests cubren ambos bordes.

### Content-Type obligatorio al confirmar

`S3Service.verifyUploadedObject()` ya rechazaba mismatches cuando storage
reportaba `Content-Type`. Ahora también rechaza objetos sin `Content-Type`.

Resultado: un asset solo pasa a `uploaded` si existe, tiene tamaño válido y el
`Content-Type` almacenado coincide exactamente con el intent.

## Postura actual

Controles activos:

- Endpoints protegidos por auth global.
- `POST /api/assets/upload-intent` exige ownership `write`.
- `POST /api/assets/:id/confirm` revalida ownership `write`.
- `GET /api/assets/artist/:artistId` exige access `read`.
- Object keys son `artists/{artistId}/{kind}/{uuid}.{ext}` y los genera el backend.
- El cliente no recibe `objectKey`, solo `assetId`, `uploadUrl` y `expiresAt`.
- Presigned URLs tienen TTL de 300 segundos.
- Upload intent tiene rate limit dedicado: 20 intents / 60 s por user+IP.
- Bucket/CDN público es decisión aceptada para media artística pública.

## Riesgos residuales

No bloqueantes para private QA / launch controlado:

- No hay validación de magic bytes ni antivirus server-side. Mientras solo se
  acepten imágenes raster (`jpeg/png/webp`) y se sirvan como media pública, el
  riesgo queda acotado. Si se agregan PDFs, audio, zip, press kits descargables
  o archivos privados, agregar worker de scanning/magic-byte validation antes de
  habilitarlo.
- No hay lifecycle job todavía para limpiar `pending` assets abandonados ni
  objetos viejos reemplazados. Queda registrado para T7-8 / launch público.
- No hay signed delivery URLs. Es deliberado: los assets actuales son públicos.
  Para documentos privados o material exclusivo, crear bucket privado separado.

## Validación

Validaciones locales ejecutadas:

```bash
pnpm --filter @stagelink/types build
pnpm --filter @stagelink/api exec prisma generate
pnpm --filter @stagelink/api exec jest src/modules/assets/assets.service.spec.ts src/lib/s3/s3.service.spec.ts --runInBand
pnpm --filter @stagelink/api exec jest --runInBand
pnpm --filter @stagelink/api typecheck
pnpm security:audit
pnpm exec prettier --check apps/api/src/modules/assets/assets.constants.ts apps/api/src/modules/assets/assets.service.ts apps/api/src/modules/assets/assets.service.spec.ts apps/api/src/lib/s3/s3.service.ts apps/api/src/lib/s3/s3.service.spec.ts docs/assets-s3.md docs/security-audit-e2-file-upload-asset-security.md CLAUDE.md
```

Resultado: passed.

- Tests focalizados: 2 suites / 8 tests passed.
- API unit suite completa: 38 suites / 308 tests passed.
- TypeScript check: passed.
- Dependency audit: no known vulnerabilities found.

## Decisión

E2.11 queda cerrado con fixes. No quedan blockers conocidos de file upload /
asset security para avanzar a E2.14 Error handling / information leakage o E2.15
Security monitoring / incident readiness. Los pendientes de scanning, lifecycle
y assets privados quedan en backlog pre-launch/T7-8.
