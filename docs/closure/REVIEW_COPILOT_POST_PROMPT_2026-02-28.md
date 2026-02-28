# Review Copilot Post-Prompt (2026-02-28)

## Alcance
Auditoría de cambios ejecutados por Copilot después del prompt de OCR (`scripts/`, `supabase/functions/facturas-ocr/index.ts`, `docs/closure/*`).

## Hallazgos (antes de ajustes)

1. `ALTO` — Asignación implícita de proveedor en batch OCR
- Evidencia: `scripts/ocr-procesar-nuevos.mjs` usaba primer proveedor activo si faltaba `--proveedor`.
- Riesgo: ingesta de facturas bajo proveedor incorrecto.

2. `ALTO` — Re-ejecución de batch sin estrategia de reutilización
- Evidencia: script intentaba crear nuevas facturas al re-ejecutar.
- Riesgo: errores por restricción UNIQUE y/o duplicidad operativa.

3. `MEDIO` — `Content-Type` fijo `image/jpeg` para todos los archivos
- Evidencia: `scripts/ocr-procesar-nuevos.mjs` en upload.
- Riesgo: procesamiento incorrecto para `.png`/`.pdf`.

4. `MEDIO` — Matching CUIT sensible a formato (guiones vs solo dígitos)
- Evidencia: resolución por `cuit=eq.<valor exacto>` en `facturas-ocr`.
- Riesgo: no resolver proveedor aunque CUIT sea correcto en formato alternativo.

5. `BAJO` — Afirmaciones documentales demasiado fuertes sobre deploy
- Evidencia: docs de resultados/handoff declaraban deploy exitoso sin chequeo explícito de versionado remoto.
- Riesgo: drift de documentación operacional.

## Ajustes aplicados

- `scripts/ocr-procesar-nuevos.mjs`
  - `--proveedor` obligatorio en `--execute`.
  - Reutilización de facturas existentes por `proveedor_id + numero(BATCH-*)`.
  - Reintento OCR sin crear duplicados.
  - `Content-Type` por extensión.
  - `apikey` agregado en invocación de `facturas-ocr`.

- `scripts/seed-proveedores.mjs`
  - Normalización de CUIT para comparación e inserción (`XX-XXXXXXXX-X`).

- `supabase/functions/facturas-ocr/index.ts`
  - Resolución de proveedor por CUIT con variantes (`con guiones`, `solo dígitos`).

- `docs/closure/*`
  - Ajustes de continuidad/comandos.
  - Matiz de claims de deploy: “reportado” + validación pendiente controlada.

## Verificaciones ejecutadas

- `npm run test:unit` -> `1733/1733 PASS`
- `npx vitest run tests/unit/facturas-ocr-helpers.test.ts` -> `69/69 PASS`
- `node --check scripts/ocr-procesar-nuevos.mjs` -> PASS
- `node --check scripts/seed-proveedores.mjs` -> PASS
- `node scripts/ocr-procesar-nuevos.mjs --dry-run` -> PASS
- `node scripts/validate-doc-links.mjs` -> `Doc link check OK (28 files)`
- Verificación remota (resumen):
  - `proveedores`: 12
  - `facturas_ingesta`: 21 (`20 pendiente`, `1 error`)

## Estado final
- `PARCIAL (BLOCKED externo)`: bloqueante vigente `OCR-007` (`GCV_API_KEY` responde `403`).
