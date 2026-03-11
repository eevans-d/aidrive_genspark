# OPEN ISSUES (Canonico)

**Ultima actualizacion:** 2026-03-08 (sync Comet Prompt 5 + diagnostico refinado OCR-007)
**Fuente ejecutiva:** `docs/ESTADO_ACTUAL.md`

## Hallazgos abiertos

## OCR-007 - Billing inactivo bloquea Google Cloud Vision (CRITICO - bloqueante para OCR)
- Severidad: CRITICA
- Impacto: ningun OCR puede ejecutarse hasta resolver billing GCP.
- Estado: BLOCKED — causa raiz confirmada
- Causa raiz: Free Trial expirado en el proyecto OCR activo `gen-lang-client-0312126042` ("Nano banana pro"). La unica cuenta de facturacion detectada (`0156DA-EB3EB0-9C9339`) esta cerrada/vencida. Cloud Vision API ya esta habilitada y la key esta correctamente restringida, pero sin billing activo las llamadas siguen bloqueadas.
- Evidencia original: `facturas_ingesta_eventos` evento `ocr_error` status 403 (2026-02-28 04:09 UTC)
- Evidencia actualizada: timeout 15s (2026-02-28 05:19 UTC). Diagnostico GCP Console via Comet (2026-02-28 05:50 UTC).
- Evidencia refinada (Comet Prompt 5, 2026-03-08): (1) el proyecto nuevo `aidrive-genspark` fue creado pero no puede habilitar Vision por falta de billing; (2) el proyecto realmente usado por OCR (`gen-lang-client-0312126042`) ya tenia Cloud Vision API habilitada; (3) `GCV_API_KEY` existia con restricciones correctas; (4) el secret `GCV_API_KEY` en Supabase fue actualizado externamente con el valor confirmado desde GCP.
- Evidencia de re-check runtime: invocacion directa a `facturas-ocr` devuelve `504 OCR_TIMEOUT` (2026-02-28 11:39 UTC), y el documento persiste `{"error":"GCV fetch failed: Signal timed out."}` en `facturas_ingesta_eventos`.
- Accion requerida: owner debe activar billing en `https://console.cloud.google.com/billing/0156DA-EB3EB0-9C9339`, agregar metodo de pago y vincular esa cuenta al proyecto `gen-lang-client-0312126042`. Cloud Vision tiene 1000 unidades gratis/mes; no se cobra salvo exceso.
- Plan asociado: `docs/closure/archive/historical/OCR_NUEVOS_RESULTADOS_2026-02-28.md`

## AUTH-001 - CAPTCHA de Auth no configurado en Supabase (MEDIA - hardening externo pendiente)
- Severidad: MEDIA
- Impacto: el login no tiene challenge anti-bot adicional. `signup` ya esta deshabilitado, por lo que el riesgo actual se concentra en intentos automatizados sobre credenciales existentes.
- Estado: PENDIENTE_EXTERNAL
- Evidencia: validacion via Comet en Supabase Dashboard (2026-03-08) registrada en `docs/closure/archive/historical/COMET_BROWSER_FINDINGS_2026-03-08.md`.
- Accion requerida: crear credenciales del proveedor (`hCaptcha` o `Turnstile`), configurar el secret en Supabase Auth y agregar el widget al frontend de login.
- Ruta candidata de integracion frontend: `minimarket-system/src/pages/Login.tsx`

## AUTH-002 - Session timeouts server-side no disponibles en el plan actual (MEDIA - mitigado en frontend)
- Severidad: MEDIA
- Impacto: el dashboard actual no permite `timebox` ni `inactivity timeout` nativos. Sin compensacion, una sesion podia quedar abierta indefinidamente en un dispositivo compartido.
- Estado: MITIGADO_PARCIAL
- Evidencia externa: validacion via Comet en Supabase Dashboard (2026-03-08).
- Fix aplicado en repo: mitigacion client-side en `minimarket-system/src/contexts/AuthContext.tsx` + `minimarket-system/src/lib/authSessionPolicy.ts` con defaults `24h`/`8h`.
- Verificacion local: `8/8 PASS` en tests focalizados (`authSessionPolicy` + `AuthContext`) y `tsc --noEmit` OK.
- Accion restante: si el proyecto sube a un plan con soporte nativo, alinear el timeout tambien a nivel server-side para que el corte no dependa solo del cliente.

## DB-001 - Network restrictions de PostgreSQL no configuradas (MEDIA - hardening externo pendiente)
- Severidad: MEDIA
- Impacto: el host directo de la base permanece accesible desde cualquier IP hasta definir una allowlist. El pooler no queda cubierto por esta restriccion.
- Estado: PENDIENTE_EXTERNAL
- Evidencia: validacion via Comet en Supabase Dashboard (2026-03-08) registrada en `docs/closure/archive/historical/COMET_BROWSER_FINDINGS_2026-03-08.md`.
- Accion requerida: inventariar IPs salientes de Render/Railway/desarrollo y aplicar CIDRs permitidos en Supabase Database → Network restrictions.
- Nota: no existe evidencia en el repo sobre el valor actual de `DATABASE_URL` en servicios externos; esa comprobacion debe hacerse fuera del filesystem.

## PERF-001 - Build frontend con warnings de chunking/PWA (BAJA - no bloqueante)
- Severidad: BAJA
- Impacto: el build de produccion termina correctamente, pero emite warnings de chunking circular (`vendor -> react -> vendor`, `vendor -> react -> charts -> vendor`), chunks grandes (`react` ~549 kB, `scanner` ~457 kB) y `Unknown input options: manualChunks` durante el paso de Workbox/PWA. No hay evidencia actual de fallo runtime, pero queda deuda de performance y ruido operativo.
- Estado: ABIERTO
- Evidencia: `pnpm -C minimarket-system build` ejecutado el 2026-03-08.
- Ruta candidata: `minimarket-system/vite.config.ts`
- Accion requerida: revisar estrategia de `manualChunks`, code-splitting de `scanner`/`react` y la interaccion `VitePWA`/Workbox para eliminar el warning residual.

## AUDIT-001 - Hallazgos MEDIUM de auditoria de produccion (CERRADO)
- Severidad: MEDIA (ninguno bloqueante)
- Estado: CERRADO — 9/9 hallazgos resueltos (3 en D-184/D-185, 6 en T01-T15)
- Origen: Auditoria de produccion profunda D-177 (2026-03-01)
- Hallazgos resueltos (sesion 2026-03-03, D-184/D-185):
  - ~~**RC-02**~~: Check de margen en `/precios/aplicar` — RESUELTO via `SELECT ... FOR UPDATE` en `sp_aplicar_precio` (migracion `20260303010000`, D-185)
  - ~~**RC-03**~~: Transiciones de estado en tareas — RESUELTO via state machine con validacion de estado previo (D-184)
  - ~~**ID-01**~~: Idempotency key en `/deposito/movimiento` — RESUELTO via columna `idempotency_key` + indice UNIQUE (migracion `20260302010000`, D-184)
- Hallazgos resueltos (sesion 2026-03-04, T01-T15):
  - ~~**RC-01**~~: Race condition OCR concurrente — RESUELTO via lock de concurrencia en gateway (T02)
  - ~~**D1**~~: Insercion parcial items OCR — RESUELTO via transaccionalidad en insercion OCR (T03)
  - ~~**D2**~~: Race condition extraccion concurrente — RESUELTO via mutex extraccion OCR (T04)
  - ~~**ID-02**~~: Idempotency key en `/deposito/ingreso` — RESUELTO (T05)
  - ~~**ID-03**~~: Idempotency key en `/compras/recepcion` — RESUELTO (T06)
  - ~~**ES-01**~~: Fallo silencioso de `precio_compra` — RESUELTO via `_warnings` en respuesta (T07)
  - ~~**ES-02**~~: Fallo silencioso de auto-validacion factura — RESUELTO via `_warnings` en respuesta (T08)
  - ~~**RE-01**~~: Agregacion sin limite en reportes — RESUELTO via hard cap 10k rows + indicador (T09)
- Referencia: `docs/ESTADO_ACTUAL.md` seccion 7

## OCR-008 - Bug base64 en facturas-ocr (RESUELTO)
- Severidad: CRITICA
- Impacto: stack overflow al procesar imagenes >1MB.
- Estado: CERRADO (fix aplicado y desplegado 2026-02-28)
- Evidencia: `supabase/functions/facturas-ocr/index.ts` — chunked base64 encoding; deploy verificado con `supabase functions list` (v10)
- Deploy: verificado en produccion (funcion alcanza GCV timeout sin stack overflow)

## OCR-009 - Tabla proveedores estaba vacia en produccion (RESUELTO)
- Severidad: ALTA
- Impacto: no se podia crear facturas_ingesta sin proveedor_id valido.
- Estado: CERRADO (seed ejecutado 2026-02-28, 12 proveedores insertados)
- Evidencia: `scripts/seed-proveedores.mjs --execute`

## OCR-011 - Hardening parcial de `/facturas/{id}/aplicar` (RESUELTO)
- Severidad: MEDIA
- Impacto: ante error parcial de aplicacion, los movimientos de inventario ya creados se compensan automaticamente.
- Estado: CERRADO (2026-03-01)
- Fix aplicado: movimientos `salida` compensatorios + limpieza de link idempotencia + evento `aplicacion_rollback` con detalle de compensacion.
- Evidencia: `supabase/functions/api-minimarket/index.ts` (lineas 2513-2579), `tests/unit/facturas-aplicar-hardening.test.ts` (25 tests PASS)

## Hallazgos cerrados (resumen)
- **Supabase Browser Check (2026-03-08):** `signup` publico confirmado en `OFF`, `confirm email` confirmado en `ON`, y `Supavisor` ya activo como pooler compartido. Quedan pendientes solo CAPTCHA, `network restrictions` y la verificacion externa de `DATABASE_URL` en servicios conectados.
- **Auditoria de produccion D-177 (2026-03-01):** 11 fixes implementados cubriendo CRITICO (RL-01 error leakage, F2+D3 estado transition ordering) + HIGH (S2 auth bypass, F1+S1 GCV safety, M1 image limits, ES-03/PW-02/TC-01 aplicar robustness) + MEDIUM (MISC-02 request-id sanitization, F3 JSON parse, UI-01 double-submit).
- **D-183 (2026-03-02):** hardening de `registrar_pago_cc` en asistente IA: ya no selecciona cliente implicito cuando hay candidatos duplicados; fuerza desambiguacion antes de permitir confirmacion. `api-assistant` redeployada (v2).
- Revalidacion pre-entrega 2026-03-01: `ProductionGate` 18/18 PASS (score 100), `RealityCheck` sin blockers UX P0, `DocuGuard` PASS (ver reporte de cierre 2026-03-01).
- Revalidacion global de sistema y gates: ver `docs/PRODUCTION_GATE_REPORT.md`.
- Cierres historicos pre-OCR: ver `docs/closure/archive/historical/INFORME_REMEDIACION_FINAL_2026-02-25_041847.md`.
- OCR-001 cerrado: gateway valida estado `pendiente|error` en `POST /facturas/{id}/extraer` y retorna `409 INVALID_STATE` para estados no permitidos (tests unitarios `1751/1751` PASS).
- OCR-002 cerrado: `/facturas/{id}/aplicar` ahora bloquea con `400 OCR_CONFIDENCE_BELOW_THRESHOLD` cuando `score_confianza` es inferior a `OCR_MIN_SCORE_APPLY` (fallback `0.70`).
- OCR-003 cerrado: `/facturas/{id}/aplicar` ahora usa lock optimista (`PATCH` condicional por `id+estado`) y retorna `409` si pierde carrera.
- OCR-004 cerrado: contrato documental de `/facturas/{id}/extraer` sincronizado en `docs/api-openapi-3.1.yaml` y `docs/API_README.md` con runtime real.
- OCR-005 cerrado: matching OCR con cache in-memory por request + inserción batch con fallback individual (`items_failed`).
- OCR-006 cerrado: soporte PDF habilitado (`DOCUMENT_TEXT_DETECTION`) con validación explícita de tipo de archivo.
- OCR-010 cerrado: UI `Facturas` muestra warning visible cuando `cuit_detectado` no coincide con `proveedor.cuit`.

## DEPLOY-001 - Edge Function api-assistant pendiente de deploy (CERRADO)
- Severidad: MEDIA
- Impacto: Asistente IA ahora disponible en produccion.
- Estado: CERRADO (2026-03-01) — deploy ejecutado con Sprint 1 + 2
- Codigo incluye: Sprint 1 (7 intents read-only) + Sprint 2 (2 intents write con confirm_token, POST /confirm, plan cards)
- Deploy: `supabase functions deploy api-assistant --use-api` ejecutado exitosamente en proyecto `dqaygmjpzoqjjrywdsxi`
- Nota: `api-assistant` mantiene `verify_jwt=true` por politica D-086 y valida rol internamente via Auth API.
- Evidencia: `supabase/functions/api-assistant/index.ts`, `supabase/functions/api-assistant/parser.ts`, `supabase/functions/api-assistant/confirm-store.ts`
- Referencia: D-178, D-182 en `docs/DECISION_LOG.md`

## BLOCKED
- OCR-007: billing inactivo bloquea Cloud Vision; el ultimo sintoma observable sigue siendo `504 OCR_TIMEOUT`. Bloqueante para extraccion OCR de las 21 facturas cargadas.
- Estado actual de lote OCR en BD: `21 pendiente`, `0 error`, `0 extraida`, `0 validada`, `0 aplicada`.

## Nota de interpretacion
El backlog OCR tecnico esta cerrado (10/10 tareas) y el sistema ha sido endurecido con 11 fixes de auditoria de produccion (D-177) + audit trail expansion (D-185) + atomic margin validation (D-185). AUDIT-001 esta CERRADO: 9/9 hallazgos MEDIUM resueltos (3 en D-184/D-185 + 6 en T01-T15). El Asistente IA Sprint 1 + 1.1/1.2/1.3 + Sprint 2 + Sprint 3 esta implementado, testeado y desplegado en produccion. El unico bloqueante funcional abierto sigue siendo OCR-007 (billing GCP/Cloud Vision); adicionalmente quedan tres items de hardening externo no bloqueantes (`AUTH-001`, `AUTH-002`, `DB-001`) y un hallazgo BAJO de performance/build (`PERF-001`).
