# AUDIT_F2_FLOWS_2026-02-24

## Objetivo
Validar continuidad extremo a extremo en flujos funcionales core.

## Comandos ejecutados
```bash
rg -n "ProtectedRoute|path=\"/" minimarket-system/src/App.tsx
rg -n "requireRole|checkRole\(" supabase/functions/api-minimarket/index.ts
nl -ba supabase/functions/api-minimarket/index.ts | sed -n '2040,2135p'
nl -ba supabase/functions/api-minimarket/handlers/ventas.ts | sed -n '66,158p'
rg -n "sp_movimiento_inventario|/deposito/movimiento|/deposito/ingreso|precios_compra" supabase/functions/api-minimarket/index.ts
nl -ba supabase/functions/api-minimarket/index.ts | sed -n '2190,2365p'
nl -ba supabase/functions/facturas-ocr/index.ts | sed -n '149,279p'
nl -ba supabase/functions/cron-jobs-maxiconsumo/orchestrator.ts | sed -n '47,169p'
nl -ba supabase/functions/backfill-faltantes-recordatorios/index.ts | sed -n '58,83p'
```

## Trazabilidad por flujo

### 1) Auth + permisos por rol
- Entrada: rutas protegidas con `ProtectedRoute` (`minimarket-system/src/App.tsx:32`, `:83-233`).
- Validación FE: `canAccessRoute` deny-by-default (`minimarket-system/src/lib/roles.ts:44-50`).
- Validación BE: `checkRole -> requireRole` (`supabase/functions/api-minimarket/index.ts:321-323`).
- Resultado: OK.

### 2) POS venta + stock + trazabilidad
- Entrada API: `POST /ventas` (`supabase/functions/api-minimarket/index.ts:2059-2077`).
- Validaciones: payload + `Idempotency-Key` obligatorio (`supabase/functions/api-minimarket/handlers/ventas.ts:131-135`).
- Lógica core: RPC `sp_procesar_venta_pos` (`supabase/functions/api-minimarket/handlers/ventas.ts:140`).
- Persistencia transaccional: migración POS (`supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:237`).
- Resultado: OK.

### 3) Depósito / movimientos / ajustes
- Entrada API: `/deposito/movimiento` y `/deposito/ingreso` (`supabase/functions/api-minimarket/index.ts:1443`, `:1592`).
- Lógica stock: `sp_movimiento_inventario` (`supabase/functions/api-minimarket/index.ts:1520`, `:1633`).
- Trazabilidad precio compra: `precios_compra` (`supabase/functions/api-minimarket/index.ts:1643-1648`).
- Resultado: OK.

### 4) OCR facturas (`facturas-ocr` + gateway)
- Gateway invoca OCR: `POST /facturas/:id/extraer` (`supabase/functions/api-minimarket/index.ts:2207-2246`).
- Auth interna service-role: `requireServiceRoleAuth` (`supabase/functions/facturas-ocr/index.ts:160`).
- Dependencia crítica: `GCV_API_KEY` (`supabase/functions/facturas-ocr/index.ts:153`, fallback `:278`).
- Endpoints de validación/aplicación: `PUT /facturas/items/:id/validar` y `POST /facturas/:id/aplicar` (`supabase/functions/api-minimarket/index.ts:2252`, `:2345`).
- Resultado: OK (condicionado a secreto operativo, actualmente presente en remoto).

### 5) Cron jobs y automatizaciones
- Auth interna en cron: `requireServiceRoleAuth` (`supabase/functions/cron-jobs-maxiconsumo/index.ts:118`).
- Lock distribuido: `sp_acquire_job_lock` / `sp_release_job_lock` (`supabase/functions/cron-jobs-maxiconsumo/orchestrator.ts:56`, `:84`).
- Backfill protegido por service-role (`supabase/functions/backfill-faltantes-recordatorios/index.ts:72`).
- Resultado: OK.

## Conclusión F2
Flujos core trazados de extremo a extremo sin ruptura crítica detectada.

## Hallazgos F2
- Sin hallazgos nuevos `CRITICO/ALTO` en continuidad funcional.
