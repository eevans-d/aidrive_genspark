# Plan Fusionado Definitivo: Facturas de Proveedores / OCR

**Fecha:** 2026-02-27
**Version:** 4.0
**Estado:** CANONICO PARA EJECUCION
**Fuente de verdad tecnica:** codigo en `supabase/functions/*`, `minimarket-system/src/*`, `supabase/migrations/*`

## 1) Objetivo
Cerrar los gaps reales del modulo OCR de facturas para operar en produccion sin drift entre runtime, API y documentacion.

## 2) Alcance
Incluye:
- Flujo OCR completo (`extraer -> validar items -> aplicar`).
- Robustez transaccional, consistencia de estados, rendimiento y UX minima operativa.
- Sincronizacion contractual (`docs/api-openapi-3.1.yaml` + `docs/API_README.md`).

Excluye:
- Refactors globales no relacionados a OCR.
- Rediseno general de arquitectura del sistema.

## 3) Baseline real verificado (2026-02-27)

### 3.1 Backend y frontend
- `supabase/functions/facturas-ocr/index.ts`: 451 lineas.
- `supabase/functions/facturas-ocr/helpers.ts`: 271 lineas.
- `supabase/functions/api-minimarket/index.ts`: 2516 lineas.
- `minimarket-system/src/pages/Facturas.tsx`: 527 lineas.
- `minimarket-system/src/components/FacturaUpload.tsx`: 187 lineas.
- `minimarket-system/src/hooks/queries/useFacturas.ts`: 139 lineas.

### 3.2 Base de datos y runtime
- Migraciones SQL: 52 (`supabase/migrations/*.sql`).
- Edge Functions desplegables en repo: 15 (excluye `_shared`).
- Estados de `facturas_ingesta`: `pendiente|extraida|validada|aplicada|error|rechazada`.
- Estados de `facturas_ingesta_items`: `auto_match|alias_match|fuzzy_pendiente|confirmada|rechazada`.

### 3.3 Tests
- Suite unitaria completa ejecutada en esta sesion: **1733/1733 PASS** (81 archivos).

## 4) Hallazgos confirmados contra codigo

### Criticos (P0)
1. `POST /facturas/{id}/extraer` en `api-minimarket` no valida estado previo de factura (invoca OCR directo).
2. `POST /facturas/{id}/aplicar` no bloquea por `score_confianza` minimo.
3. `POST /facturas/{id}/aplicar` tiene riesgo de carrera (check de estado + update final, sin lock optimista).
4. Aplicacion parcial posible: movimiento creado y fallo en `precios_compra` deja inconsistencia funcional.

### Altos (P1)
5. Insercion de items OCR uno a uno (sin batch ni reporte detallado de fallos).
6. Matching por item con hasta 3 requests secuenciales (N+1 elevado en facturas grandes).
7. Contrato OpenAPI de `/facturas/{id}/extraer` no refleja respuesta runtime actual.

### Medios (P2)
8. OCR no soporta PDF (solo `TEXT_DETECTION`, sin `DOCUMENT_TEXT_DETECTION`).
9. Warning de CUIT mismatch solo en logs backend, no visible en UI.
10. Items rechazados sin flujo explicito de reapertura en UI.

## 5) Decisiones de ejecucion (cerradas para implementacion)
1. **Doble guarda de estado en extraccion:** gateway + edge function.
2. **Reintento OCR controlado:** permitir `pendiente|error` y limpiar items previos antes de re-extraer.
3. **Aplicacion segura:** lock optimista al inicio de `/aplicar`.
4. **Politica de confianza:** bloquear aplicacion si `score_confianza < OCR_MIN_SCORE_APPLY` (inicial 0.70).
5. **Contrato incremental:** mantener payload base de `/extraer` y agregar campos enriquecidos de forma backward-compatible.

## 6) Plan ejecutable (Top 10)

## Fase 1 - Consistencia API + seguridad transaccional (P0)

### T1. Guardas de estado para `/facturas/{id}/extraer`
- Archivos:
  - `supabase/functions/api-minimarket/index.ts`
  - `supabase/functions/facturas-ocr/index.ts`
- DoD:
  - gateway valida estado permitido antes de invocar OCR;
  - edge function revalida estado para evitar bypass;
  - codigos de error consistentes (`400/409`) y documentados.
- Evidencia:
  - tests unitarios de estado permitido/no permitido.

### T2. Reextraccion segura con limpieza previa
- Archivos:
  - `supabase/functions/facturas-ocr/index.ts`
  - `supabase/functions/api-minimarket/index.ts`
- DoD:
  - en reintento se eliminan items anteriores de la factura;
  - se registra evento `ocr_reintento`;
  - no quedan duplicados de items tras re-extraccion.
- Evidencia:
  - test de reintento con conteo de items estable.

### T3. Lock optimista en `/facturas/{id}/aplicar`
- Archivos:
  - `supabase/functions/api-minimarket/index.ts`
- DoD:
  - patch inicial a `aplicada` condicionado a `estado=validada`;
  - si afecta 0 filas -> `409`;
  - rollback a `validada` si falla la aplicacion.
- Evidencia:
  - test de concurrencia (doble invocacion).

### T4. Guard de confianza OCR en aplicar
- Archivos:
  - `supabase/functions/api-minimarket/index.ts`
  - `docs/API_README.md`
  - `docs/api-openapi-3.1.yaml`
- DoD:
  - bloqueo `400 OCR_CONFIDENCE_BELOW_THRESHOLD` cuando no cumpla umbral;
  - umbral configurable por env (`OCR_MIN_SCORE_APPLY`, fallback 0.70).
- Evidencia:
  - test de score bajo/alto.

## Fase 2 - Rendimiento y robustez OCR (P1)

### T5. Batch insert de items + reporte de fallos
- Archivos:
  - `supabase/functions/facturas-ocr/index.ts`
- DoD:
  - insercion batch principal;
  - fallback individual si falla batch;
  - `items_fallidos` en evento y respuesta.
- Evidencia:
  - tests para batch exito/fallback.

### T6. Cache in-memory de alias/barcodes por request
- Archivos:
  - `supabase/functions/facturas-ocr/index.ts`
- DoD:
  - precarga de aliases y codigos;
  - `matchItem()` usa cache en L1/L2;
  - baja de requests HTTP por item.
- Evidencia:
  - benchmark simple de requests por factura y tests de cache hit/miss.

### T7. Hardening de aplicar ante fallos parciales
- Archivos:
  - `supabase/functions/api-minimarket/index.ts`
- DoD:
  - registrar errores por item de forma estructurada;
  - comportamiento consistente para `200` vs `207`;
  - trazabilidad de items aplicados/no aplicados.
- Evidencia:
  - tests de respuesta parcial.

## Fase 3 - Contrato y UX operativa (P2)

### T8. Sincronizar OpenAPI/API_README con runtime
- Archivos:
  - `docs/api-openapi-3.1.yaml`
  - `docs/API_README.md`
- DoD:
  - eliminar drift de `/facturas/{id}/extraer`;
  - documentar estados y codigos reales.
- Evidencia:
  - diff documental y validacion manual de ejemplos.

### T9. Warning CUIT mismatch en UI
- Archivos:
  - `minimarket-system/src/pages/Facturas.tsx`
- DoD:
  - banner visible cuando `cuit_detectado` no coincide con proveedor seleccionado;
  - no rompe flujo actual.
- Evidencia:
  - test de render condicional.

### T10. Soporte PDF OCR
- Archivos:
  - `supabase/functions/facturas-ocr/index.ts`
- DoD:
  - deteccion MIME y ruta `DOCUMENT_TEXT_DETECTION` para PDF;
  - fallback claro ante documento no soportado.
- Evidencia:
  - test de configuracion de request para PDF/imagen.

## 7) Quality gates obligatorios por fase
1. `npm run test:unit`
2. `pnpm -C minimarket-system test:components`
3. `pnpm -C minimarket-system lint`
4. `pnpm -C minimarket-system build`
5. Documentacion sincronizada (`ESTADO_ACTUAL`, `DECISION_LOG`, `API_README`, OpenAPI)

## 8) Riesgos y mitigaciones
- Riesgo: bloqueo por score excesivo.
  - Mitigacion: umbral por env + monitoreo de rechazos.
- Riesgo: regresion por lock optimista.
  - Mitigacion: tests de concurrencia y rollback controlado.
- Riesgo: aumento de complejidad OCR.
  - Mitigacion: fases cortas y evidencia por tarea.

## 9) Rollback
- Cambios de codigo: revert por commit de fase.
- Cambios de contrato: mantener compatibilidad hacia atras en payload de `extraer`.
- Si falla fase en produccion: congelar despliegue de OCR y volver al comportamiento previo de la fase afectada.

## 10) Backlog diferido (fuera del Top 10)
- Historial de precios en UI.
- Bulk upload multi-factura.
- Reapertura avanzada de items rechazados.
- Deteccion inteligente de duplicados entre facturas.

## 11) Estado documental
- Este archivo reemplaza como plan activo a:
  - `docs/archive/planes-deprecados/PLAN_FACTURAS_OCR.md`
  - `docs/archive/planes-deprecados/PLAN_MAESTRO_OCR_FACTURAS.md`
- Ambos quedan como antecedentes historicos marcados como deprecados.
