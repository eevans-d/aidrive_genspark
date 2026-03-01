# OPEN ISSUES (Canonico)

**Ultima actualizacion:** 2026-03-01 (Sprint 1 Asistente IA implementado + auditoria de produccion profunda)
**Fuente ejecutiva:** `docs/ESTADO_ACTUAL.md`

## Hallazgos abiertos

## OCR-007 - GCV_API_KEY no responde (CRITICO - bloqueante para OCR)
- Severidad: CRITICA
- Impacto: ningun OCR puede ejecutarse hasta resolver billing GCP.
- Estado: BLOCKED — causa raiz confirmada
- Causa raiz: Free Trial expirado en proyecto GCP `gen-lang-client-0312126042` ("Nano banana pro"). Cuenta de facturacion `0156DA-EB3EB0-9C9339` cerrada/vencida. Cloud Vision API habilitada y key sin restricciones, pero billing inactivo bloquea todas las llamadas.
- Evidencia original: `facturas_ingesta_eventos` evento `ocr_error` status 403 (2026-02-28 04:09 UTC)
- Evidencia actualizada: timeout 15s (2026-02-28 05:19 UTC). Diagnostico GCP Console via Comet (2026-02-28 05:50 UTC).
- Evidencia de re-check: invocacion directa a `facturas-ocr` devuelve `504 OCR_TIMEOUT` (2026-02-28 11:39 UTC), y el documento persiste `{"error":"GCV fetch failed: Signal timed out."}` en `facturas_ingesta_eventos`.
- Accion requerida: owner debe activar billing en `console.cloud.google.com/billing` → boton "Activar" → ingresar datos de pago → vincular al proyecto. Cloud Vision tiene 1000 unidades gratis/mes; no se cobra salvo exceso.
- Plan asociado: `docs/closure/archive/historical/OCR_NUEVOS_RESULTADOS_2026-02-28.md`

## AUDIT-001 - Hallazgos MEDIUM de auditoria de produccion (backlog recomendado)
- Severidad: MEDIA (ninguno bloqueante)
- Estado: ABIERTO — documentado, no implementado
- Origen: Auditoria de produccion profunda D-177 (2026-03-01)
- Hallazgos:
  - **RC-01**: Race condition si dos usuarios invocan OCR simultaneamente para misma factura (sin lock en gateway pre-dispatch)
  - **RC-02**: Check de margen en `POST /precios/aplicar` lee producto sin lock; dato potencialmente stale bajo concurrencia
  - **RC-03**: Transiciones de estado en tareas (`/tareas/{id}/completar`, `/cancelar`) no validan estado previo
  - **ID-01/02/03**: No hay idempotency key en `POST /deposito/movimiento`, `POST /deposito/ingreso`, `POST /compras/recepcion`
  - **RE-01**: Agregacion in-memory sin limite en `GET /reportes/efectividad-tareas` puede consumir memoria con muchos registros
  - **ES-01**: Fallo silencioso de insert `precios_compra` en `/deposito/ingreso` (solo warn en log, usuario no notificado)
  - **ES-02**: Fallo silencioso de auto-validacion de factura al confirmar ultimo item (solo warn en log)
  - **D1**: Insercion parcial de items OCR en `facturas-ocr` (batch fallback crea items parciales sin rollback)
  - **D2**: Race condition en extraccion OCR concurrente (sin mutex a nivel de edge function)
- Impacto operativo: bajo en uso normal (1-2 usuarios simultaneos en minimarket tipico). Se recomienda priorizar ID-01/02/03 y RC-01 si el sistema escala a multiples operadores simultaneos.
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
- **Auditoria de produccion D-177 (2026-03-01):** 11 fixes implementados cubriendo CRITICO (RL-01 error leakage, F2+D3 estado transition ordering) + HIGH (S2 auth bypass, F1+S1 GCV safety, M1 image limits, ES-03/PW-02/TC-01 aplicar robustness) + MEDIUM (MISC-02 request-id sanitization, F3 JSON parse, UI-01 double-submit).
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

## DEPLOY-001 - Edge Function api-assistant pendiente de deploy (ABIERTO)
- Severidad: MEDIA
- Impacto: Asistente IA no disponible en produccion hasta ejecutar deploy.
- Estado: ABIERTO — codigo completo, deploy pendiente
- Accion requerida: `supabase functions deploy api-assistant --use-api`
- Nota: por politica D-086, solo `api-minimarket` usa `verify_jwt=false`; `api-assistant` debe mantener `verify_jwt=true` y ademas valida rol internamente via Auth API.
- Evidencia: `supabase/functions/api-assistant/index.ts`, `supabase/functions/api-assistant/parser.ts`
- Referencia: D-178 en `docs/DECISION_LOG.md`

## BLOCKED
- OCR-007: GCV_API_KEY no responde (timeout 15s). Bloqueante para extraccion OCR de las 21 facturas cargadas.
- Estado actual de lote OCR en BD: `20 pendiente`, `1 error`, `0 extraida`, `0 validada`, `0 aplicada`.

## Nota de interpretacion
El backlog OCR tecnico esta cerrado (10/10 tareas) y el sistema ha sido endurecido con 11 fixes de auditoria de produccion (D-177). El Sprint 1 del Asistente IA esta implementado y testeado (D-178), pendiente solo de deploy a produccion (DEPLOY-001). Los hallazgos abiertos son: OCR-007 (bloqueante externo GCV), DEPLOY-001 (deploy api-assistant) y AUDIT-001 (9 hallazgos MEDIUM, no bloqueantes, recomendados para escala). No hay deuda tecnica critica o alta pendiente.
