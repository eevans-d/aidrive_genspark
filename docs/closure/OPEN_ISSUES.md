# OPEN ISSUES (Canonico)

**Ultima actualizacion:** 2026-02-28 (review post-Copilot continuacion)
**Fuente ejecutiva:** `docs/ESTADO_ACTUAL.md`

## Hallazgos abiertos

## OCR-007 - GCV_API_KEY no responde (CRITICO - bloqueante para OCR)
- Severidad: CRITICA
- Impacto: ningun OCR puede ejecutarse hasta resolver permisos GCV.
- Estado: BLOCKED
- Evidencia original: `facturas_ingesta_eventos` evento `ocr_error` status 403 (2026-02-28 04:09 UTC)
- Evidencia actualizada: `facturas_ingesta_eventos` evento `ocr_error` "GCV fetch failed: Signal timed out." (2026-02-28 05:19 UTC) — GCV ya no responde 403, directamente no responde (timeout 15s).
- Accion requerida: owner debe verificar en Google Cloud Console que Cloud Vision API este habilitada, key sin restricciones bloqueantes, y billing activo. Posible deshabilitacion de API o suspension de billing.
- Plan asociado: `docs/closure/OCR_NUEVOS_RESULTADOS_2026-02-28.md`

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

## OCR-001 - Falta guarda de estado en gateway para `POST /facturas/{id}/extraer`
- Severidad: ALTA
- Impacto: puede invocar OCR en estados no previstos desde gateway.
- Estado: ABIERTO
- Plan asociado: `PLAN_FUSIONADO_FACTURAS_OCR.md` -> T1

## OCR-002 - Falta bloqueo por confianza OCR en `POST /facturas/{id}/aplicar`
- Severidad: ALTA
- Impacto: permite aplicar stock con extracciones de baja confianza.
- Estado: ABIERTO
- Plan asociado: `PLAN_FUSIONADO_FACTURAS_OCR.md` -> T4

## OCR-003 - Riesgo de concurrencia en `POST /facturas/{id}/aplicar`
- Severidad: ALTA
- Impacto: dos requests concurrentes pueden competir sin lock optimista inicial.
- Estado: ABIERTO
- Plan asociado: `PLAN_FUSIONADO_FACTURAS_OCR.md` -> T3

## OCR-004 - Drift documental de `/facturas/{id}/extraer` (OpenAPI/API_README vs runtime)
- Severidad: MEDIA
- Impacto: consumidores de API pueden implementar contratos incorrectos.
- Estado: ABIERTO
- Plan asociado: `PLAN_FUSIONADO_FACTURAS_OCR.md` -> T8

## OCR-005 - N+1 de matching e insercion secuencial de items OCR
- Severidad: MEDIA
- Impacto: degradacion de performance en facturas grandes.
- Estado: ABIERTO
- Plan asociado: `PLAN_FUSIONADO_FACTURAS_OCR.md` -> T5, T6

## OCR-006 - OCR sin soporte PDF
- Severidad: MEDIA
- Impacto: flujo limitado para facturas PDF.
- Estado: ABIERTO
- Plan asociado: `PLAN_FUSIONADO_FACTURAS_OCR.md` -> T10

## Hallazgos cerrados (resumen)
- Revalidacion global de sistema y gates: ver `docs/PRODUCTION_GATE_REPORT.md`.
- Cierres historicos pre-OCR: ver `docs/closure/INFORME_REMEDIACION_FINAL_2026-02-25_041847.md`.

## BLOCKED
- OCR-007: GCV_API_KEY no responde (timeout 15s). Bloqueante para extraccion OCR de las 21 facturas cargadas. Error modo cambio de 403 rapido a timeout total.

## Nota de interpretacion
El backlog OCR abierto no contradice el estado `GO INCONDICIONAL` del sistema general: significa que el modulo OCR tiene mejoras priorizadas para robustez y escalabilidad, no una caida operativa total del producto.
