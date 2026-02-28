# OCR Nuevos — Handoff 2026-02-28

**Sesion:** OCR lote nuevos + continuidad operativa
**Fecha:** 2026-02-28 03:41 — 04:15 UTC
**Commit base:** `928defb`
**Operador:** IA (Claude/Copilot)

---

## Resumen ejecutivo

Se procesó el lote de 22 imágenes nuevas en `proveedores_facturas_temp/nuevos/`. Se identificaron 21 imágenes canónicas (1 duplicado exacto detectado por hash MD5). Se descubrió que la tabla `proveedores` estaba vacía en producción — se creó un script de seed y se insertaron 12 proveedores desde el briefing del agente. Se subieron las 21 imágenes al bucket Storage de Supabase y se crearon los registros en `facturas_ingesta`.

Se intentó ejecutar OCR con Google Cloud Vision pero la `GCV_API_KEY` retorna HTTP 403. Se corrigió un bug crítico de stack overflow en el encoding base64 de imágenes grandes (>1MB). El redeploy de `facturas-ocr` quedó reportado en la sesión original y debe validarse en próximo redeploy controlado. El plan activo es `PLAN_FUSIONADO_FACTURAS_OCR.md` (confirmado, sin ambigüedad). Los planes deprecados están correctamente archivados en `docs/archive/planes-deprecados/`.

---

## Estado cuantitativo

| Categoría | Cantidad |
|-----------|----------|
| procesadas_ok | 0 |
| procesadas_con_warning | 0 |
| fallidas (error GCV 403) | 1 |
| blocked (pendiente fix GCV) | 20 |
| total canónicas | 21 |
| duplicadas (skipped) | 1 |
| proveedores seeded | 12 |

---

## Top 5 acciones siguientes (por impacto)

1. **[CRITICO] Activar GCV_API_KEY** — El owner debe ir a Google Cloud Console → APIs & Services → verificar que Cloud Vision API esté habilitada, la key no tenga restricciones IP bloqueantes, y billing esté activo. Sin esto, ningún OCR funciona.

2. **Re-ejecutar OCR batch** — Una vez GCV activa:
   ```bash
   node scripts/ocr-procesar-nuevos.mjs --execute --proveedor=d634fd98-6446-4a0c-a617-960f6fcdfee8
   ```

3. **Reasignar proveedor_id correcto** — Post-OCR, el CUIT detectado debe usarse para actualizar `proveedor_id` en cada `facturas_ingesta` record al proveedor correcto (actualmente todas apuntan a Logismar como placeholder).

4. **Crear supplier_profiles** — La tabla `supplier_profiles` está vacía. Se deben crear perfiles para cada proveedor usando las reglas del briefing (`proveedores_facturas_temp/BRIEFING_AGENTE_MINIMARKET.md` sección 6).

5. **Implementar OCR-001..OCR-006** — Issues de hardening ya documentados en `docs/closure/OPEN_ISSUES.md`.

---

## Archivos tocados en esta sesión

| Archivo | Acción |
|---------|--------|
| `scripts/seed-proveedores.mjs` | CREADO — Script de seed de proveedores |
| `scripts/ocr-procesar-nuevos.mjs` | CREADO — Script batch de OCR (dry-run/execute) |
| `supabase/functions/facturas-ocr/index.ts` | MODIFICADO — Fix base64 chunked encoding |
| `docs/closure/OCR_NUEVOS_MANIFEST_2026-02-28.md` | CREADO — Manifiesto del lote |
| `docs/closure/OCR_NUEVOS_RESULTADOS_2026-02-28.md` | CREADO — Resultados OCR |
| `docs/closure/OCR_NUEVOS_HANDOFF_2026-02-28.md` | CREADO — Este documento |
| `docs/closure/OPEN_ISSUES.md` | MODIFICADO — OCR-007 (GCV 403), OCR-008 (fix), OCR-009 (seed) |

### Base de datos (producción)

| Tabla | Acción | Registros |
|-------|--------|-----------|
| `proveedores` | INSERT | 12 proveedores (antes: 0) |
| `facturas_ingesta` | INSERT | 21 registros (estado: 20 pendiente, 1 error) |
| `facturas_ingesta_eventos` | INSERT | 1 evento (ocr_error, GCV 403) |
| Storage bucket `facturas` | UPLOAD | 21 imágenes JPG |

---

## Comandos para reanudar

```bash
# Verificar estado actual
source .env.test
curl -s "${SUPABASE_URL}/rest/v1/facturas_ingesta?select=id,estado&order=created_at" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" | python3 -m json.tool

# Test de GCV (probar con una sola factura)
curl -s "${SUPABASE_URL}/functions/v1/facturas-ocr" -X POST \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"factura_id":"bd462b25-b3b4-46af-8c41-f73c2b56eb50"}' | python3 -m json.tool

# Si GCV funciona, batch re-process (reutiliza facturas existentes)
node scripts/ocr-procesar-nuevos.mjs --execute --proveedor=d634fd98-6446-4a0c-a617-960f6fcdfee8

# Validar docs
node scripts/validate-doc-links.mjs
```

---

## Criterios de éxito evaluados

| Criterio | Estado |
|----------|--------|
| Existe manifiesto con clasificación completa | ✅ `docs/closure/OCR_NUEVOS_MANIFEST_2026-02-28.md` |
| Existe resultado OCR por imagen (real o BLOCKED) | ✅ BLOCKED justificado (GCV 403) con evidencia |
| No hay ambigüedad plan activo vs histórico | ✅ Solo `PLAN_FUSIONADO` en `docs/` |
| Queda handoff accionable | ✅ Este documento |

**Estado final de sesión: PARCIAL (BLOCKED)**
