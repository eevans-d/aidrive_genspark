# OCR Nuevos — Handoff 2026-03-01

**Sesión:** Continuidad OCR + supplier profiles + Sprint 2 asistente IA
**Fecha:** 2026-03-01 13:25 UTC
**Commit base:** `ad16f11`
**Operador:** IA (GitHub Copilot)

---

## Resumen ejecutivo

Se continuó el procesamiento del lote de 21 imágenes canónicas en `proveedores_facturas_temp/nuevos/`. El bloqueante externo OCR-007 (GCV_API_KEY timeout) persiste — se re-testeó y confirmó `504 OCR_TIMEOUT` a las 13:25 UTC.

Acciones realizadas sin depender de GCV:
1. **Supplier profiles creados:** 5 profiles insertados en `supplier_profiles` para Logismar, CPV, AceituMar, Terramare y Cedeira, basados en las reglas del briefing (sección 6).
2. **Error states limpiados:** 2 facturas en estado `error` (una de sesión anterior, otra de test accidental) reseteadas a `pendiente`. Lote queda 21/21 `pendiente`.
3. **Script de reasignación creado:** `scripts/ocr-reasignar-proveedor.mjs` — reasigna `proveedor_id` post-OCR por CUIT detectado + heurística temporal (4 grupos identificados).
4. **Script de supplier profiles creado:** `scripts/seed-supplier-profiles.mjs` — idempotente, no crea duplicados.
5. **Agrupación temporal de imágenes:** 4 grupos detectados por proximidad de timestamps (gap > 30s):
   - Grupo 1: 1 imagen (210622) — posible factura aislada
   - Grupo 2: 3 imágenes (210739-210758) — probablemente 1 factura multi-página
   - Grupo 3: 6 imágenes (210849-210938) — probablemente 1-2 facturas
   - Grupo 4: 11 imágenes (211013-211205) — probablemente 2-4 facturas
6. **Doc links validados:** 0 rotos (29 archivos).
7. **Sprint 2 Asistente IA completado:** plan→confirm con confirm_token, desplegado a producción.

---

## Estado cuantitativo

| Categoría | Cantidad |
|-----------|----------|
| procesadas_ok | 0 |
| procesadas_con_warning | 0 |
| fallidas | 0 |
| blocked (GCV timeout) | 21 |
| total canónicas | 21 |
| supplier_profiles creados | 5 |
| proveedores con CUIT | 4 (de 12) |
| proveedores sin CUIT | 8 |

---

## Estado BD producción (verificado 2026-03-01 13:25 UTC)

| Tabla | Registros | Detalle |
|-------|-----------|---------|
| `facturas_ingesta` | 21 | 21 pendiente, 0 error |
| `proveedores` | 12 | 4 con CUIT, 8 sin CUIT |
| `supplier_profiles` | 5 | Logismar, CPV, AceituMar, Terramare, Cedeira |
| Storage bucket `facturas` | 21 | Imágenes JPG subidas |

---

## Top 5 acciones siguientes (por impacto)

1. **[CRÍTICO] Activar billing GCV** — Owner: ir a `console.cloud.google.com/billing` → activar → vincular a proyecto `gen-lang-client-0312126042`. Cloud Vision tiene 1000 unidades gratis/mes.

2. **Re-ejecutar OCR batch** — Una vez GCV activa:
   ```bash
   node scripts/ocr-procesar-nuevos.mjs --execute --proveedor=d634fd98-6446-4a0c-a617-960f6fcdfee8
   ```

3. **Reasignar proveedores** — Después del OCR exitoso:
   ```bash
   node scripts/ocr-reasignar-proveedor.mjs --dry-run    # verificar
   node scripts/ocr-reasignar-proveedor.mjs --execute     # aplicar
   ```

4. **Completar CUITs faltantes** — 8 proveedores sin CUIT. El owner puede proporcionarlos o se detectarán vía OCR de sus facturas.

5. **Sprint 3 Asistente IA** — Acciones adicionales (`actualizar_estado_pedido`, `aplicar_factura`), historial de acciones en BD, guía visual para usuario no técnico.

---

## Archivos tocados en esta sesión

| Archivo | Acción |
|---------|--------|
| `scripts/seed-supplier-profiles.mjs` | CREADO — Script de seed de supplier profiles |
| `scripts/ocr-reasignar-proveedor.mjs` | CREADO — Script de reasignación post-OCR |
| `supabase/functions/api-assistant/confirm-store.ts` | CREADO — Confirm token store Sprint 2 |
| `supabase/functions/api-assistant/index.ts` | MODIFICADO — Sprint 2 plan+confirm |
| `supabase/functions/api-assistant/parser.ts` | MODIFICADO — 2 write intents |
| `minimarket-system/src/pages/Asistente.tsx` | MODIFICADO — Plan card UI |
| `minimarket-system/src/lib/assistantApi.ts` | MODIFICADO — confirmAction() |
| `minimarket-system/src/pages/Asistente.test.tsx` | CREADO — 7 component tests |
| `tests/unit/assistant-confirm-store.test.ts` | CREADO — 10 unit tests |
| `tests/unit/assistant-intent-parser.test.ts` | MODIFICADO — 21 tests Sprint 2 |
| `docs/ESTADO_ACTUAL.md` | MODIFICADO — Sprint 2 + deploy |
| `docs/DECISION_LOG.md` | MODIFICADO — D-182 |
| `docs/PLAN_ASISTENTE_IA_DASHBOARD.md` | MODIFICADO — Sprint 2 completado |
| `docs/closure/OPEN_ISSUES.md` | MODIFICADO — DEPLOY-001 cerrado |

### Base de datos (producción)

| Tabla | Acción | Registros |
|-------|--------|-----------|
| `supplier_profiles` | INSERT | 5 perfiles (antes: 0) |
| `facturas_ingesta` | PATCH | 2 registros error→pendiente |

---

## Comandos para reanudar

```bash
# Verificar estado actual OCR
source .env.test
curl -s "${SUPABASE_URL}/rest/v1/facturas_ingesta?select=estado&order=estado" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" | python3 -c "
import json,sys;d=json.loads(sys.stdin.read());s={};
[s.update({r['estado']:s.get(r['estado'],0)+1}) for r in d];print(s)"

# Test GCV con 1 factura
curl -s -w "\n%{http_code}" "${SUPABASE_URL}/functions/v1/facturas-ocr" -X POST \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"factura_id":"bd462b25-b3b4-46af-8c41-f73c2b56eb50"}'

# Si GCV funciona → batch OCR + reasignación
node scripts/ocr-procesar-nuevos.mjs --execute --proveedor=d634fd98-6446-4a0c-a617-960f6fcdfee8
node scripts/ocr-reasignar-proveedor.mjs --dry-run
node scripts/ocr-reasignar-proveedor.mjs --execute

# Validar docs
node scripts/validate-doc-links.mjs

# Tests
npx vitest run tests/unit/
```

---

## Bloqueante vigente

**OCR-007:** `GCV_API_KEY` retorna `504 OCR_TIMEOUT` (re-confirmado 2026-03-01 13:25 UTC). Billing GCP inactivo. Sin este servicio, no se puede extraer texto de las 21 facturas pendientes.

---

## Criterios de éxito evaluados

| Criterio | Estado |
|----------|--------|
| Existe manifiesto con clasificación completa | ✅ `docs/closure/archive/historical/OCR_NUEVOS_MANIFEST_2026-02-28.md` |
| Existe resultado OCR por imagen | ⚠️ BLOCKED (GCV timeout, documentado) |
| No hay ambigüedad sobre plan activo vs histórico | ✅ Solo `PLAN_FUSIONADO_FACTURAS_OCR.md` en `docs/` |
| Queda handoff accionable para siguiente sesión | ✅ Este documento |
| Supplier profiles creados para OCR post-procesamiento | ✅ 5/5 insertados |
| Scripts de pipeline listos para ejecución inmediata | ✅ 3 scripts (ocr, reasignación, profiles) |
