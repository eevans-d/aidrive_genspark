# ESTADO ACTUAL DEL PROYECTO

**Ultima actualizacion:** 2026-03-01 (Sprint 1 Asistente IA read-only implementado)
**Veredicto general del sistema:** `GO INCONDICIONAL`
**Estado del modulo OCR de facturas:** `ESTABLE PARA USO OPERATIVO, BACKLOG TECNICO CERRADO (10/10), HARDENED`
**Estado del Asistente IA:** `SPRINT 1 COMPLETADO — solo lectura, admin only`
**Fuente ejecutiva:** `docs/PRODUCTION_GATE_REPORT.md`

## 1) Resumen ejecutivo
- El sistema principal mantiene veredicto `GO INCONDICIONAL` (ProductionGate previo 18/18 PASS).
- **Auditoria de produccion profunda completada:** analisis de ingenieria inversa simulando escenarios reales de produccion detecto **50+ hallazgos** (1 CRITICO seguridad, 2 CRITICOS integridad datos, 8 HIGH, 19 MEDIUM, 7 LOW).
- Se implementaron **11 fixes** cubriendo todos los CRITICOS y la mayoria de HIGH: sanitizacion de errores, auth bypass removal, reorden de transiciones de estado, limites de tamaño, JSON parse safety, double-submit UI fix.
- Todas las tareas T1-T10 del PLAN_FUSIONADO estan COMPLETADAS + hardening adicional de produccion aplicado.
- Se ejecuto higiene documental de `docs/closure` con clasificacion activa/historica/deprecada y prompts obsoletos marcados.
- Se archivaron **38** documentos historicos en `docs/closure/archive/historical/`, con referencias reescritas automaticamente y policy-check de raiz para evitar regresiones.
- GCV sigue BLOCKED: requiere accion del owner en GCP Console (billing inactivo).

## 2) Estado tecnico verificado (sesion 2026-03-01)
- ProductionGate re-ejecutado en esta sesion: **18/18 PASS** (score 100, 03:26 UTC).
- Tests unitarios completos: **1853/1853 PASS** (84 archivos, incluye parser + seguridad de rol del asistente).
- Tests de integracion: **68/68 PASS** (3 archivos).
- Tests de componentes frontend: **242/242 PASS** (47 archivos).
- Tests de contratos API: **17/17 PASS** (1 archivo).
- Migraciones SQL en repo: **52**.
- Edge Functions en repo: **16** (excluye `_shared`; nueva: `api-assistant`).
- Skills en `.agent/skills`: **22**.
- Enlaces internos en `docs/`: **0 rotos** (verificado con `validate-doc-links.mjs`).
- Freshness de este documento: **vigente (0 dias)**.
- `.env.example` sincronizado con runtime OCR: agregado `OCR_MIN_SCORE_APPLY` (default sugerido `0.70`).
- Deploy `facturas-ocr`: **v10 en produccion** (base64 chunked + CUIT variants + timeout handling).
- Estado remoto `supabase functions list`: **15 funciones ACTIVE** (16 en repo; `api-assistant` pendiente de deploy — ver DEPLOY-001 en `docs/closure/OPEN_ISSUES.md`).

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
- 12 proveedores seeded, 21 facturas cargadas (**20 `pendiente`**, **1 `error`** por timeout GCV en reintento puntual).

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
El estado `GO INCONDICIONAL` aplica al sistema general ya auditado. El backlog OCR tecnico esta 10/10 tareas completadas. GCV es prerequisito externo unico para validacion funcional end-to-end del modulo OCR. No hay deuda tecnica interna pendiente.

## 6b) Asistente IA — Sprint 1 (read-only)

### Implementado
- Edge Function `api-assistant` (`supabase/functions/api-assistant/index.ts`): CORS, auth JWT, validacion de rol confiable desde `app_metadata`, parser rule-based, 5 intent handlers.
- Intent parser separado en `parser.ts` con 5 intents read-only:
  - `consultar_stock_bajo` → `GET /stock/minimo` (via api-minimarket)
  - `consultar_pedidos_pendientes` → `GET /pedidos?estado=pendiente` (via api-minimarket)
  - `consultar_resumen_cc` → `GET /cuentas-corrientes/resumen` (via api-minimarket)
  - `consultar_ventas_dia` → `GET /ventas?fecha_desde=...&fecha_hasta=...` (via api-minimarket)
  - `consultar_estado_ocr_facturas` → PostgREST directo `facturas_ingesta` (no hay GET gateway)
- Frontend: pagina `Asistente.tsx` con chat conversacional, quick-prompts, sugerencias inline.
- Ruta `/asistente` protegida, acceso solo `admin` (deny-by-default en `roles.ts`).
- Nav item en sidebar y Dashboard CTA.
- API client `assistantApi.ts` con `sendMessage()`.
- 77 unit tests del asistente (74 parser + 3 de seguridad de rol).

### No implementado (Sprint 2)
- Acciones mutantes (confirmar compras, aplicar facturas, etc.).
- `confirm_token` y flujo de confirmacion.
- Expansion de roles (deposito, ventas).
- Historial/persistencia de conversaciones.

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
- **RC-02**: Check de margen en `/precios/aplicar` usa datos potencialmente stale
- **RC-03**: Transiciones de estado en tareas sin guard de estado previo
- **ID-01/02/03**: Sin idempotency key en `/deposito/movimiento`, `/deposito/ingreso`, `/compras/recepcion`
- **RE-01**: Agregacion in-memory sin limite en `/reportes/efectividad-tareas`
- **ES-01/02**: Fallo silencioso de `precio_compra` insert y auto-validacion de factura
- **D1/D2**: Insercion parcial de items OCR sin rollback; race condition en extraccion concurrente
