# ESTADO ACTUAL DEL PROYECTO

**Ultima actualizacion:** 2026-02-28 (review post-Copilot + cross-check PLAN_FUSIONADO)
**Veredicto general del sistema:** `GO INCONDICIONAL`
**Estado del modulo OCR de facturas:** `ESTABLE PARA USO BASICO, CON BACKLOG CRITICO PRIORIZADO`
**Fuente ejecutiva:** `docs/PRODUCTION_GATE_REPORT.md`

## 1) Resumen ejecutivo
- El sistema principal mantiene veredicto `GO INCONDICIONAL` (ProductionGate previo 18/18 PASS).
- Se ejecuto auditoria tecnica senior sobre cambios de Codex + GitHub Copilot (5 hallazgos, 4 fixes).
- Se refino error handling de `facturas-ocr` (GCV timeout → 504 especifico en lugar de 500 generico).
- Se normalizo data de CUITs en BD (2 proveedores corregidos).
- Se verifico cruzadamente cada tarea T1-T10 del PLAN_FUSIONADO contra codigo real.
- GCV sigue BLOCKED: cambio de HTTP 403 a timeout total (15s). Requiere accion del owner en GCP Console.

## 2) Estado tecnico verificado (sesion 2026-02-28)
- Tests unitarios completos: **1733/1733 PASS** (81 archivos).
- Migraciones SQL en repo: **52**.
- Edge Functions en repo: **15** (excluye `_shared`).
- Skills en `.agent/skills`: **22**.
- Enlaces internos en `docs/`: **0 rotos** (28 archivos verificados).
- Freshness de este documento: **vigente (0 dias)**.
- Deploy `facturas-ocr`: **v10 en produccion** (base64 chunked + CUIT variants + timeout handling).

## 3) OCR de facturas: estado real

### Implementado y verificado
- Extraccion OCR via `facturas-ocr` con Google Cloud Vision (`TEXT_DETECTION`).
- Matching 3 capas: barcode/SKU -> alias -> fuzzy.
- Persistencia en `facturas_ingesta`, `facturas_ingesta_items`, `facturas_ingesta_eventos`.
- Flujo funcional en gateway: `POST /extraer`, `PUT /items/{id}/validar`, `POST /aplicar`.
- Deteccion de CUIT con variantes de formato (`XX-XXXXXXXX-X` y solo digitos).
- Chunked base64 encoding para imagenes grandes (fix de stack overflow).
- Error handling especifico para GCV timeout (504 `OCR_TIMEOUT`).
- Scripts batch: `scripts/ocr-procesar-nuevos.mjs` y `scripts/seed-proveedores.mjs`.
- 12 proveedores seeded, 21 facturas cargadas (pendientes de OCR).

### Cross-check PLAN_FUSIONADO T1-T10

| Tarea | Descripcion | Estado | Evidencia |
|-------|-------------|--------|-----------|
| T1 | Guardas de estado en `/extraer` | NO_IMPLEMENTADO | `api-minimarket/index.ts:2210` invoca OCR sin validar estado |
| T2 | Reextraccion con limpieza previa | NO_IMPLEMENTADO | `facturas-ocr/index.ts:374` inserta items sin limpiar previos |
| T3 | Lock optimista en `/aplicar` | PARCIAL | Check de estado presente (`:2353`), pero PATCH final incondicional (`:2443`) |
| T4 | Guard de confianza OCR | NO_IMPLEMENTADO | `api-minimarket/index.ts:2345-2469` sin referencia a `score_confianza` |
| T5 | Batch insert de items | NO_IMPLEMENTADO | Items insertados uno a uno en loop (`:374-405`) |
| T6 | Cache in-memory alias/barcodes | NO_IMPLEMENTADO | `matchItem()` hace 1-3 HTTP requests por item sin cache |
| T7 | Hardening `/aplicar` parcial | PARCIAL | Retorna 207 con detalle (`:2468`), pero sin rollback de movimientos exitosos |
| T8 | Sync OpenAPI/API_README | DRIFTED | Status codes difieren: spec vs runtime (408/504, 500/502, 500/503) |
| T9 | Warning CUIT mismatch en UI | NO_IMPLEMENTADO | `Facturas.tsx` no lee `cuit_detectado` |
| T10 | Soporte PDF OCR | NO_IMPLEMENTADO | `TEXT_DETECTION` hardcoded, sin deteccion MIME |

### Bloqueante externo
- **OCR-007:** GCV_API_KEY no responde (timeout 15s). Sin este servicio, T1-T10 no pueden validarse end-to-end.
- Accion: owner debe verificar Cloud Vision API + billing + restricciones de key en GCP Console.

## 4) Fuentes canonicas vigentes
1. `docs/ESTADO_ACTUAL.md`
2. `docs/DECISION_LOG.md`
3. `docs/closure/OPEN_ISSUES.md`
4. `docs/API_README.md`
5. `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`
6. `docs/METRICS.md`
7. `docs/PLAN_FUSIONADO_FACTURAS_OCR.md` (solo para roadmap OCR)

## 5) Guardrails activos
1. No imprimir secretos/JWTs (solo nombres).
2. No usar git destructivo (`git reset --hard`, `git checkout -- <file>`, force-push).
3. `api-minimarket` debe permanecer con `verify_jwt=false` si se redeploya.
4. No declarar "cerrado" sin evidencia en `docs/closure/` o `test-reports/`.

## 6) Nota operativa
El estado `GO INCONDICIONAL` aplica al sistema general ya auditado; no implica que el backlog OCR este cerrado. El backlog OCR queda explicitamente abierto con 0/10 tareas completadas y 2/10 parciales. GCV es prerequisito externo para validacion funcional.
