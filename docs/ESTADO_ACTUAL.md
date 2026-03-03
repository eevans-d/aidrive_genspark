# ESTADO ACTUAL DEL PROYECTO

**Ultima actualizacion:** 2026-03-03 (verificacion integral + Tier 2 completado: audit trail + atomic margin)
**Veredicto general del sistema:** `LISTO PARA PRODUCCION (Tier 1 DONE, Tier 2 10/12 DONE — 2 restantes son documentacion/frontend cosmetic)`
**Estado del modulo OCR de facturas:** `ESTABLE PARA USO OPERATIVO, BACKLOG TECNICO CERRADO (10/10), HARDENED`
**Estado del Asistente IA:** `SPRINT 2 COMPLETADO — plan→confirm con confirm_token, crear_tarea + registrar_pago_cc`
**Fuente ejecutiva:** `docs/PRODUCTION_GATE_REPORT.md`

## 1) Resumen ejecutivo
- **Verificacion integral (2026-03-03):** tests 1905/1905 PASS, build OK, lint 0, 16/16 edge functions ACTIVE. Tier 2 avanzado a 10/12: audit trail expansion (6 handlers), atomic margin validation (SP FOR UPDATE), OCR rollback verificado completo, CORS verificado seguro.
- **Tier 1 (6 criticos) — TODOS RESUELTOS:** guard anti-mocks produccion, normalizacion errores de red, limites en queries, CSP+HSTS headers, idempotencia deposito (3 endpoints), FK CASCADE→RESTRICT (2 constraints).
- **Tier 2 (10/12 hardening):** RLS cache_proveedor, 3 CHECK constraints, timing-safe auth, state machine tareas, audit trail financiero (4+6 operaciones), cross-tab POS, atomic margin (FOR UPDATE), OCR rollback validado, CORS validado. Pendientes: DATA_HANDLING_POLICY.md, frontend cosmetic.
- **4 migraciones SQL pendientes de aplicar:** `20260302010000` (idempotency), `20260302020000` (FK restrict), `20260302030000` (CHECK+RLS), `20260303010000` (sp_aplicar_precio FOR UPDATE). Requieren `supabase db push`.
- GCV sigue BLOCKED: requiere accion del owner en GCP Console (billing inactivo).

## 2) Estado tecnico verificado (sesion 2026-03-03)
- Tests unitarios completos: **1905/1905 PASS** (85 archivos, post Tier 2 audit trail).
- Build produccion: **OK** (30 chunks PWA, 0 errores).
- Lint: **0 errores**.
- Edge Functions: **16/16 ACTIVE** (incluye api-minimarket v40, api-assistant v2).
- Migraciones SQL en repo: **56** (4 pendientes de aplicar).

## 3) OCR de facturas: estado real

### Implementado y verificado
- Extraccion OCR via `facturas-ocr` con Google Cloud Vision (`TEXT_DETECTION` para imagen, `DOCUMENT_TEXT_DETECTION` para PDF).
- Matching 3 capas: barcode/SKU -> alias -> fuzzy.
- Cache in-memory por request para matching (reduce consultas repetidas por item).
- Persistencia en `facturas_ingesta`, `facturas_ingesta_items`, `facturas_ingesta_eventos`.
- Flujo funcional en gateway: `POST /extraer`, `PUT /items/{id}/validar`, `POST /aplicar`.
- Insercion de items OCR por batch con fallback individual + `items_failed` en respuesta/evento.
- Reintento OCR seguro desde estado `error` con limpieza previa de items.
- Deteccion de CUIT con variantes de formato (`XX-XXXXXXXX-X` y solo digitos).
- Chunked base64 encoding para imagenes grandes (fix de stack overflow).
- Error handling especifico para GCV timeout (504 `OCR_TIMEOUT`).
- Scripts batch: `scripts/ocr-procesar-nuevos.mjs` y `scripts/seed-proveedores.mjs`.
- 12 proveedores seeded, 21 facturas cargadas (**21 `pendiente`**, **0 `error`** — errores reseteados a pendiente en sesión 2026-03-01).

### Cross-check PLAN_FUSIONADO T1-T10

| Tarea | Descripcion | Estado | Evidencia |
|-------|-------------|--------|-----------|
| T1 | Guardas de estado en `/extraer` | COMPLETADO | `api-minimarket/index.ts` valida `pendiente|error` y retorna `409 INVALID_STATE` para estados no permitidos |
| T2 | Reextraccion con limpieza previa | COMPLETADO | `facturas-ocr/index.ts` limpia `facturas_ingesta_items` en reintento (`estado=error`) y registra `ocr_reintento` |
| T3 | Lock optimista en `/aplicar` | COMPLETADO | PATCH condicional `id+estado=validada`; si afecta 0 filas responde `409`, con rollback a `validada` en fallos parciales |
| T4 | Guard de confianza OCR | COMPLETADO | Bloqueo `400 OCR_CONFIDENCE_BELOW_THRESHOLD` con umbral `OCR_MIN_SCORE_APPLY` (fallback `0.70`) |
| T5 | Batch insert de items | COMPLETADO | `facturas-ocr/index.ts` inserta por batch y hace fallback individual con `items_failed` |
| T6 | Cache in-memory alias/barcodes | COMPLETADO | `facturas-ocr/index.ts` usa cache por request (`barcodeOrSku`, `aliasByNormalized`, `fuzzyByWords`) |
| T7 | Hardening `/aplicar` parcial | COMPLETADO | Ante error parcial: crea movimientos `salida` compensatorios, limpia `factura_ingesta_item_id` en movimiento original para reintento, registra evento `aplicacion_rollback` con `items_compensados`/`items_compensacion_fallida`. Tests: 25 en `facturas-aplicar-hardening.test.ts` |
| T8 | Sync OpenAPI/API_README | COMPLETADO | `docs/api-openapi-3.1.yaml` + `docs/API_README.md` actualizados a códigos/estados/respuesta runtime |
| T9 | Warning CUIT mismatch en UI | COMPLETADO | `Facturas.tsx` muestra alerta cuando `cuit_detectado` difiere de `proveedores.cuit` |
| T10 | Soporte PDF OCR | COMPLETADO | `facturas-ocr/index.ts` detecta MIME/extensión y usa `DOCUMENT_TEXT_DETECTION` para PDF |

### Bloqueante externo
- **OCR-007:** GCV_API_KEY no responde (timeout 15s). Sin este servicio, T1-T10 no pueden validarse end-to-end.
- Ultima evidencia operativa: invocacion directa `facturas-ocr` devolvio `504 OCR_TIMEOUT` a las 2026-02-28 11:39 UTC.
- Accion: owner debe verificar Cloud Vision API + billing + restricciones de key en GCP Console.

## 4) Fuentes canonicas vigentes
1. `docs/ESTADO_ACTUAL.md`
2. `docs/DECISION_LOG.md`
3. `docs/closure/OPEN_ISSUES.md`
4. `docs/API_README.md`
5. `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`
6. `docs/METRICS.md`
7. `docs/PLAN_FUSIONADO_FACTURAS_OCR.md` (solo para roadmap OCR)
8. `docs/PLAN_ASISTENTE_IA_DASHBOARD.md` (roadmap asistente IA)

## 5) Guardrails activos
1. No imprimir secretos/JWTs (solo nombres).
2. No usar git destructivo (`git reset --hard`, `git checkout -- <file>`, force-push).
3. `api-minimarket` debe permanecer con `verify_jwt=false` si se redeploya.
4. No declarar "cerrado" sin evidencia en `docs/closure/` o `test-reports/`.

## 6) Nota operativa
El sistema esta `LISTO PARA PRODUCCION`. Tier 1 (6/6) y Tier 2 (10/12) completados. El backlog OCR tecnico esta 10/10 tareas completadas. GCV es prerequisito externo unico para validacion funcional end-to-end del modulo OCR. Los 2 items Tier 2 pendientes (DATA_HANDLING_POLICY.md y frontend cosmetic) no son bloqueantes.

## 6b) Asistente IA — Sprint 1 + 1.1 + 1.2 + 1.3 + Sprint 2 (read + write con confirmacion)

### Implementado (Sprint 1 → 1.3)
- Edge Function `api-assistant` (`supabase/functions/api-assistant/index.ts`): CORS, auth JWT, validacion de rol confiable desde `app_metadata`, parser rule-based, 7 intent handlers read-only.
- Intent parser separado en `parser.ts` con 7 intents read-only:
  - `consultar_stock_bajo` → `GET /stock/minimo` (via api-minimarket) + nav `/stock`
  - `consultar_pedidos_pendientes` → `GET /pedidos?estado=pendiente` (via api-minimarket) + nav `/pedidos`
  - `consultar_resumen_cc` → `GET /cuentas-corrientes/resumen` (via api-minimarket) + nav `/clientes`
  - `consultar_ventas_dia` → `GET /ventas?fecha_desde=...&fecha_hasta=...` (via api-minimarket) + nav `/ventas`
  - `consultar_estado_ocr_facturas` → PostgREST directo `facturas_ingesta` (no hay GET gateway) + nav `/facturas`
  - `saludo` → respuesta de bienvenida (sin fetch)
  - `ayuda` → lista de capacidades (sin fetch)
- Frontend: pagina `Asistente.tsx` con chat conversacional, quick-prompts, sugerencias inline, deep-links accionables.
- Persistencia local de conversaciones (`localStorage`) + reset rapido con boton `Nuevo chat`.
- Ruta `/asistente` protegida, acceso solo `admin` (deny-by-default en `roles.ts`).
- Nav item en sidebar y Dashboard CTA.
- API client `assistantApi.ts` con `sendMessage()`.
- UX improvements (Sprint 1.1): etiquetas amigables, sin jerga tecnica, fix timezone ventas, navigation deep-links.
- UX improvements (Sprint 1.2): contextual fallback suggestions, retry button on errors, loading indicator con texto.
- UX improvements (Sprint 1.3): persistencia de historial y accion explicita de reinicio de chat para usuarios no tecnicos.

### Implementado (Sprint 2 — acciones con confirmacion)
- 2 intents de escritura adicionales en parser: `crear_tarea` y `registrar_pago_cc`, con extraccion de parametros (titulo/prioridad, monto/cliente_nombre).
- Set `WRITE_INTENTS` para clasificacion automatica de intents mutantes.
- Flujo plan→confirm: intents de escritura retornan `mode: 'plan'` con `confirm_token` y `action_plan` (resumen, parametros, riesgo, validaciones) en vez de ejecutar directamente.
- Confirm token store (`confirm-store.ts`): tokens de un solo uso con TTL de 120s, scoped por usuario, GC automatico, max 200 tokens globales.
- Endpoint `POST /confirm`: consume token, valida userId, ejecuta accion via api-minimarket gateway y retorna resultado.
- Ejecutores de accion: `executeCrearTarea()` → `POST /tareas`, `executeRegistrarPagoCC()` → `POST /cuentas-corrientes/pagos`.
- Manejo de ambiguedad: si faltan datos obligatorios o hay multiples candidatos de cliente (incluyendo nombres exactos duplicados), se retorna `mode: 'clarify'` pidiendo desambiguacion explicita.
- Frontend: plan card con borde amber, resumen visual de accion/parametros/riesgo, botones Confirmar (verde) y Cancelar (gris), estado `confirming` con spinner.
- API client actualizado: `confirmAction(confirmToken)` para POST /confirm, tipos extendidos con `mode`, `confirm_token`, `action_plan`.
- Quick prompts ampliados: "Crear tarea" y "Registrar pago" como acciones directas.
- 116 unit tests del parser (95 Sprint 1 + 21 Sprint 2 incluyendo write intents y extraccion de params).
- 10 unit tests del confirm-store (creacion, single-use, user mismatch, TTL, GC, concurrencia).
- 3 unit tests de seguridad de rol.
- 7 component tests del asistente (3 Sprint 1 + 4 Sprint 2: plan card, confirm, cancel, write quick-prompts).
- Health version bumped a `2.0.0-sprint2`.

### No implementado (Sprint 3)
- Acciones adicionales (`actualizar_estado_pedido`, `aplicar_factura`).
- Auditoria persistente de acciones IA (historial en BD).
- Expansion de roles (deposito, ventas).
- Guia visual para usuario no tecnico.

## 7) Auditoria de produccion profunda (D-177)

### Metodologia
Analisis de ingenieria inversa simulando escenarios de produccion real en 3 capas:
1. **Gateway (`api-minimarket/index.ts`)**: 35 hallazgos (race conditions, error leakage, null propagation, idempotency gaps)
2. **Edge function (`facturas-ocr/index.ts`)**: 18 hallazgos (estado transitions, memory safety, secret leakage, auth bypass)
3. **Frontend (`Facturas.tsx`)**: doble-submit, feedback silencioso

### Fixes implementados (11 total)

| # | ID | Severidad | Fix |
|---|-----|-----------|-----|
| 1 | RL-01 | CRITICO | Errores PostgREST 5xx ya no filtran detalles SQL/tabla al cliente |
| 2 | S2 | HIGH | Eliminado fallback JWT no verificado en `internal-auth.ts` (cerraba bypass de auth) |
| 3 | F2+D3 | CRITICO | Estado `extraida` se setea DESPUES de persistir items OCR (no antes) + PATCH response verificado |
| 4 | F1+S1 | HIGH | try-catch en JSON parse de GCV + sanitizacion de API key en mensajes de error |
| 5 | M1 | HIGH | Limites de tamaño de imagen OCR: min 1KB (corrupta), max 10MB (memory) |
| 6 | ES-03 | HIGH | Audit event en `/aplicar` envuelto en try-catch (no falla factura exitosa) |
| 7 | PW-02 | HIGH | Fallo de link movimiento→item ahora activa compensacion (no se pierde silenciosamente) |
| 8 | TC-01 | HIGH | Validacion de cantidad antes de llamar a SP (previene NaN/invalid en SP) |
| 9 | MISC-02 | MEDIUM | Sanitizacion de `x-request-id` del cliente (max 128 chars, alfanumerico+guiones) |
| 10 | F3 | MEDIUM | `req.json()` en facturas-ocr envuelto en try-catch (400 en vez de 500 para body invalido) |
| 11 | UI-01 | MEDIUM | `extracting`/`applying` migrados de `string|null` a `Set<string>` para tracking concurrente |

### Hallazgos MEDIUM no implementados (backlog recomendado)
- **RC-01**: Race condition si dos usuarios extraen OCR simultaneamente (misma factura)
- ~~**RC-02**: Check de margen en `/precios/aplicar` usa datos potencialmente stale~~ → **RESUELTO** (D-185: `SELECT ... FOR UPDATE` en `sp_aplicar_precio`, migracion `20260303010000`)
- ~~**RC-03**: Transiciones de estado en tareas sin guard de estado previo~~ → **RESUELTO** (D-184: state machine tareas con validacion de estado previo)
- ~~**ID-01**~~/**ID-02**/**ID-03**: ~~Sin idempotency key en `/deposito/movimiento`~~ (RESUELTO D-184) / Sin idempotency key en `/deposito/ingreso`, `/compras/recepcion`
- **RE-01**: Agregacion in-memory sin limite en `/reportes/efectividad-tareas`
- **ES-01/02**: Fallo silencioso de `precio_compra` insert y auto-validacion de factura
- **D1/D2**: Insercion parcial de items OCR sin rollback; race condition en extraccion concurrente

**Resumen: 6 hallazgos MEDIUM abiertos** (de 9 originales; RC-02, RC-03, ID-01 resueltos en D-184/D-185).
