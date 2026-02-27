# OPEN ISSUES (Canonico)

**Ultima actualizacion:** 2026-02-27 (sincronizacion absoluta + plan OCR definitivo)
**Fuente ejecutiva:** `docs/ESTADO_ACTUAL.md`

## Hallazgos abiertos

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
- Ninguno.

## Nota de interpretacion
El backlog OCR abierto no contradice el estado `GO INCONDICIONAL` del sistema general: significa que el modulo OCR tiene mejoras priorizadas para robustez y escalabilidad, no una caida operativa total del producto.
