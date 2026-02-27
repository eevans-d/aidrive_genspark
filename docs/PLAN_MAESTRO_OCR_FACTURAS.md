> [DEPRECADO: 2026-02-27] Este documento queda como antecedente historico.
> Plan activo y canonico: `docs/PLAN_FUSIONADO_FACTURAS_OCR.md`.

# Plan Maestro OCR de Facturas de Proveedores
**Esta version/planificacion fue realizada por:** CODEX
**Tipo:** Documentacion de planificacion (sin implementacion)
**Fecha:** 2026-02-27
**Estado:** Version final canónica para ejecucion posterior
**Ultima revision intensiva (CODEX):** 2026-02-27
**Relacion documental:** este documento se considera la version canónica final de planificacion OCR; `docs/PLAN_FACTURAS_OCR.md` queda como antecedente historico.

## 0. Resultado de revision, verificacion y chequeo
### 0.1 Confirmaciones (estado REAL)
- Estados de `facturas_ingesta` confirmados en DB: `pendiente|extraida|validada|aplicada|error|rechazada`.
- Estados de `facturas_ingesta_items` confirmados en DB: `auto_match|alias_match|fuzzy_pendiente|confirmada|rechazada`.
- Endpoints OCR confirmados en documentación API: `POST /facturas/{id}/extraer`, `PUT /facturas/items/{id}/validar`, `POST /facturas/{id}/aplicar`.
- Deteccion CUIT (`extractCuit`) y resolucion por CUIT (`resolveProveedorByCuit`) confirmadas en runtime OCR.
- Score global OCR (`score_confianza`) confirmado en persistencia de `facturas_ingesta`.
- Suite de pruebas confirmada en ejecucion actual: `1733/1733` tests PASS (81 archivos; fecha de corrida 2026-02-27).

### 0.2 Desincronizaciones confirmadas (a resolver por plan)
- Contrato de `/facturas/{id}/extraer` en OpenAPI vs payload runtime: OpenAPI anticipa estructura mas rica que la respuesta actual.
- Validacion de estado previa a OCR: `API_README` la declara requerida (`pendiente`), pero el gateway no la fuerza antes de invocar OCR.
- Politica de bloqueo por baja confianza OCR: definida como necesidad operativa, aun no aplicada en endpoint `/facturas/{id}/aplicar`.

## 1. Objetivo
Definir una planificacion completa, eficiente y ejecutable para robustecer el flujo OCR de facturas de proveedores, priorizando calidad de extraccion, trazabilidad y salida estructurada apta para produccion.

## 2. Alcance
- Incluye: OCR de facturas de proveedores, validaciones, scoring de confianza, perfil proveedor, consistencia API/docs, y proceso de lote de imagenes.
- Excluye: auditoria general de repositorio, quality gates globales no OCR, cambios de arquitectura ajenos al modulo de facturas.

## 3. Estado actual verificado
### 3.1 Backend OCR
- Pipeline activo en `supabase/functions/facturas-ocr/index.ts`.
- Helpers OCR activos en `supabase/functions/facturas-ocr/helpers.ts`.
- Deteccion de CUIT implementada (`extractCuit`) y parseo OCR operativo (`parseOcrText`).
- Resolucion proveedor por CUIT implementada (`resolveProveedorByCuit`) con enriquecimiento en `datos_extraidos`.

### 3.2 API y flujo funcional
- `POST /facturas/{id}/extraer` (gateway a `facturas-ocr`).
- `PUT /facturas/items/{id}/validar`.
- `POST /facturas/{id}/aplicar`.
- Estados de factura en DB: `pendiente|extraida|validada|aplicada|error|rechazada`.

### 3.3 Datos y storage
- Tablas centrales: `facturas_ingesta`, `facturas_ingesta_items`, `facturas_ingesta_eventos`, `supplier_profiles`, `producto_aliases`, `precios_compra`.
- Bucket de imagenes facturas activo.

### 3.4 Tests
- Suite unitaria de helpers OCR en verde (incluye deteccion CUIT).
- Conteo actualizado validado en ejecucion reciente: 1733/1733 tests pass (81 archivos).

## 4. Alineacion con trabajo paralelo (Claude)
Este plan toma como baseline los avances ya implementados en paralelo:
- Deteccion de CUIT en OCR.
- Uso de CUIT detectado para resolucion de proveedor.
- Actualizacion de pruebas unitarias asociadas.

No se redefine ni duplica ese trabajo; se consolida en una hoja de ruta unica para ejecucion ordenada.

## 5. Decisiones cerradas
1. Reextraccion OCR permitida solo para facturas en estado `pendiente` o `error`.
2. Doble guarda de estado (gateway + edge function) para prevenir ejecuciones invalidas.
3. En reintentos OCR, limpiar items previos para evitar duplicados por factura.
4. Normalizacion CUIT a 11 digitos para matching estable en `proveedores`.
5. Bloquear `aplicar` cuando la confianza global OCR quede bajo umbral configurado.
6. Registrar evidencia OCR por campos criticos y ambiguedades en `issues`.

## 6. Cambios planificados en APIs/interfaces/types publicos
### 6.1 Endpoint de extraccion
`POST /facturas/{id}/extraer`
- Mantener payload base: `factura_id`, `items_count`, `estado`.
- Agregar `extraction_report` opcional en `data` con:
  - `header`
  - `totals`
  - `validations`
  - `field_confidence`
  - `evidence`
  - `issues`
- Errores explicitos sugeridos:
  - `409 FACTURA_ESTADO_INVALIDO`
  - `409 OCR_ALREADY_EXTRACTED`

### 6.2 Endpoint de aplicacion
`POST /facturas/{id}/aplicar`
- Guard de confianza OCR:
  - `400 OCR_CONFIDENCE_BELOW_THRESHOLD` cuando `score_confianza` sea menor al umbral.

### 6.3 Tipos frontend
- Extender tipo de respuesta de `extraer` en `apiClient` con `extraction_report` opcional.
- Mantener backward compatibility.

### 6.4 Documentacion API
- Sincronizar `docs/api-openapi-3.1.yaml` y `docs/API_README.md` con el contrato runtime.

## 7. Plan por fases (2-4 semanas)
### F0 - Aterrizaje y baseline (Dia 1)
- Congelar baseline tecnico del modulo OCR.
- Confirmar ownership por tarea para evitar conflictos de trabajo paralelo.
- Definir evidencia minima por entregable: commit + test + actualizacion documental.

### F1 - Robustez operativa (Semana 1)
- Guardas de estado en extraccion.
- Reintento controlado desde `error` con limpieza de items previos.
- Normalizacion CUIT para matching.
- Registro de eventos de extraccion/reintento/rechazo.

### F2 - Calidad de extraccion por proveedor (Semana 2)
- Mejoras de parser para campos criticos: fecha, numero, tipo, CUIT, total.
- Scoring por campo y score global ponderado.
- Validaciones obligatorias:
  - `subtotal+impuestos+otros_cargos-descuentos≈total`
  - `cuit_11_digitos`
  - `fecha_no_futura`
- Trazabilidad de ambiguedades en `issues`.

### F3 - Lote real y salida productiva (Semana 3)
- Procesar lote de imagenes en `proveedores_facturas_temp`.
- Generar salida obligatoria en 4 bloques:
  1. `JSON_CONSOLIDADO`
  2. `PERFIL_PROVEEDOR`
  3. `REPORTE_CALIDAD`
  4. `PENDIENTES_CRITICOS`
- Aplicar reglas estrictas de formato:
  - no inventar datos
  - faltante/ilegible = `null`
  - fechas `YYYY-MM-DD`
  - CUIT solo digitos
  - importes decimales con punto

### F4 - Cierre documental y handoff (Semana 4)
- Publicar matriz de diffs cerrada.
- Confirmar consistencia entre runtime y documentacion canónica.
- Dejar criterios de cierre y pendientes reales claramente delimitados.

## 8. Matriz de diffs (runtime vs documentacion)
| Tema | Runtime real | Documentacion actual | Gap | Accion planificada | Prioridad | Evidencia base |
|---|---|---|---|---|---|---|
| Estados de factura | `pendiente|extraida|validada|aplicada|error|rechazada` | Hay textos que asumen restricciones parciales | Riesgo de interpretacion inconsistente | Unificar contrato en docs API/OCR | Alta | Migracion `20260223010000` |
| Reextraccion OCR | Sin guarda fuerte de estado en ambos lados | Se documenta como pendiente previa | Duplicacion/race posible | Doble guarda + politica de reintento | Alta | `api-minimarket` + `facturas-ocr` |
| Respuesta `/extraer` | Payload simple actual | OpenAPI describe estructura mas rica | Drift de contrato | Definir payload final incremental | Alta | `docs/api-openapi-3.1.yaml` + runtime |
| `estado_match` de items | `auto_match|alias_match|fuzzy_pendiente|confirmada|rechazada` | Partes de docs listan variantes no finales | Inconsistencia semantica | Normalizar enums en docs y tipos FE | Media | Migracion + apiClient |
| Confidence OCR | Se guarda score global, sin bloqueo en aplicar | Docs no definen politica final | Riesgo operacional en stock | Definir umbral y bloqueo por policy | Alta | `facturas-ocr` + `aplicar` |
| CUIT proveedor | Deteccion y resolucion implementadas | Falta canónico 11 digitos en contrato | Matching fragil | Estandarizar normalizacion CUIT | Alta | helpers + index OCR |

## 9. Escenarios de prueba planificados
1. Deteccion CUIT en formatos con guion, punto y espacios.
2. Normalizacion CUIT a 11 digitos para lookup.
3. Reextraccion valida desde `error` y bloqueo para estados invalidos.
4. Prevencion de duplicacion de items en reintento.
5. Bloqueo de aplicacion por baja confianza.
6. Coherencia entre runtime, OpenAPI y API_README.
7. Lote completo con estado por documento (`ok|partial|failed`).

## 10. Criterios de aceptacion global
- 100% de documentos del lote con estado final asignado.
- Evidencia OCR presente para campos criticos.
- Inconsistencias y ambiguedades registradas en `issues`.
- Perfil proveedor utilizable en produccion.
- Contrato API y documentacion sin drift relevante.

## 11. Riesgos y mitigaciones
- Riesgo: OCR con baja calidad de imagen.
  - Mitigacion: score por campo/global + bloqueo de aplicacion y revision humana.
- Riesgo: reintentos generan duplicados.
  - Mitigacion: guarda de estado + limpieza previa de items + trazabilidad de eventos.
- Riesgo: CUIT inconsistente por formato.
  - Mitigacion: normalizacion canonica y validacion de 11 digitos.
- Riesgo: drift documental.
  - Mitigacion: matriz de diffs y actualizacion canónica al cierre.

## 12. Supuestos y defaults
- Umbral inicial sugerido: `OCR_MIN_SCORE_APPLY = 0.70`.
- CUIT canónico: 11 digitos sin separadores.
- Procesamiento de lote piloto en carpeta `proveedores_facturas_temp`.
- Este documento describe planificacion final; no implica ejecucion tecnica en esta etapa.

## 13. Anexos de referencia tecnica
- `supabase/functions/facturas-ocr/index.ts`
- `supabase/functions/facturas-ocr/helpers.ts`
- `supabase/functions/api-minimarket/index.ts`
- `supabase/migrations/20260223010000_create_facturas_ingesta.sql`
- `supabase/migrations/20260223060000_add_supplier_profiles_and_enhanced_pricing.sql`
- `docs/api-openapi-3.1.yaml`
- `docs/API_README.md`
- `tests/unit/facturas-ocr-helpers.test.ts`
