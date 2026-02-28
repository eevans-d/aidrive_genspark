# ESTADO ACTUAL DEL PROYECTO

**Ultima actualizacion:** 2026-02-28 (limpieza de planes deprecados en archivo historico)
**Veredicto general del sistema:** `GO INCONDICIONAL`
**Estado del modulo OCR de facturas:** `ESTABLE PARA USO BASICO, CON BACKLOG CRITICO PRIORIZADO`
**Fuente ejecutiva:** `docs/PRODUCTION_GATE_REPORT.md`

## 1) Resumen ejecutivo
- El sistema principal mantiene veredicto `GO INCONDICIONAL` (ProductionGate previo 18/18 PASS).
- Se valido nuevamente la base tecnica de OCR contra codigo real y se consolido un plan unico:
  - `docs/PLAN_FUSIONADO_FACTURAS_OCR.md` (canonico).
- Se movieron planes historicos/deprecados al archivo:
  - `docs/archive/planes-deprecados/PLAN_FACTURAS_OCR.md`
  - `docs/archive/planes-deprecados/PLAN_MAESTRO_OCR_FACTURAS.md`
- La documentacion principal fue alineada para eliminar drift y evitar decisiones futuras basadas en supuestos obsoletos.

## 2) Estado tecnico verificado (sesion 2026-02-27)
- Tests unitarios completos: **1733/1733 PASS** (81 archivos).
- Migraciones SQL en repo: **52**.
- Edge Functions en repo: **15** (excluye `_shared`).
- Skills en `.agent/skills`: **22**.
- Enlaces internos en `docs/`: **0 rotos**.
- Freshness de este documento: **vigente (0 dias)**.

## 3) OCR de facturas: estado real
### Implementado
- Extraccion OCR via `facturas-ocr` con Google Cloud Vision (`TEXT_DETECTION`).
- Matching 3 capas: barcode/SKU -> alias -> fuzzy.
- Persistencia en:
  - `facturas_ingesta`
  - `facturas_ingesta_items`
  - `facturas_ingesta_eventos`
- Flujo funcional disponible en gateway:
  - `POST /facturas/{id}/extraer`
  - `PUT /facturas/items/{id}/validar`
  - `POST /facturas/{id}/aplicar`
- Deteccion de CUIT implementada y enriquecimiento en `datos_extraidos`.

### Gaps abiertos (priorizados)
- Falta guarda de estado previa en gateway para `/facturas/{id}/extraer`.
- `/facturas/{id}/aplicar` no bloquea por umbral de `score_confianza`.
- Riesgo de carrera en `aplicar` por ausencia de lock optimista al inicio.
- Drift de contrato OpenAPI/API_README vs respuesta runtime de `extraer`.
- Insercion de items OCR y matching con sobrecosto de requests (N+1).

Fuente de trabajo: `docs/PLAN_FUSIONADO_FACTURAS_OCR.md` y `docs/closure/OPEN_ISSUES.md`.

## 4) Fuentes canónicas vigentes
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
El estado `GO INCONDICIONAL` aplica al sistema general ya auditado; no implica que el backlog OCR este cerrado. El backlog OCR queda explicitamente abierto y priorizado para ejecucion por fases.
