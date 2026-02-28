# Review Post-Copilot Continuacion (2026-02-28)

**Auditor:** Claude Opus 4 (sesion de auditoria tecnica senior)
**Timestamp inicio:** 2026-02-28 04:55:55 UTC
**Timestamp cierre:** 2026-02-28 05:40 UTC
**Commit base:** `928defb`

---

## Resumen ejecutivo

Se ejecuto una auditoria tecnica completa sobre los cambios recientes realizados por Codex + GitHub Copilot en el modulo OCR de facturas. Se validaron los 2 scripts nuevos (`ocr-procesar-nuevos.mjs`, `seed-proveedores.mjs`), la edge function modificada (`facturas-ocr/index.ts`), la documentacion de cierre, y la consistencia documental. Se encontraron 5 hallazgos (1 ALTO, 3 MEDIO, 1 BAJO). Se aplicaron 4 correcciones: normalizacion de CUITs en BD, eliminacion de doble normalizacion redundante en seed, fix de timeout handling en edge function (ahora devuelve 504 con mensaje especifico en lugar de 500 generico), y actualizacion de OPEN_ISSUES con evidencia refinada. Se redesplegó `facturas-ocr` (v10) y se verifico que el deploy no introduce regresiones. GCV sigue BLOCKED: el modo de error cambio de HTTP 403 rapido a timeout total de 15 segundos, lo que sugiere deshabilitacion de API o suspension de billing en Google Cloud. Los 1733 tests unitarios pasan, doc links OK, scripts validados sintacticamente y con dry-run.

---

## Hallazgos por severidad

### ALTO

| ID | Hallazgo | Evidencia | Accion |
|---|---|---|---|
| H-01 | GCV cambio de 403 a timeout total (15s). La edge function devolvia 500 generico en lugar de error descriptivo. | `facturas_ingesta_eventos`: evento `ocr_error` "GCV fetch failed: Signal timed out." (05:19 UTC) | Fix aplicado: try-catch especifico en GCV fetch, devuelve 504 `OCR_TIMEOUT` con mensaje. Deploy v10. |

### MEDIO

| ID | Hallazgo | Evidencia | Accion |
|---|---|---|---|
| H-02 | CUITs inconsistentes en BD: AceituMar (`30715335197`) y Terramare (`30711368264`) almacenados sin normalizar. Logismar y CPV si estaban normalizados. | Query directa a `proveedores` pre-fix. Causa: seed fue ejecutado antes de agregar `normalizeCuit()`. | Fix aplicado: PATCH directo a BD, ahora `30-71533519-7` y `30-71136826-4`. Verificacion post-fix OK. |
| H-03 | Doble normalizacion redundante en `seed-proveedores.mjs:193`. `prov.cuit` ya estaba normalizado desde linea 171 pero se re-normalizaba al insertar. | `scripts/seed-proveedores.mjs:171` vs `:193` | Fix aplicado: linea 193 ahora usa `prov.cuit` directamente. |
| H-04 | Deploy de `facturas-ocr` estaba marcado como "pendiente de verificacion" en OPEN_ISSUES pero el redeploy Copilot si ocurrio (v8 a las 04:08 UTC). Estado documental desactualizado. | `supabase functions list` muestra v8 actualizado 2026-02-28 04:08:46. | Fix aplicado: OPEN_ISSUES OCR-008 actualizado: deploy verificado, estado CERRADO con evidencia. |

### BAJO

| ID | Hallazgo | Evidencia | Accion |
|---|---|---|---|
| H-05 | `resolveProveedorByCuit` no tiene test unitario dedicado para variantes de formato CUIT. | Grep en `tests/` no encontro tests de variantes CUIT. | Documentado como mejora. No bloqueante: la logica funcional esta cubierta por el resolver con variantes. |

---

## Cambios aplicados

| Archivo | Cambio | Tipo |
|---|---|---|
| `supabase/functions/facturas-ocr/index.ts` | Try-catch especifico para GCV fetch timeout; retorna 504 `OCR_TIMEOUT` con mensaje | Fix funcional |
| `scripts/seed-proveedores.mjs` | Eliminar doble `normalizeCuit()` redundante en linea 193 | Fix minor |
| `docs/closure/OPEN_ISSUES.md` | Actualizar OCR-007 (timeout vs 403), OCR-008 (deploy verificado), seccion BLOCKED | Doc update |
| BD `proveedores` | PATCH CUITs de AceituMar y Terramare a formato normalizado `XX-XXXXXXXX-X` | Data fix |
| Deploy `facturas-ocr` | Redeploy 2x durante auditoria (v9 con fix original, v10 con timeout handling) | Deploy |

---

## Resultados de validaciones

| Validacion | Resultado |
|---|---|
| `node --check scripts/ocr-procesar-nuevos.mjs` | PASS |
| `node --check scripts/seed-proveedores.mjs` | PASS |
| `node scripts/ocr-procesar-nuevos.mjs --dry-run` | PASS (21 canonicas, 1 duplicada, 12 proveedores) |
| `npx vitest run` (suite completa) | PASS (1733/1733, 81 archivos) |
| `npx vitest run tests/unit/facturas-ocr-helpers.test.ts` | PASS (69/69) |
| `node scripts/validate-doc-links.mjs` | PASS (28 files, 0 rotos) |
| Test GCV via edge function | FAIL — 504 `OCR_TIMEOUT` "Signal timed out." (confirmado BLOCKED) |
| Verificacion CUITs post-fix | PASS (4/4 en formato `XX-XXXXXXXX-X`) |

---

## Estado final: `PARCIAL (BLOCKED)`

El bloqueante externo OCR-007 persiste y ha empeorado: GCV ya no responde 403 sino que no responde en absoluto (timeout 15s). Todo el codigo, datos y documentacion estan en estado consistente y listo para re-procesamiento inmediato una vez GCV funcione.

---

## Siguiente paso inmediato (1 solo, el de mayor impacto)

**Owner debe activar/verificar la GCV_API_KEY en Google Cloud Console:**
1. Ir a APIs & Services > Library > buscar "Cloud Vision API" > verificar que este ENABLED
2. Ir a APIs & Services > Credentials > verificar restricciones de la key (quitar restricciones de IP si las hay)
3. Ir a Billing > verificar que la cuenta de billing este activa y sin suspension

Una vez funcione, ejecutar:
```bash
node scripts/ocr-procesar-nuevos.mjs --execute --proveedor=d634fd98-6446-4a0c-a617-960f6fcdfee8
```

El script reutiliza las 21 facturas existentes (por `proveedor_id + numero BATCH-*`) e invoca OCR sin crear duplicados.

---

## Cross-check PLAN_FUSIONADO T1-T10

Verificacion exhaustiva de cada tarea del plan canonico contra el codigo fuente real.

| Tarea | Descripcion | Estado | Evidencia |
|-------|-------------|--------|-----------|
| T1 | Guardas de estado en `/extraer` | NO_IMPLEMENTADO | `api-minimarket/index.ts:2210` invoca OCR sin validar estado; `facturas-ocr/index.ts:233` no chequea `factura.estado` |
| T2 | Reextraccion con limpieza previa | NO_IMPLEMENTADO | `facturas-ocr/index.ts:374` inserta items sin DELETE previo; re-extraer duplica items |
| T3 | Lock optimista en `/aplicar` | PARCIAL | Check de estado en `:2353-2364` (pendiente→400, aplicada→409, no validada→400). Pero PATCH final en `:2443` es incondicional (sin CAS `estado=eq.validada`). Sin rollback. Idempotencia parcial por `factura_ingesta_item_id` (`:2385-2391`) |
| T4 | Guard de confianza OCR | NO_IMPLEMENTADO | `api-minimarket/index.ts:2345-2469` sin referencia a `score_confianza` ni umbral |
| T5 | Batch insert de items | NO_IMPLEMENTADO | Items insertados uno a uno en loop secuencial (`:374-405`). Sin batch POST ni fallback |
| T6 | Cache in-memory alias/barcodes | NO_IMPLEMENTADO | `matchItem()` (`:97-168`) hace 1-3 HTTP requests por item. Sin preload, sin Map/Set, sin memoizacion |
| T7 | Hardening `/aplicar` parcial | PARCIAL | Retorna 207 con `results` y `errors` (`:2468`). Solo marca `aplicada` si 0 errores (`:2443`). Pero movimientos exitosos NO se revierten si hay fallos parciales |
| T8 | Sync OpenAPI/API_README | DRIFTED | Status codes difieren: spec timeout=408 vs runtime=504; spec GCV error=500 vs runtime=502; spec config=500 vs runtime=503 |
| T9 | Warning CUIT mismatch en UI | NO_IMPLEMENTADO | `Facturas.tsx` no contiene referencia a `cuit_detectado`. Backend persiste dato (`:357`) y logea warning (`:337`) pero UI no lo consume |
| T10 | Soporte PDF OCR | NO_IMPLEMENTADO | `TEXT_DETECTION` hardcoded en `:280`. Sin deteccion MIME, sin `DOCUMENT_TEXT_DETECTION` |

### Resumen cuantitativo
- **Completadas:** 0/10
- **Parciales:** 2/10 (T3, T7)
- **No implementadas:** 8/10
- **Prerequisito externo:** GCV_API_KEY funcional (OCR-007 BLOCKED)

### Orden de implementacion recomendado (post-GCV fix)
1. **T1 + T2** (Fase 1 P0): guardas de estado + limpieza previa. Impacto de integridad mas alto.
2. **T3** (completar): agregar CAS conditional PATCH + rollback.
3. **T4**: guard de confianza (configurable por env).
4. **T5 + T6** (Fase 2 P1): batch insert + cache. Impacto de performance.
5. **T7** (completar): rollback de movimientos parciales.
6. **T8** (Fase 3): sync documental.
7. **T9 + T10**: UX y PDF.
