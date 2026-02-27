# Plan de Implementacion: Facturas de Proveedores / OCR

**Fecha:** 2026-02-27
**Version:** 2.0 (definitiva — post-auditoria cruzada)
**Autor:** Claude (Codex)
**Estado:** PROPUESTA — Requiere aprobacion humana antes de ejecutar.
**Alcance:** Sistema completo de gestion de facturas de proveedores con OCR.

---

## 1. Estado Actual — Lo que YA esta implementado (REAL, verificado contra codebase)

### 1.1 Backend (Edge Functions)

| Componente | Archivo | Lineas | Estado |
|------------|---------|--------|--------|
| OCR Pipeline | `supabase/functions/facturas-ocr/index.ts` | 406 | Operativo |
| Helpers OCR | `supabase/functions/facturas-ocr/helpers.ts` | 272 | Operativo |
| API Extraer | `api-minimarket` → `POST /facturas/{id}/extraer` | ~40 | Operativo |
| API Validar | `api-minimarket` → `PUT /facturas/items/{id}/validar` | ~90 | Operativo |
| API Aplicar | `api-minimarket` → `POST /facturas/{id}/aplicar` | ~105 | Operativo |

**Funciones implementadas en helpers.ts (15 exports: 9 funciones + 1 constante + 5 tipos):**
- `parseArgentineNumber()` — Formato argentino 1.234,56 → 1234.56
- `normalizeUnit()` — kg/kgs/kilo → kg, lt/l/litro → lt, u/un/unidad → u, etc.
- `normalizeText()` — Lowercase + quita acentos + quita caracteres especiales
- `parsePackSize()` — Extrae pack NxM y AxBxC (ej: 20X500 → 20u, 12X3X250 → 36u)
- `calculateUnitCost()` — Precio bulto / unidades × (1 + IVA si corresponde)
- `crossValidateSubtotal()` — Valida qty × precio ≈ subtotal (ok/warning/error)
- `enhanceLineItem()` — Combina pack + costo unitario + validacion
- `extractCuit()` — Extrae CUIT argentino (XX-XXXXXXXX-X) del texto OCR
- `parseOcrText()` — Parsea texto OCR completo → OcrResult estructurado
- `DEFAULT_SUPPLIER_PROFILE` — Config por defecto: bulto=true, iva_incluido=false, iva_tasa=0.21
- Tipos: `SupplierProfile`, `OcrLineItem`, `EnhancedLineItem`, `OcrResult`, `MatchResult`

**Funciones internas en index.ts (no exportadas):**
- `fetchSupplierProfile()` — Busca config de pricing por proveedor, fallback a defaults
- `resolveProveedorByCuit()` — Resuelve CUIT detectado → {id, nombre} de proveedores
- `matchItem()` — Matching 3 capas (ver abajo)
- `updateFacturaEstado()` — Best-effort PATCH de estado (con .catch vacío)
- `registrarEvento()` — Best-effort INSERT en eventos (con .catch vacío)

**Matching de productos (3 capas, secuencial):**
1. **Layer 1 — Barcode/SKU:** Match exacto si descripcion es 8-13 digitos → confianza 1.0, estado `auto_match`
2. **Layer 2 — Alias:** Match exacto contra `producto_aliases.alias_normalizado` → confianza 0.9, estado `alias_match`
3. **Layer 3 — Fuzzy:** ilike sobre `productos.nombre` con primeras 3 palabras (>2 chars) → confianza 0.5, estado `fuzzy_pendiente`
4. **Sin match:** confianza 0.0, estado `fuzzy_pendiente`

**Nota critica de performance:** Cada item ejecuta las 3 capas como 3 HTTP requests independientes a Supabase REST API, secuencialmente con timeout de 5s cada uno.

**Deteccion automatica de proveedor:**
- `extractCuit()` detecta CUIT del texto OCR (formatos: CUIT: XX-XXXXXXXX-X, C.U.I.T., CUIT Nº, sin etiqueta)
- `resolveProveedorByCuit()` busca el CUIT en `proveedores.cuit` y retorna `{id, nombre}`
- `datos_extraidos` se enriquece con `cuit_detectado` + `proveedor_nombre`
- Warning `CUIT_PROVEEDOR_MISMATCH` en logs si proveedor detectado ≠ seleccionado (no visible en frontend)

### 1.2 Base de Datos (6 migraciones especificas)

| Tabla | Migracion | Columnas clave |
|-------|-----------|----------------|
| `facturas_ingesta` | 20260223010000 | proveedor_id (FK), tipo_comprobante, numero, fecha_factura, total (12,2), estado (enum), imagen_url, datos_extraidos (jsonb), score_confianza (5,2), request_id, created_by |
| `facturas_ingesta_items` | 20260223010000 + 060000 | factura_id (FK CASCADE), descripcion_original, producto_id (FK SET NULL), alias_usado, cantidad, unidad, precio_unitario, subtotal, estado_match (enum), confianza_match, unidades_por_bulto, precio_unitario_costo (12,4), validacion_subtotal, notas_calculo |
| `facturas_ingesta_eventos` | 20260223010000 | factura_id (FK CASCADE), evento (text), datos (jsonb), usuario_id, created_at |
| `producto_aliases` | 20260223020000 | alias_texto, alias_normalizado (GENERATED STORED), producto_id (FK CASCADE), proveedor_id (FK SET NULL), confianza (alta/media/baja), origen (manual/ocr/cuaderno), activo |
| `precios_compra` | 20260223030000 | producto_id (FK), proveedor_id (FK), precio_unitario (12,2), factura_ingesta_item_id (FK), origen (manual/factura/recepcion). **Trigger:** `fn_update_precio_costo()` → actualiza `productos.precio_costo` en INSERT |
| `supplier_profiles` | 20260223060000 | proveedor_id (FK UNIQUE), precio_es_bulto, iva_incluido, iva_tasa (default 21.00), pack_size_regex, notas, activo |

**Migraciones adicionales:**
- `20260223040000` — Storage bucket `facturas` (privado, 10MB max, MIME: jpeg/png/webp/pdf)
- `20260223050000` — FK `movimientos_deposito.factura_ingesta_item_id` (trazabilidad stock ← factura)

**Constraints:**
- Idempotencia factura: `UNIQUE(proveedor_id, tipo_comprobante, numero, fecha_factura) NULLS NOT DISTINCT`
- Idempotencia movimiento: `UNIQUE(factura_ingesta_item_id)` parcial en movimientos_deposito
- Alias unico por proveedor: `UNIQUE(alias_normalizado, proveedor_id) NULLS NOT DISTINCT`

**RLS:**
- facturas_ingesta/items/eventos: SELECT/INSERT/UPDATE para admin, administrador, deposito. DELETE solo admin.
- producto_aliases: SELECT para todos los autenticados. INSERT/UPDATE para admin, deposito.
- supplier_profiles: **SELECT abierto** (`USING(true)`). INSERT/UPDATE para admin, deposito.
- Storage: Upload/download para admin, deposito. Delete solo admin.

### 1.3 Frontend

| Componente | Archivo | Lineas | Descripcion |
|------------|---------|--------|-------------|
| Pagina principal | `minimarket-system/src/pages/Facturas.tsx` | 528 | Tabla de facturas + panel de items + validacion inline |
| Upload | `minimarket-system/src/components/FacturaUpload.tsx` | 187 | Drag & drop + file/camera, preview, upload a Storage |
| Hooks | `minimarket-system/src/hooks/queries/useFacturas.ts` | 140 | useFacturas, useFacturaItems, useCreateFactura, useValidarFacturaItem, useAplicarFactura |
| API Client | `minimarket-system/src/lib/apiClient.ts` (seccion facturas) | ~65 | extraer(), validarItem(), aplicar() |

**Hooks React Query:**
- `useFacturas()` — Lista facturas (limit 50, staleTime 2min, order created_at DESC)
- `useFacturaItems(facturaId)` — Items de una factura (habilitado solo si facturaId definido)
- `useCreateFactura()` — Mutation para crear factura_ingesta
- `useValidarFacturaItem(facturaId)` — Mutation para validar/rechazar item
- `useAplicarFactura()` — Mutation para aplicar factura al deposito

**Maquina de estados de factura:**
```
pendiente → extraida → validada → aplicada
    ↓          ↓          ↓
  error      error      error      rechazada
```

**Maquina de estados de item:**
```
auto_match ──→ confirmada (terminal)
alias_match ─→ confirmada (terminal)
fuzzy_pendiente → confirmada (terminal) | rechazada (terminal)
```
**Problema detectado:** Los estados `confirmada` y `rechazada` son terminales. No hay forma de revertir una decision sin editar la BD directamente.

### 1.4 Tests (verificados)

| Archivo | Tests | Cobertura |
|---------|-------|-----------|
| `tests/unit/facturas-ocr-helpers.test.ts` | 69 | 100% de funciones helpers |
| `minimarket-system/src/pages/Facturas.test.tsx` | 8 | Render basico + interaccion |
| **Total facturas-specific** | **77** | — |

### 1.5 Endpoints

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | `/facturas/{id}/extraer` | JWT admin/deposito | Invoca facturas-ocr EF via service_role |
| PUT | `/facturas/items/{id}/validar` | JWT admin/deposito | Confirmar/rechazar item + opcion guardar alias |
| POST | `/facturas/{id}/aplicar` | JWT admin/deposito | Crear movimientos_deposito + precios_compra |

---

## 2. Gaps Identificados — Problemas y Limitaciones Actuales

### 2.1 Criticos (Bloquean uso robusto en produccion)

| ID | Gap | Impacto | Detalle |
|----|-----|---------|---------|
| G-01 | **Sin fallback si GCV_API_KEY falta o falla** | ALTO | GCV API no responde → 503, factura queda en `error`. Falla de GCV no tiene retry. Sin OCR alternativo. |
| G-02 | **Re-extraccion no limpia items anteriores** | ALTO | Si se re-extrae (estado error → pendiente), los items viejos persisten y se duplican con los nuevos. El frontend solo muestra boton "Extraer" para estado `pendiente`. |
| G-03 | **N+1 queries en matchItem()** | ALTO | 3 HTTP requests secuenciales por item. 50 items = 150 requests (+ 50 INSERTs). Timeout real en facturas grandes. |
| G-04 | **Items se insertan uno a uno** | MEDIO | For loop secuencial con INSERT individual. Factura de 100 items = 100 POSTs. Lento y fragil. |
| G-05 | **Fallo parcial silencioso** | MEDIO | Si item N falla en insert: `if (insertRes.ok) itemsCreated++` — no se logea cual fallo ni por que. Sin retry ni detalle de error. |
| G-06 | **Race condition en /aplicar** | ALTO | Dos llamadas concurrentes a `/aplicar` ambas pasan el check de estado=validada. Sin optimistic locking. Riesgo de movimientos duplicados (mitigado parcial por UNIQUE en `factura_ingesta_item_id`). |
| G-07 | **Fallo parcial en aplicar sin rollback** | ALTO | Si `precios_compra` INSERT falla: movimiento_deposito ya creado. Solo se logea warning. Inconsistencia silenciosa: stock movido pero precio no registrado. |
| G-08 | **Items rechazados son irreversibles** | MEDIO | Estado `rechazada` es terminal en UI (botones desaparecen). No hay "Re-abrir" ni "Deshacer rechazo". Error humano irrecuperable sin BD. |

### 2.2 Funcionales (Limitan la utilidad del sistema)

| ID | Gap | Impacto | Detalle |
|----|-----|---------|---------|
| G-09 | **No se soportan PDFs para OCR** | MEDIO | Bucket acepta PDFs. GCV `TEXT_DETECTION` no los procesa. Se necesita `DOCUMENT_TEXT_DETECTION`. |
| G-10 | **CUIT mismatch no visible en frontend** | MEDIO | `resolveProveedorByCuit()` detecta mismatch y logea warning server-side. Frontend NO muestra esta advertencia. El usuario no sabe que la factura es de otro proveedor. |
| G-11 | **Sin feedback visual durante OCR (15+ seg)** | MEDIO | Solo el boton muestra spinner. No hay progress bar, skeleton, ni mensaje de "procesando". UI parece congelada. Timeout de API: 35s. |
| G-12 | **Alias confidence no se usa en matching** | BAJO | `producto_aliases.confianza` (alta/media/baja) existe pero Layer 2 siempre retorna 0.9 fijo. |
| G-13 | **Confianza OCR no se usa para alertar** | BAJO | `score_confianza` se guarda pero nunca se alerta ni bloquea extracciones de baja confianza (<0.5). |
| G-14 | **No hay historial de precios visible** | BAJO | `precios_compra` se llena al aplicar pero no hay UI para consultar evolucion de precios. |
| G-15 | **Validacion de subtotal es solo informativa** | BAJO | Items con `validacion_subtotal = 'error'` (>2% desviacion) pueden confirmarse igual. |
| G-16 | **Sin deteccion de duplicados cross-factura** | MEDIO | UNIQUE evita mismo (proveedor, tipo, numero, fecha). Pero misma factura con imagen distinta o datos parciales se crea como nueva. |
| G-17 | **No hay bulk upload** | MEDIO | Solo 1 factura a la vez desde UI. |
| G-18 | **Sin soporte multi-pagina** | MEDIO | Factura de 2+ paginas (comun en PDFs largos o fotos frente/dorso): solo procesa 1 imagen. |
| G-19 | **Alias save silencioso si falla** | MEDIO | Al confirmar item con `guardar_alias=true`: si INSERT alias falla → solo logger.warn. Item queda confirmado pero alias no se guardo. Sin feedback al usuario. |

### 2.3 Performance

| ID | Gap | Impacto | Detalle |
|----|-----|---------|---------|
| G-20 | **Sin cache de aliases** | MEDIO | Cada matchItem() consulta `producto_aliases` via HTTP. Cache in-memory por request eliminaria la mayoria de las queries. |
| G-21 | **Sin paginacion en tabla de facturas** | BAJO | `useFacturas()` trae las ultimas 50. Sin paginacion para historico completo. |
| G-22 | **Timeouts hardcodeados** | BAJO | 7 valores de timeout distintos en index.ts (3s, 5s, 10s, 15s). No configurables por entorno. |
| G-23 | **Sin rate limiting en OCR** | BAJO | No hay throttle en invocaciones a GCV API. Riesgo de costos altos en uso abusivo. |

### 2.4 Seguridad

| ID | Gap | Impacto | Detalle |
|----|-----|---------|---------|
| G-24 | **supplier_profiles SELECT abierto** | BAJO | RLS: `USING(true)` — cualquier autenticado lee toda la config de pricing. |
| G-25 | **Sin limpieza de imagenes** | BAJO | Bucket `facturas` acumula indefinidamente. Sin retention policy. |
| G-26 | **Audit logs best-effort** | BAJO | `registrarEvento()` y `updateFacturaEstado()` usan `.catch(() => {})`. Fallas en audit trail pasan desapercibidas. Sin log ni alerta. |

---

## 3. Plan de Implementacion — Fases

### FASE 1: Robustez y Recovery (Impacto critico — pre-requisito para uso real)

**Objetivo:** Eliminar los gaps criticos que impiden usar el sistema con proveedores reales.

#### F1-T1: Re-extraccion segura de facturas en estado `error`

**Archivos a modificar:**
- `supabase/functions/api-minimarket/index.ts` — endpoint `POST /facturas/{id}/extraer`
- `minimarket-system/src/pages/Facturas.tsx` — boton "Reintentar" para facturas en error

**Logica:**
- Backend: aceptar estado `pendiente` O `error` en la validacion del endpoint
- Al re-extraer con items existentes: `DELETE FROM facturas_ingesta_items WHERE factura_id = $1`
- Resetear `datos_extraidos = null`, `score_confianza = null` antes de invocar OCR
- Registrar evento `ocr_reintento` con metadatos del intento anterior
- Frontend: mostrar boton "Reintentar OCR" en facturas con estado `error`

**Resuelve:** G-02
**Tests:** +3 (retry exitoso, cleanup de items viejos, evento registrado)

#### F1-T2: Batch insert de items + logging de fallos

**Archivos a modificar:**
- `supabase/functions/facturas-ocr/index.ts` — paso 10 (loop de items)

**Logica:**
- Pre-calcular todos los matches y enhancements en un array
- INSERT batch: un solo POST a `/rest/v1/facturas_ingesta_items` con array de objetos y `Prefer: return=representation`
- Si batch falla (ej: un item viola constraint): fallback a insercion individual
- Para cada fallo individual: logear `{ item_index, descripcion, error }` en array
- Incluir `items_fallidos` en evento `ocr_completado` y en response

**Resuelve:** G-04, G-05
**Tests:** +3 (batch exitoso, fallback individual, log de fallidos)

#### F1-T3: Cache de aliases y barcodes por request

**Archivos a modificar:**
- `supabase/functions/facturas-ocr/index.ts` — pre-fetch antes del loop de items

**Logica:**
- Antes del loop: 2 queries paralelas:
  1. `SELECT alias_normalizado, producto_id, alias_texto, confianza FROM producto_aliases WHERE activo = true`
  2. `SELECT id, codigo_barras, sku FROM productos WHERE codigo_barras IS NOT NULL OR sku IS NOT NULL`
- Almacenar en `Map<string, ...>` como caches in-memory
- Refactorizar `matchItem()` para recibir los caches como parametro
- Layer 1: buscar en cache de barcodes antes de HTTP
- Layer 2: buscar en cache de aliases antes de HTTP
- Layer 3 (fuzzy): mantener query HTTP (requiere ilike server-side)
- Resultado: de 3 HTTP requests por item → 0-1 HTTP requests por item

**Resuelve:** G-03, G-20, y subsume F1-T4 del plan v1
**Tests:** +4 (match barcode via cache, match alias via cache, miss con fallback, cache vacio)

#### F1-T4: Fix race condition en /aplicar

**Archivos a modificar:**
- `supabase/functions/api-minimarket/index.ts` — endpoint `POST /facturas/{id}/aplicar`

**Logica:**
- Cambiar el PATCH de estado a `aplicada` al INICIO (antes de procesar items), no al final
- Usar PATCH con `estado=eq.validada` como WHERE (optimistic lock): si otra request ya cambio el estado, el PATCH afecta 0 rows
- Verificar rows affected: si 0 → retornar 409 Conflict "Factura ya esta siendo procesada"
- Si el proceso falla despues del lock: revertir estado a `validada`

**Resuelve:** G-06
**Tests:** +2 (applicacion normal, conflicto concurrente)

#### F1-T5: Mostrar CUIT mismatch como warning en UI

**Archivos a modificar:**
- `minimarket-system/src/pages/Facturas.tsx` — panel de items

**Logica:**
- Leer `datos_extraidos.cuit_detectado` y `datos_extraidos.proveedor_nombre` del record de factura
- Si `cuit_detectado` existe y `proveedor_nombre` no coincide con el proveedor seleccionado: mostrar banner warning amarillo encima de la tabla de items
- Texto: "CUIT detectado: {cuit} ({nombre}). No coincide con el proveedor seleccionado."

**Resuelve:** G-10
**Tests:** +1 (warning visible cuando mismatch)

---

### FASE 2: Soporte PDF y UX de Extraccion

**Objetivo:** Soportar el formato mas comun de facturas y mejorar feedback al usuario.

#### F2-T1: Soporte PDF via DOCUMENT_TEXT_DETECTION

**Archivos a modificar:**
- `supabase/functions/facturas-ocr/index.ts` — paso 8 (GCV API call)
- `supabase/functions/facturas-ocr/helpers.ts` — helper `detectMimeType()`

**Logica:**
- Detectar MIME type por extension de `imagen_url` (`.pdf` vs `.jpg`/`.png`/`.webp`)
- Si PDF: usar GCV `DOCUMENT_TEXT_DETECTION` con `inputConfig: { mimeType: 'application/pdf', content: base64 }` — soporta hasta 5 paginas nativamente
- Si imagen: mantener `TEXT_DETECTION` actual
- Concatenar texto de todas las paginas antes de `parseOcrText()`
- Esto resuelve tambien el soporte multi-pagina para PDFs

**Resuelve:** G-09, G-18 (para PDFs)
**Dependencia:** Ninguna
**Tests:** +4 (detectMimeType para pdf/jpg/png/webp, DOCUMENT_TEXT_DETECTION config)

#### F2-T2: Feedback visual durante procesamiento OCR

**Archivos a modificar:**
- `minimarket-system/src/pages/Facturas.tsx` — estado visual de procesamiento

**Logica:**
- Al clickear "Extraer OCR": mostrar overlay en la fila de la factura con spinner + mensaje "Extrayendo texto... Esto puede tardar hasta 30 segundos."
- Agregar estado intermedio visual: icono de reloj/procesando en la columna "Estado"
- Al completar (exito o error): transicion animada al nuevo estado
- Timeout visual: si pasan 35 segundos sin respuesta → mostrar "La extraccion esta tardando mas de lo esperado. Por favor espere."

**Resuelve:** G-11
**Tests:** +2 (overlay aparece, overlay desaparece en exito/error)

#### F2-T3: Multi-imagen por factura (fotos frente/dorso)

**Archivos a modificar:**
- Nueva migracion: `ALTER TABLE facturas_ingesta ADD COLUMN imagen_urls text[]`
- `minimarket-system/src/components/FacturaUpload.tsx` — permitir N archivos
- `supabase/functions/facturas-ocr/index.ts` — iterar sobre multiples imagenes
- `minimarket-system/src/hooks/queries/useFacturas.ts` — leer imagen_urls

**Logica:**
- FacturaUpload: permitir seleccion multiple (max 5 archivos, 10MB cada uno)
- Guardar en `imagen_urls[]` (backward compat: si `imagen_urls` vacio, usar `imagen_url`)
- OCR: iterar cada imagen → GCV → concatenar todos los textos → parsear una vez
- Frontend: mostrar thumbnails de todas las imagenes

**Resuelve:** G-18 (para fotos multiples)
**Dependencia:** F2-T1 (para PDFs multi-pagina ya cubierto)
**Tests:** +3 (upload multiple, OCR concatena, backward compat)

---

### FASE 3: Mejora de Matching y Aliases

**Objetivo:** Reducir `fuzzy_pendiente` para acelerar la validacion manual.
**Dependencias internas:** F3-T4 → F3-T1 → F3-T2 (orden obligatorio)

#### F3-T1: Alias scoped por proveedor (matching prioritario)

**Archivos a modificar:**
- `supabase/functions/facturas-ocr/index.ts` — pasar `proveedor_id` a matchItem() y al cache de aliases

**Logica:**
- En Layer 2 (alias matching), buscar en 2 fases con orden de prioridad:
  1. Primero: aliases con `proveedor_id = factura.proveedor_id` → confianza 0.95
  2. Segundo: aliases globales (`proveedor_id IS NULL`) → confianza 0.85
- Esto permite que "LECHE ENTERA" mapee a productos distintos segun proveedor
- Compatible con cache: particionar el Map por proveedor_id + null

**Resuelve:** Parte de G-12 (matching de alias)
**Dependencia:** F1-T3 (cache de aliases necesita incluir proveedor_id)
**Tests:** +3 (match proveedor-specific, fallback global, sin match)

#### F3-T2: Weighted alias confidence

**Archivos a modificar:**
- `supabase/functions/facturas-ocr/index.ts` — Layer 2 usa `alias.confianza`

**Logica:**
- Con aliases ya en cache (F1-T3) y scoped (F3-T1):
  - `alta` → confianza_match = 0.95
  - `media` → confianza_match = 0.85
  - `baja` → confianza_match = 0.70
- Valores reemplazan el 0.9 fijo actual

**Resuelve:** G-12
**Dependencia:** F3-T1
**Tests:** +3 (alta, media, baja)

#### F3-T3: Auto-learning de aliases

**Archivos a modificar:**
- `supabase/functions/api-minimarket/index.ts` — endpoint `PUT /facturas/items/{id}/validar`

**Logica:**
- Al confirmar con `guardar_alias = true`:
  - Si alias ya existe con confianza `media` → UPDATE a `alta`
  - Si existe con `baja` → UPDATE a `media`
  - Si no existe → INSERT con `media`, origen `ocr`
  - Si INSERT falla → log error Y notificar al usuario (no silenciar)
- Al rechazar un item que tenia `alias_match`:
  - Degradar: `alta` → `media`, `media` → `baja`, `baja` → `activo = false`

**Resuelve:** G-19 (silent alias failure), mejora G-12 (confianza crece con uso)
**Dependencia:** F3-T2 (necesita weighted confidence)
**Tests:** +5 (promocion alta, degradacion, creacion nueva, desactivacion, error handling)

#### F3-T4: Fuzzy matching mejorado con Levenshtein

**Archivos a modificar:**
- `supabase/functions/facturas-ocr/helpers.ts` — nueva funcion `levenshteinDistance()`
- `supabase/functions/facturas-ocr/index.ts` — Layer 3 refactorizado

**Logica:**
- Pre-fetch top 200 productos (o filtrados por proveedor si tiene catalogo conocido)
- Para cada item sin match en L1/L2: calcular Levenshtein normalizado contra cada producto
- Retornar mejor match si `similaridad >= 0.6`
- Confianza = max(0.4, similaridad) → tipicamente 0.5-0.8
- Fallback a ilike actual si pre-fetch de productos falla

**Resuelve:** Mejora Layer 3 (actualmente muy impreciso con ilike)
**Dependencia:** F1-T3 (beneficia del pre-fetch)
**Tests:** +5 (match exacto normalizado, match cercano, no match por threshold, multiples candidatos, fallback)

---

### FASE 4: UX y Flujo de Trabajo

**Objetivo:** Mejorar la experiencia del usuario para flujo diario.

#### F4-T1: Permitir re-validacion de items rechazados

**Archivos a modificar:**
- `supabase/functions/api-minimarket/index.ts` — validar endpoint acepta re-abrir items
- `minimarket-system/src/pages/Facturas.tsx` — boton "Re-abrir" en items rechazados

**Logica:**
- Backend: permitir cambiar estado de `rechazada` → `fuzzy_pendiente` (re-abre item)
- Solo si factura en estado `extraida` (no `validada` ni `aplicada`)
- Si factura estaba en `validada` y se re-abre un item → factura vuelve a `extraida`
- Frontend: icono "Re-abrir" visible en items rechazados de facturas no aplicadas

**Resuelve:** G-08
**Tests:** +3 (re-abrir exitoso, bloqueado en aplicada, factura vuelve a extraida)

#### F4-T2: Dashboard de facturas con filtros

**Archivos a modificar:**
- `minimarket-system/src/pages/Facturas.tsx` — seccion de metricas + filtros
- `minimarket-system/src/hooks/queries/useFacturas.ts` — query parametrizado

**Logica:**
- Cards resumen: conteo por estado (pendientes, extraidas, validadas, aplicadas, error)
- Filtros: estado, proveedor, rango de fechas
- Ordenamiento: fecha (asc/desc), total, confianza
- Query server-side con parametros de filtro

**Tests:** +2 (filtros cambian query, conteo por estado)

#### F4-T3: Paginacion y busqueda

**Archivos a modificar:**
- `minimarket-system/src/pages/Facturas.tsx`
- `minimarket-system/src/hooks/queries/useFacturas.ts`

**Logica:**
- Paginacion server-side (offset/limit, 20 por pagina)
- Busqueda por: numero de factura, nombre de proveedor (ilike)
- Navegacion: primera, anterior, siguiente, ultima

**Resuelve:** G-21
**Tests:** +2 (paginacion, busqueda)

#### F4-T4: Vista de imagen junto a items (side-by-side)

**Archivos a modificar:**
- `minimarket-system/src/pages/Facturas.tsx` — layout dividido
- `minimarket-system/src/hooks/queries/useFacturas.ts` — obtener signed URL

**Logica:**
- Al expandir items de una factura: layout 2 columnas (imagen izq, items der)
- Imagen: obtener URL firmada temporal via `supabase.storage.createSignedUrl('facturas', imagen_url, 3600)`
- Zoom/pan sobre imagen con scroll y pinch (usar lib ligera o CSS transform)
- En mobile: tabs "Imagen" / "Items" en vez de side-by-side

**Resuelve:** Necesidad critica de UX — el usuario necesita ver la factura mientras valida items
**Tests:** +2 (signed URL obtenida, layout responsive)

#### F4-T5: Boton camara directa (mobile-first)

**Archivos a modificar:**
- `minimarket-system/src/components/FacturaUpload.tsx`

**Logica:**
- En `viewport < 768px`: boton "Sacar Foto" prominente con `capture="environment"` en input file
- Preview con opcion de rotar
- Compresion automatica a JPEG 80% si imagen > 5MB (canvas API)
- Mantener drag & drop para desktop

**Tests:** +1 (compresion activa si > 5MB)

---

### FASE 5: Operaciones Avanzadas

**Objetivo:** Funcionalidades para operacion a escala.

#### F5-T1: Historial de precios por producto/proveedor

**Archivos a modificar:**
- Seccion nueva en pagina de Productos o Proveedores (no nueva pagina standalone)
- Nuevo hook: `usePreciosCompra(productoId?, proveedorId?)`

**Logica:**
- Tabla expandible con historial: fecha, proveedor, precio unitario, origen, link a factura
- Grafico sparkline simple de tendencia (ultimos 10 precios)
- Query: `SELECT * FROM precios_compra WHERE producto_id = $1 ORDER BY created_at DESC LIMIT 20`

**Resuelve:** G-14
**Tests:** +2

#### F5-T2: Bulk upload (multiples facturas)

**Archivos a modificar:**
- `minimarket-system/src/components/FacturaBulkUpload.tsx` (nuevo)
- `minimarket-system/src/pages/Facturas.tsx`

**Logica:**
- Seleccionar proveedor + N archivos (max 10)
- Crear N registros `facturas_ingesta` secuencialmente
- Encolar OCR en paralelo (max 3 concurrentes via Promise pool)
- Progress bar global + por factura

**Resuelve:** G-17
**Tests:** +3

#### F5-T3: Recepcion de mercaderia con validacion cruzada

**Archivos a modificar:**
- Nueva pagina: `RecepcionMercaderia.tsx`
- Endpoint: `POST /compras/recepcion` (ya declarado en OpenAPI, requiere implementacion)

**Logica:**
- Vincular factura validada con recepcion fisica de mercaderia
- Checklist: marcar items recibidos, reportar faltantes/sobrantes/danados
- Comparar items factura vs items recibidos → alerta de discrepancia
- Solo al confirmar recepcion completa: aplicar movimientos de stock

**Dependencia:** Requiere endpoint `POST /compras/recepcion` implementado
**Tests:** +5

#### F5-T4: Notas de credito y devoluciones

**Archivos a modificar:**
- `supabase/functions/api-minimarket/index.ts` — logica para `tipo_comprobante = 'nota_credito'`
- `minimarket-system/src/pages/Facturas.tsx` — UI diferenciada (colores, iconos, labels)

**Logica:**
- Al aplicar nota de credito: movimientos_deposito tipo `salida` (no `entrada`)
- Restar del stock (cantidades negativas o tipo salida)
- UI: color diferenciado (rojo/gris) para notas de credito

**Tests:** +3

#### F5-T5: Exportacion CSV

**Archivos a modificar:**
- `minimarket-system/src/pages/Facturas.tsx` — boton "Exportar"

**Logica:**
- Exportar facturas filtradas a CSV client-side
- Columnas: proveedor, numero, fecha, total, items, estado, confianza, cuit_detectado
- Opcion de exportar items detallados (un row por item con precios originales y calculados)
- Descarga directa via Blob + download link

**Tests:** +1

#### F5-T6: Reportes de proveedores

**Archivos a modificar:**
- Seccion nueva en pagina Proveedores (no pagina standalone)

**Logica:**
- Total facturado por proveedor en periodo seleccionado
- Top 10 productos por monto/cantidad
- Variacion de precios (%)
- Porcentaje match automatico vs manual (indicador de calidad OCR por proveedor)

**Tests:** +2

---

### FASE 6: Automatizacion y Calidad

**Objetivo:** Reducir intervencion humana y mejorar calidad de datos.

#### F6-T1: Deteccion de duplicados inteligente

**Archivos a modificar:**
- `minimarket-system/src/hooks/queries/useFacturas.ts` — query de duplicados potenciales
- `minimarket-system/src/pages/Facturas.tsx` — modal de warning

**Logica:**
- Al crear factura: buscar existentes del mismo proveedor con total similar (±5%) y fecha cercana (±7 dias)
- Si hay candidatos: modal "Posible duplicado: Factura #X del DD/MM. Continuar igualmente?"
- Decision del usuario: si es diferente → crea normal. Si es duplicado → cancela.

**Resuelve:** G-16
**Tests:** +2

#### F6-T2: Alertas de confianza baja

**Archivos a modificar:**
- `supabase/functions/facturas-ocr/index.ts` — despues de OCR
- `minimarket-system/src/pages/Facturas.tsx` — badge visual

**Logica:**
- Si `score_confianza < 0.5`: registrar evento `ocr_baja_confianza` + logear warning
- Frontend: badge "Confianza baja" en rojo junto al estado
- Tooltip: "La calidad de la imagen es baja. Considere subir una foto con mejor iluminacion."

**Resuelve:** G-13
**Tests:** +2

#### F6-T3: Validacion subtotal bloqueante (configurable por proveedor)

**Archivos a modificar:**
- Nueva migracion: `ALTER TABLE supplier_profiles ADD COLUMN bloquear_error_subtotal boolean DEFAULT false`
- `minimarket-system/src/pages/Facturas.tsx` — deshabilitar "Confirmar" si bloqueado

**Logica:**
- Si `supplier_profiles.bloquear_error_subtotal = true` y item tiene `validacion_subtotal = 'error'` (>2% desviacion) → boton "Confirmar" deshabilitado con tooltip "Corrija cantidad o precio. Desviacion >2%."
- El usuario debe editar cantidad o precio para que la validacion pase

**Resuelve:** G-15
**Tests:** +2

#### F6-T4: Rate limiting en OCR

**Archivos a modificar:**
- `supabase/functions/facturas-ocr/index.ts` — check al inicio

**Logica:**
- Consultar count de eventos `ocr_completado` del ultimo minuto para el proveedor
- Si > 10/minuto → retornar 429 "Demasiadas extracciones. Intente en 1 minuto."
- Contador basado en tabla `facturas_ingesta_eventos` (sin dependencia extra)

**Resuelve:** G-23
**Tests:** +1

#### F6-T5: Limpieza automatica de imagenes

**Archivos a modificar:**
- Agregar a cron existente o nueva edge function schedulada

**Logica:**
- Facturas `aplicada` con > 90 dias: eliminar imagen de Storage
- Facturas `error`/`rechazada` con > 30 dias: eliminar imagen
- Actualizar `imagen_url = null` tras eliminar
- Registrar evento de limpieza con bytes liberados

**Resuelve:** G-25
**Tests:** +2

---

## 4. Matriz de Prioridad

| Fase | ID | Tarea | Complejidad | Impacto | Resuelve | Prioridad |
|------|----|-------|-------------|---------|----------|-----------|
| 1 | F1-T1 | Re-extraccion segura | Baja | Critico | G-02 | **P0** |
| 1 | F1-T2 | Batch insert + log fallos | Media | Alto | G-04, G-05 | **P0** |
| 1 | F1-T3 | Cache aliases + barcodes | Media | Alto | G-03, G-20 | **P0** |
| 1 | F1-T4 | Fix race en /aplicar | Baja | Critico | G-06 | **P0** |
| 1 | F1-T5 | CUIT mismatch en UI | Baja | Medio | G-10 | **P0** |
| 2 | F2-T1 | Soporte PDF | Media | Alto | G-09, G-18 | **P1** |
| 2 | F2-T2 | Feedback visual OCR | Baja | Medio | G-11 | **P1** |
| 2 | F2-T3 | Multi-imagen | Alta | Medio | G-18 | **P2** |
| 3 | F3-T1 | Alias scoped proveedor | Baja | Alto | — | **P1** |
| 3 | F3-T2 | Weighted alias confidence | Baja | Medio | G-12 | **P1** |
| 3 | F3-T3 | Auto-learning aliases | Media | Alto | G-19 | **P1** |
| 3 | F3-T4 | Fuzzy Levenshtein | Alta | Medio | — | **P2** |
| 4 | F4-T1 | Re-validacion rechazados | Baja | Medio | G-08 | **P1** |
| 4 | F4-T2 | Dashboard + filtros | Baja | Medio | — | **P1** |
| 4 | F4-T3 | Paginacion/busqueda | Media | Medio | G-21 | **P1** |
| 4 | F4-T4 | Vista imagen + items | Media | Alto | — | **P1** |
| 4 | F4-T5 | Boton camara mobile | Baja | Bajo | — | **P2** |
| 5 | F5-T1 | Historial precios | Media | Medio | G-14 | **P2** |
| 5 | F5-T2 | Bulk upload | Media | Medio | G-17 | **P2** |
| 5 | F5-T3 | Recepcion mercaderia | Alta | Alto | — | **P2** |
| 5 | F5-T4 | Notas de credito | Media | Medio | — | **P3** |
| 5 | F5-T5 | Export CSV | Baja | Bajo | — | **P3** |
| 5 | F5-T6 | Reportes proveedores | Media | Medio | — | **P3** |
| 6 | F6-T1 | Deteccion duplicados | Media | Medio | G-16 | **P2** |
| 6 | F6-T2 | Alertas confianza | Baja | Medio | G-13 | **P2** |
| 6 | F6-T3 | Validacion bloqueante | Baja | Medio | G-15 | **P2** |
| 6 | F6-T4 | Rate limiting OCR | Baja | Bajo | G-23 | **P3** |
| 6 | F6-T5 | Limpieza imagenes | Baja | Bajo | G-25 | **P3** |

**Leyenda:** P0 = Ejecutar primero (critico), P1 = Segundo bloque (core), P2 = Tercer bloque (mejoras), P3 = Cuando haya capacidad

---

## 5. Orden de Ejecucion Recomendado

### Bloque 1 — Robustez (P0) — 5 tareas

```
F1-T1 → F1-T2 → F1-T3 → F1-T4 → F1-T5
                                     ↓
(Sistema listo para uso real con proveedores)
```

1. **F1-T1:** Re-extraccion segura tras error
2. **F1-T2:** Batch insert + logging de items fallidos
3. **F1-T3:** Cache de aliases + barcodes por request
4. **F1-T4:** Fix race condition en /aplicar
5. **F1-T5:** Mostrar CUIT mismatch en UI

**Criterio DONE Bloque 1:** Facturas reales de proveedores procesables end-to-end sin riesgo de data corruption.

### Bloque 2 — Funcionalidad Core (P1) — 9 tareas

```
F2-T1 ─────────────────────┐
F2-T2 ─────────────────────┤
F3-T1 → F3-T2 → F3-T3 ────┤ (cadena de dependencias)
F4-T1 ─────────────────────┤
F4-T2 ─────────────────────┤
F4-T3 ─────────────────────┤
F4-T4 ─────────────────────┘
```

6. **F2-T1:** Soporte PDF (DOCUMENT_TEXT_DETECTION)
7. **F2-T2:** Feedback visual durante OCR
8. **F3-T1:** Alias scoped por proveedor **(necesita F1-T3)**
9. **F3-T2:** Weighted alias confidence **(necesita F3-T1)**
10. **F3-T3:** Auto-learning de aliases **(necesita F3-T2)**
11. **F4-T1:** Re-validacion de items rechazados
12. **F4-T2:** Dashboard con filtros
13. **F4-T3:** Paginacion y busqueda
14. **F4-T4:** Vista imagen side-by-side

**Criterio DONE Bloque 2:** Sistema usable para operacion diaria. Matching mejora progresivamente con uso.

### Bloque 3 — Mejoras (P2) — 9 tareas

15. **F2-T3:** Multi-imagen por factura
16. **F3-T4:** Fuzzy matching Levenshtein
17. **F4-T5:** Boton camara mobile
18. **F5-T1:** Historial de precios
19. **F5-T2:** Bulk upload
20. **F5-T3:** Recepcion mercaderia cruzada
21. **F6-T1:** Deteccion de duplicados
22. **F6-T2:** Alertas de confianza baja
23. **F6-T3:** Validacion subtotal bloqueante

### Bloque 4 — Avanzado (P3) — 5 tareas

24. **F5-T4:** Notas de credito
25. **F5-T5:** Export CSV
26. **F5-T6:** Reportes de proveedores
27. **F6-T4:** Rate limiting OCR
28. **F6-T5:** Limpieza de imagenes

---

## 6. Dependencias Externas

| Dependencia | Estado | Accion requerida |
|-------------|--------|------------------|
| `GCV_API_KEY` (Google Cloud Vision) | Configurado en secretos Supabase | Monitorear costos mensualmente. Presupuesto estimado: 1000 paginas/mes ≈ USD 1.50. |
| Supabase Storage | Bucket `facturas` activo, 10MB/file | Monitorear almacenamiento total. Estimar 100 facturas/mes × 2MB = 200MB/mes. |
| Supabase Edge Functions (Deno) | 15/15 deployed | Verificar limites de invocacion (Free: 500K/mes, Pro: 2M/mes). |
| Internet en punto de venta | Requerido para OCR | Sin internet → upload en cola, OCR diferido. No implementado actualmente. |

---

## 7. Metricas de Exito

| Metrica | Actual | Post Bloque 1 | Post Bloque 2 |
|---------|--------|---------------|---------------|
| % items auto_match | Desconocido | Medir baseline | >40% |
| % items alias_match | Desconocido | Medir baseline | >35% |
| % items fuzzy_pendiente | Desconocido | Medir baseline | <25% |
| Tiempo extraccion (50 items) | ~15s + 150 HTTP calls | <8s (cache elimina ~100 calls) | <8s |
| Facturas procesadas/dia | 0 (no en uso) | >5 | >20 |
| Error rate OCR | Desconocido | Medir baseline | <5% |
| Items con fallo silencioso | Desconocido (no logueado) | 0 (logueado) | 0 |
| Race conditions en /aplicar | Posible (sin lock) | 0 (optimistic lock) | 0 |

---

## 8. Changelog del Plan

| Version | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2026-02-27 | Version inicial: 6 fases, 25 tareas, 19 gaps |
| 2.0 | 2026-02-27 | **Auditoria cruzada contra codebase.** +7 gaps criticos descubiertos (G-06..G-08, G-10, G-11, G-19, G-26). +3 tareas nuevas (F1-T4, F1-T5, F4-T1). Corregido conteo de exports (13→15), tests (81→77). Agregado grafo de dependencias entre tareas de Fase 3. Reordenado tareas por dependencias reales. Corregido F1-T1 (el backend ya no valida estado, el fix es cleanup+UI). Renumerado Fase 3 (scoped antes de weighted). Total: 6 fases, 28 tareas, 26 gaps. |

---

**NOTA FINAL:** Este documento es una PROPUESTA verificada. Ningun cambio de codigo se ejecuta sin aprobacion explicita del usuario. El plan se ajustara segun hallazgos durante la implementacion y el feedback del uso con proveedores reales.
