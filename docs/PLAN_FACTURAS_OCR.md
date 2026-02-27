# Plan de Implementacion: Facturas de Proveedores / OCR

**Fecha:** 2026-02-27
**Autor:** Claude (Codex)
**Estado:** PROPUESTA — Requiere aprobacion humana antes de ejecutar.
**Alcance:** Sistema completo de gestion de facturas de proveedores con OCR.

---

## 1. Estado Actual — Lo que YA esta implementado (REAL)

### 1.1 Backend (Edge Functions)

| Componente | Archivo | Lineas | Estado |
|------------|---------|--------|--------|
| OCR Pipeline | `supabase/functions/facturas-ocr/index.ts` | 452 | Operativo |
| Helpers OCR | `supabase/functions/facturas-ocr/helpers.ts` | 272 | Operativo |
| API Extraer | `api-minimarket` → `POST /facturas/{id}/extraer` | ~40 | Operativo |
| API Validar | `api-minimarket` → `PUT /facturas/items/{id}/validar` | ~90 | Operativo |
| API Aplicar | `api-minimarket` → `POST /facturas/{id}/aplicar` | ~105 | Operativo |

**Funciones implementadas en helpers.ts (13 exports):**
- `parseArgentineNumber()` — Formato argentino 1.234,56 → 1234.56
- `normalizeUnit()` — kg/kgs/kilo → kg, lt/l/litro → lt, u/un/unidad → u, etc.
- `normalizeText()` — Lowercase + quita acentos + quita caracteres especiales
- `parsePackSize()` — Extrae pack NxM y AxBxC (ej: 20X500 → 20u, 12X3X250 → 36u)
- `calculateUnitCost()` — Precio bulto / unidades × (1 + IVA si corresponde)
- `crossValidateSubtotal()` — Valida qty × precio ≈ subtotal (ok/warning/error)
- `enhanceLineItem()` — Combina pack + costo unitario + validacion
- `extractCuit()` — Extrae CUIT argentino (XX-XXXXXXXX-X) del texto OCR
- `parseOcrText()` — Parsea texto OCR completo → OcrResult estructurado
- Tipos: `SupplierProfile`, `OcrLineItem`, `EnhancedLineItem`, `OcrResult`, `MatchResult`

**Matching de productos (3 capas):**
1. **Layer 1 — Barcode/SKU:** Match exacto si descripcion es 8-13 digitos → confianza 1.0
2. **Layer 2 — Alias:** Match exacto contra `producto_aliases.alias_normalizado` → confianza 0.9
3. **Layer 3 — Fuzzy:** ilike sobre `productos.nombre` con primeras 3 palabras → confianza 0.5
4. **Sin match:** confianza 0.0, estado `fuzzy_pendiente`

**Deteccion automatica de proveedor:**
- `extractCuit()` detecta CUIT del texto OCR (etiquetado y no etiquetado)
- `resolveProveedorByCuit()` busca el CUIT en `proveedores.cuit` y retorna `{id, nombre}`
- `datos_extraidos` se enriquece con `cuit_detectado` + `proveedor_nombre`
- Warning `CUIT_PROVEEDOR_MISMATCH` si proveedor detectado ≠ seleccionado

### 1.2 Base de Datos

| Tabla | Migracion | Columnas clave |
|-------|-----------|----------------|
| `facturas_ingesta` | 20260223010000 | proveedor_id, tipo_comprobante, numero, fecha_factura, total, estado, imagen_url, datos_extraidos (jsonb), score_confianza |
| `facturas_ingesta_items` | 20260223010000 + 20260223060000 | factura_id, descripcion_original, producto_id, alias_usado, cantidad, unidad, precio_unitario, subtotal, estado_match, confianza_match, unidades_por_bulto, precio_unitario_costo, validacion_subtotal, notas_calculo |
| `facturas_ingesta_eventos` | 20260223010000 | factura_id, evento, datos (jsonb), usuario_id |
| `producto_aliases` | 20260223020000 | alias_texto, alias_normalizado (GENERATED), producto_id, proveedor_id, confianza, origen, activo |
| `precios_compra` | 20260223030000 | producto_id, proveedor_id, precio_unitario, factura_ingesta_item_id, origen. Trigger: actualiza `productos.precio_costo` |
| `supplier_profiles` | 20260223060000 | proveedor_id (UNIQUE), precio_es_bulto, iva_incluido, iva_tasa, pack_size_regex, notas |

**Storage:** Bucket `facturas` (privado, 10MB max, MIME: jpeg/png/webp/pdf)

**Constraint de idempotencia:** `UNIQUE(proveedor_id, tipo_comprobante, numero, fecha_factura)`

**FK trazabilidad:** `movimientos_deposito.factura_ingesta_item_id` → liga movimiento de stock a item de factura

### 1.3 Frontend

| Componente | Archivo | Lineas | Descripcion |
|------------|---------|--------|-------------|
| Pagina principal | `Facturas.tsx` | 528 | Tabla de facturas + panel de items + validacion inline |
| Upload | `FacturaUpload.tsx` | 187 | Drag & drop + file/camera, preview, upload a Storage |
| Hooks | `useFacturas.ts` | 140 | useFacturas, useFacturaItems, useCreateFactura, useValidarFacturaItem, useAplicarFactura |
| API Client | `apiClient.ts` (facturas section) | ~65 | extraer(), validarItem(), aplicar() |

**Maquina de estados de factura:**
```
pendiente → extraida → validada → aplicada
    ↓          ↓          ↓
  error      error      error
```

**Maquina de estados de item:**
```
auto_match ──→ confirmada
alias_match ─→ confirmada
fuzzy_pendiente → confirmada | rechazada
```

### 1.4 Tests

| Archivo | Tests | Cobertura |
|---------|-------|-----------|
| `tests/unit/facturas-ocr-helpers.test.ts` | 69 | 100% de helpers exportados |
| `minimarket-system/src/pages/Facturas.test.tsx` | 12 | Render + interaccion basica |
| **Total facturas-specific** | **81** | — |

### 1.5 Endpoints en OpenAPI

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | `/facturas/{id}/extraer` | admin/deposito | Trigger OCR + matching |
| PUT | `/facturas/items/{id}/validar` | admin/deposito | Confirmar/rechazar item |
| POST | `/facturas/{id}/aplicar` | admin/deposito | Aplicar al deposito |

---

## 2. Gaps Identificados — Problemas y Limitaciones Actuales

### 2.1 Criticos (Bloquean uso en produccion real)

| ID | Gap | Impacto | Detalle |
|----|-----|---------|---------|
| G-01 | **Sin fallback si GCV_API_KEY falta o falla** | ALTO | Si GCV API no responde → 503, factura queda en `error` sin recovery path. No hay OCR alternativo. |
| G-02 | **No se puede re-procesar una factura en estado `error`** | ALTO | Estado `error` es terminal. El usuario no puede reintentar la extraccion OCR sin intervencion directa en BD. |
| G-03 | **N+1 queries en matchItem()** | MEDIO-ALTO | Cada item hace 3 HTTP requests secuenciales a Supabase. Factura de 50 items = 150 requests. Timeout risk real. |
| G-04 | **Items se insertan uno a uno** | MEDIO | No hay batch insert. Factura de 100 items = 100 POSTs secuenciales. Lento y fragil. |
| G-05 | **Fallo parcial silencioso** | MEDIO | Si item 47 de 100 falla en insert, se pierde sin log. No hay retry ni rollback parcial. |

### 2.2 Funcionales (Limitan la utilidad del sistema)

| ID | Gap | Impacto | Detalle |
|----|-----|---------|---------|
| G-06 | **No se soportan PDFs** | MEDIO | El bucket acepta PDFs pero GCV TEXT_DETECTION espera imagenes. No hay conversion PDF → imagen. |
| G-07 | **Confianza OCR no se usa para filtrar** | BAJO | `score_confianza` se guarda pero nunca se alerta ni bloquea extracciones de baja confianza. |
| G-08 | **Alias confidence no se usa en matching** | BAJO | `producto_aliases.confianza` (alta/media/baja) existe pero Layer 2 siempre retorna 0.9. |
| G-09 | **No hay historial de precios visible** | BAJO | `precios_compra` se llena al aplicar pero no hay UI para consultar evolucion de precios por producto/proveedor. |
| G-10 | **Validacion de subtotal es solo informativa** | BAJO | Items con `validacion_subtotal = 'error'` (>2% desviacion) pueden confirmarse igual. |
| G-11 | **Sin deteccion de duplicados cross-factura** | MEDIO | Si suben la misma factura 2 veces con imagen diferente, se crea. UNIQUE solo evita mismo (proveedor, tipo, numero, fecha). |
| G-12 | **No hay bulk upload** | MEDIO | Solo se puede subir 1 factura a la vez desde el UI. |
| G-13 | **Sin soporte multi-pagina** | MEDIO | Si la factura tiene 2+ paginas (comun en PDFs), solo se procesa la primera imagen. |

### 2.3 Performance

| ID | Gap | Impacto | Detalle |
|----|-----|---------|---------|
| G-14 | **Sin cache de aliases** | MEDIO | Cada matchItem() consulta producto_aliases desde cero. Deberia cachearse por request. |
| G-15 | **Sin paginacion en tabla de facturas** | BAJO | `useFacturas()` trae las ultimas 50, pero no hay paginacion para historico. |
| G-16 | **Sin rate limiting en OCR** | BAJO | No hay throttle de invocaciones a GCV API. Uso abusivo podria generar costos altos. |

### 2.4 Seguridad

| ID | Gap | Impacto | Detalle |
|----|-----|---------|---------|
| G-17 | **supplier_profiles SELECT abierto** | BAJO | RLS: `USING(true)` permite que cualquier usuario autenticado lea todos los perfiles de pricing. |
| G-18 | **Sin limpieza de imagenes** | BAJO | Bucket `facturas` acumula imagenes indefinidamente. Sin policy de retention. |
| G-19 | **Sin sanitizacion de alias_texto** | BAJO | Usuario ingresa alias libre. No es XSS (no se renderiza como HTML) pero podria crear aliases confusos. |

---

## 3. Plan de Implementacion — Fases

### FASE 1: Robustez y Recovery (Impacto critico)

**Objetivo:** Hacer el flujo actual resiliente para uso con proveedores reales.

#### F1-T1: Permitir re-extraccion de facturas en estado `error`

**Archivos a modificar:**
- `supabase/functions/api-minimarket/index.ts` — endpoint `POST /facturas/{id}/extraer`
- `minimarket-system/src/pages/Facturas.tsx` — boton "Reintentar" para facturas en estado error

**Logica:**
- Modificar la validacion para aceptar estado `pendiente` O `error` (actualmente solo `pendiente`)
- Al re-extraer: borrar items anteriores (`DELETE facturas_ingesta_items WHERE factura_id`), resetear `datos_extraidos`
- Registrar evento `ocr_reintento` en `facturas_ingesta_eventos`

**Tests:** +3 tests (retry exitoso, retry tras error, idempotencia)

#### F1-T2: Batch insert de items + manejo de fallo parcial

**Archivos a modificar:**
- `supabase/functions/facturas-ocr/index.ts` — reemplazar loop individual por batch insert

**Logica:**
- Pre-calcular todos los matches y enhancements en un array
- INSERT en un solo request a `/rest/v1/facturas_ingesta_items` con `Prefer: return=representation`
- Si falla el batch: intentar insercion individual como fallback
- Registrar items_errores en el evento `ocr_completado`

**Tests:** +2 tests (batch exitoso, fallback individual)

#### F1-T3: Cache de aliases por request

**Archivos a modificar:**
- `supabase/functions/facturas-ocr/index.ts` — pre-fetch aliases antes del loop

**Logica:**
- Antes del loop de items: `SELECT alias_normalizado, producto_id, alias_texto FROM producto_aliases WHERE activo = true`
- Almacenar en `Map<string, {producto_id, alias_texto}>` como in-memory cache
- Modificar `matchItem()` para consultar el cache en Layer 2 antes de ir a Supabase

**Tests:** +2 tests (match con cache, miss con fallback a DB)

#### F1-T4: Pre-fetch de productos para barcode matching

**Archivos a modificar:**
- `supabase/functions/facturas-ocr/index.ts`

**Logica:**
- Antes del loop: extraer los items cuya descripcion sea 8-13 digitos
- Hacer un solo `SELECT id, codigo_barras, sku FROM productos WHERE codigo_barras IN (...) OR sku IN (...)`
- Cache local por request

**Tests:** +1 test (batch barcode lookup)

---

### FASE 2: Soporte PDF y Multi-Pagina

**Objetivo:** Permitir subir facturas en PDF (formato mas comun de proveedores argentinos).

#### F2-T1: Conversion PDF → imagenes

**Archivos a modificar:**
- `supabase/functions/facturas-ocr/index.ts` — detectar MIME type y convertir si es PDF
- `supabase/functions/facturas-ocr/helpers.ts` — agregar helper de deteccion de MIME

**Opcion A — Ghostscript/Poppler en Deno:** Usar `pdf-to-img` o `pdfjs-dist` para convertir cada pagina a PNG.
**Opcion B — GCV DOCUMENT_TEXT_DETECTION:** Usar `DOCUMENT_TEXT_DETECTION` en vez de `TEXT_DETECTION` que soporta PDFs nativamente (hasta 5 paginas).

**Recomendacion:** **Opcion B** (GCV `DOCUMENT_TEXT_DETECTION`) — cero dependencias adicionales, soporta multi-pagina nativo.

**Logica:**
- Detectar MIME type del archivo descargado (por extension o magic bytes)
- Si es PDF: usar `DOCUMENT_TEXT_DETECTION` con inputConfig `{ mimeType: 'application/pdf', content: base64 }`
- Si es imagen: mantener `TEXT_DETECTION` actual
- Concatenar texto de todas las paginas antes de parsear

**Tests:** +4 tests (PDF detection, multi-page concat, fallback a TEXT_DETECTION para imagenes)

#### F2-T2: Multi-imagen por factura

**Archivos a modificar:**
- `supabase/migrations/` — nueva migracion: columna `imagen_urls` (text[] array) en facturas_ingesta
- `minimarket-system/src/components/FacturaUpload.tsx` — permitir multiples archivos
- `supabase/functions/facturas-ocr/index.ts` — iterar sobre multiples imagenes

**Logica:**
- Permitir N imagenes por factura (front/back, multi-page photos)
- OCR cada imagen → concatenar textos → parsear una vez
- Mantener `imagen_url` deprecado para backward compat, usar `imagen_urls[]` si existe

**Tests:** +3 tests

---

### FASE 3: Mejora de Matching y Aliases

**Objetivo:** Reducir el porcentaje de `fuzzy_pendiente` para acelerar la validacion manual.

#### F3-T1: Weighted alias matching

**Archivos a modificar:**
- `supabase/functions/facturas-ocr/helpers.ts` — nueva funcion `weightedAliasConfidence()`
- `supabase/functions/facturas-ocr/index.ts` — usar confianza del alias en el match

**Logica:**
- Si alias.confianza = `alta` → confianza_match = 0.95
- Si alias.confianza = `media` → confianza_match = 0.85
- Si alias.confianza = `baja` → confianza_match = 0.70
- Actualizar `confianza_match` en el resultado de Layer 2

**Tests:** +3 tests

#### F3-T2: Auto-learning de aliases

**Archivos a modificar:**
- `supabase/functions/api-minimarket/index.ts` — endpoint `PUT /facturas/items/{id}/validar`

**Logica:**
- Al confirmar un item con `guardar_alias = true`:
  - Si ya existe el alias con confianza `media`, promover a `alta`
  - Si existe con `baja`, promover a `media`
  - Si no existe, crear con `media` y origen `ocr`
- Al rechazar un item que tenia alias_match:
  - Degradar confianza del alias (alta→media, media→baja, baja→desactivar)

**Tests:** +4 tests (promocion, degradacion, creacion, desactivacion)

#### F3-T3: Fuzzy matching mejorado con Levenshtein

**Archivos a modificar:**
- `supabase/functions/facturas-ocr/helpers.ts` — nueva funcion `levenshteinDistance()`
- `supabase/functions/facturas-ocr/index.ts` — Layer 3 mejorado

**Logica:**
- Reemplazar `ilike` simple por Levenshtein distance sobre nombre normalizado
- Pre-fetch top 100 productos del proveedor (o globales si nuevo proveedor)
- Calcular distancia para cada producto, retornar el mejor si distancia < threshold
- Confianza = 1 - (distancia / max_length) → tipicamente 0.5-0.8

**Tests:** +5 tests (match exacto, match cercano, no match, threshold, normalizacion)

#### F3-T4: Alias por proveedor (scoped matching)

**Archivos a modificar:**
- `supabase/functions/facturas-ocr/index.ts` — pasar `proveedor_id` al matching

**Logica:**
- En Layer 2, primero buscar alias con `proveedor_id = factura.proveedor_id`
- Si no hay match con proveedor especifico, buscar alias global (proveedor_id IS NULL)
- Esto permite que "LECHE ENTERA" sea "Leche La Serenisima 1L" para un proveedor y "Leche Milkaut 1L" para otro

**Tests:** +3 tests (match por proveedor, fallback global, sin match)

---

### FASE 4: UX y Flujo de Trabajo

**Objetivo:** Mejorar la experiencia del usuario para flujo diario de recepcion de mercaderia.

#### F4-T1: Dashboard de facturas pendientes

**Archivos a modificar:**
- `minimarket-system/src/pages/Facturas.tsx` — agregar seccion de metricas
- `minimarket-system/src/hooks/queries/useFacturas.ts` — agregar query de conteo por estado

**Logica:**
- Al inicio de la pagina: cards con conteo por estado (pendientes, extraidas, validadas, aplicadas, errores)
- Filtros rapidos por estado, proveedor, rango de fechas
- Ordenamiento por fecha, total, confianza

#### F4-T2: Boton camara directa (mobile-first)

**Archivos a modificar:**
- `minimarket-system/src/components/FacturaUpload.tsx`

**Logica:**
- En pantallas moviles: boton prominente "Sacar Foto" que abre camara directamente
- Preview de la foto tomada con opcion de recortar/rotar
- Compresion automatica a 80% JPEG si la imagen supera 5MB

#### F4-T3: Historial de precios por producto/proveedor

**Archivos a modificar:**
- Nueva pagina o seccion: `PreciosCompraHistory.tsx`
- Nuevo hook: `usePreciosCompra(productoId, proveedorId)`
- Endpoint: `GET /precios-compra?producto_id=X&proveedor_id=Y&order=created_at.desc&limit=20`

**Logica:**
- Grafico de linea con evolucion del precio en el tiempo
- Tabla con detalle: fecha, proveedor, precio, origen (factura/manual), link a factura

#### F4-T4: Paginacion y busqueda en tabla de facturas

**Archivos a modificar:**
- `minimarket-system/src/pages/Facturas.tsx`
- `minimarket-system/src/hooks/queries/useFacturas.ts`

**Logica:**
- Paginacion server-side (offset/limit)
- Busqueda por numero de factura, CUIT, proveedor
- Rango de fechas

#### F4-T5: Vista de imagen junto a items

**Archivos a modificar:**
- `minimarket-system/src/pages/Facturas.tsx` — layout side-by-side

**Logica:**
- Al ver items de una factura: mostrar la imagen original a la izquierda
- Zoom/pan sobre la imagen para referencia cruzada
- Requiere: URL firmada temporal desde Storage (via `createSignedUrl`)

---

### FASE 5: Operaciones Avanzadas

**Objetivo:** Funcionalidades para operacion a escala.

#### F5-T1: Bulk upload (multiples facturas)

**Archivos a modificar:**
- `minimarket-system/src/components/FacturaBulkUpload.tsx` (nuevo)
- `minimarket-system/src/pages/Facturas.tsx`

**Logica:**
- Seleccionar proveedor + N archivos
- Crear N registros `facturas_ingesta` en una transaccion
- Encolar extracciones OCR en paralelo (maximo 3 concurrentes)
- Progress bar por factura

#### F5-T2: Recepcion de mercaderia con validacion cruzada

**Archivos a modificar:**
- Nueva pagina: `RecepcionMercaderia.tsx`
- Endpoint: `POST /compras/recepcion` (ya existe en OpenAPI, verificar implementacion)

**Logica:**
- Vincular factura validada con recepcion fisica de mercaderia
- Checklist interactivo: marcar items recibidos, reportar faltantes/sobrantes
- Comparar items factura vs items recibidos → generar alerta de discrepancia
- Al confirmar recepcion: aplicar movimientos de stock

#### F5-T3: Notas de credito y devoluciones

**Archivos a modificar:**
- `supabase/functions/api-minimarket/index.ts` — logica especial para `tipo_comprobante = 'nota_credito'`
- `minimarket-system/src/pages/Facturas.tsx` — UI diferenciada

**Logica:**
- Al aplicar una nota de credito: crear movimientos_deposito de tipo `salida` (no `entrada`)
- Validar que la nota de credito referencia una factura original
- Restar del stock en vez de sumar

#### F5-T4: Exportacion de datos (CSV/Excel)

**Archivos a modificar:**
- `minimarket-system/src/pages/Facturas.tsx` — boton "Exportar"

**Logica:**
- Exportar facturas filtradas a CSV
- Incluir: proveedor, numero, fecha, total, cantidad items, estado, confianza
- Opcion de exportar items detallados con precios originales y calculados

#### F5-T5: Reportes de proveedores

**Archivos a modificar:**
- Nueva pagina o seccion: `ProveedorReport.tsx`

**Logica:**
- Total facturado por proveedor en periodo
- Top productos por proveedor
- Variacion de precios por producto
- Porcentaje de match automatico vs manual por proveedor

---

### FASE 6: Automatizacion y Calidad

**Objetivo:** Reducir intervencion humana y mejorar calidad de los datos.

#### F6-T1: Rate limiting en OCR

**Archivos a modificar:**
- `supabase/functions/facturas-ocr/index.ts`

**Logica:**
- Maximo 10 extracciones OCR por minuto por usuario
- Conteo via tabla auxiliar o Redis
- Retornar 429 Too Many Requests si se excede

#### F6-T2: Limpieza automatica de imagenes

**Archivos a modificar:**
- Nueva edge function: `cron-facturas-cleanup`
- O agregar al cron existente

**Logica:**
- Facturas en estado `aplicada` con mas de 90 dias → mover imagen a cold storage o eliminar
- Facturas en estado `error`/`rechazada` con mas de 30 dias → eliminar imagen
- Registrar evento de limpieza

#### F6-T3: Alertas de confianza baja

**Archivos a modificar:**
- `supabase/functions/facturas-ocr/index.ts` — despues de OCR
- `minimarket-system/src/pages/Facturas.tsx` — indicador visual

**Logica:**
- Si `score_confianza < 0.5` → registrar evento `ocr_baja_confianza`
- En el frontend: badge de warning "Confianza baja" en amarillo/rojo
- Sugerir re-subir imagen con mejor calidad

#### F6-T4: Validacion de subtotal bloqueante (configurable)

**Archivos a modificar:**
- `supplier_profiles` — nueva columna `bloquear_error_subtotal` (boolean, default false)
- `Facturas.tsx` — deshabilitar "Confirmar" si validacion = error y flag activo

**Logica:**
- Si el supplier profile tiene `bloquear_error_subtotal = true`, no permitir confirmar items con `validacion_subtotal = 'error'`
- El usuario debe corregir manualmente cantidad o precio antes de confirmar

#### F6-T5: Deteccion de duplicados inteligente

**Archivos a modificar:**
- `supabase/functions/api-minimarket/index.ts` — en creacion de factura
- `minimarket-system/src/pages/Facturas.tsx` — modal de warning

**Logica:**
- Al crear factura: buscar facturas existentes del mismo proveedor con total similar (±5%) y fecha cercana (±7 dias)
- Si hay candidatos: mostrar modal "Posible duplicado: Factura #X del DD/MM. Continuar?"
- El usuario decide si es duplicado o factura nueva

---

## 4. Matriz de Prioridad

| Fase | Tarea | Complejidad | Impacto | Prioridad |
|------|-------|-------------|---------|-----------|
| 1 | F1-T1 Re-extraccion tras error | Baja | Critico | **P0** |
| 1 | F1-T2 Batch insert items | Media | Alto | **P0** |
| 1 | F1-T3 Cache aliases por request | Baja | Alto | **P0** |
| 1 | F1-T4 Pre-fetch barcodes | Baja | Medio | **P1** |
| 2 | F2-T1 Soporte PDF | Media | Alto | **P1** |
| 2 | F2-T2 Multi-imagen | Alta | Medio | **P2** |
| 3 | F3-T1 Weighted alias confidence | Baja | Medio | **P1** |
| 3 | F3-T2 Auto-learning aliases | Media | Alto | **P1** |
| 3 | F3-T3 Fuzzy Levenshtein | Alta | Medio | **P2** |
| 3 | F3-T4 Alias por proveedor | Baja | Alto | **P1** |
| 4 | F4-T1 Dashboard facturas | Baja | Medio | **P1** |
| 4 | F4-T2 Boton camara mobile | Baja | Medio | **P2** |
| 4 | F4-T3 Historial precios | Media | Medio | **P2** |
| 4 | F4-T4 Paginacion/busqueda | Media | Medio | **P1** |
| 4 | F4-T5 Vista imagen + items | Media | Alto | **P1** |
| 5 | F5-T1 Bulk upload | Media | Medio | **P2** |
| 5 | F5-T2 Recepcion mercaderia | Alta | Alto | **P2** |
| 5 | F5-T3 Notas de credito | Media | Medio | **P3** |
| 5 | F5-T4 Export CSV/Excel | Baja | Bajo | **P3** |
| 5 | F5-T5 Reportes proveedores | Media | Medio | **P3** |
| 6 | F6-T1 Rate limiting OCR | Baja | Bajo | **P3** |
| 6 | F6-T2 Limpieza imagenes | Baja | Bajo | **P3** |
| 6 | F6-T3 Alertas confianza | Baja | Medio | **P2** |
| 6 | F6-T4 Validacion bloqueante | Baja | Medio | **P2** |
| 6 | F6-T5 Deteccion duplicados | Media | Medio | **P2** |

**Leyenda:** P0 = Ejecutar primero, P1 = Segundo bloque, P2 = Tercer bloque, P3 = Cuando haya capacidad

---

## 5. Orden de Ejecucion Recomendado

### Bloque 1 — Robustez (P0)
1. F1-T1: Re-extraccion tras error
2. F1-T2: Batch insert de items
3. F1-T3: Cache de aliases por request

### Bloque 2 — Funcionalidad Core (P1)
4. F1-T4: Pre-fetch barcodes
5. F3-T4: Alias scoped por proveedor
6. F3-T1: Weighted alias confidence
7. F3-T2: Auto-learning de aliases
8. F2-T1: Soporte PDF (DOCUMENT_TEXT_DETECTION)
9. F4-T1: Dashboard de facturas
10. F4-T4: Paginacion y busqueda
11. F4-T5: Vista imagen junto a items

### Bloque 3 — Mejoras (P2)
12. F6-T3: Alertas de confianza baja
13. F6-T4: Validacion subtotal bloqueante
14. F6-T5: Deteccion de duplicados
15. F2-T2: Multi-imagen por factura
16. F3-T3: Fuzzy matching Levenshtein
17. F4-T2: Boton camara mobile
18. F4-T3: Historial de precios
19. F5-T1: Bulk upload
20. F5-T2: Recepcion mercaderia cruzada

### Bloque 4 — Avanzado (P3)
21. F5-T3: Notas de credito
22. F5-T4: Export CSV/Excel
23. F5-T5: Reportes de proveedores
24. F6-T1: Rate limiting OCR
25. F6-T2: Limpieza de imagenes

---

## 6. Dependencias Externas

| Dependencia | Estado | Accion requerida |
|-------------|--------|------------------|
| `GCV_API_KEY` (Google Cloud Vision) | Configurado en secretos Supabase | Monitorear costos. Considerar presupuesto mensual. |
| Supabase Storage | Bucket `facturas` activo | Monitorear almacenamiento. |
| Supabase Edge Functions (Deno) | 15/15 deployed | Verificar limites de invocacion. |
| Internet en punto de venta | Requerido para OCR | Considerar modo offline con cola de procesamiento. |

---

## 7. Metricas de Exito

| Metrica | Actual | Objetivo Bloque 1 | Objetivo Bloque 2 |
|---------|--------|--------------------|--------------------|
| % items auto_match | Desconocido | Medir baseline | >40% |
| % items alias_match | Desconocido | Medir baseline | >30% |
| % items fuzzy_pendiente | Desconocido | Medir baseline | <30% |
| Tiempo promedio extraccion | ~15s estimado | <10s | <10s |
| Facturas procesadas/dia | 0 (no en uso) | >5 | >20 |
| Error rate OCR | Desconocido | Medir baseline | <5% |

---

**Nota:** Este documento es una PROPUESTA. No se debe ejecutar ninguna tarea sin aprobacion explicita del usuario. Cada fase puede ajustarse segun feedback del uso real del sistema.
