# AUDIT_F2_FLOWS_2026-02-25

## Objetivo
Validar continuidad funcional E2E de flujos core con trazabilidad entrada -> validación -> lógica -> persistencia/API -> respuesta.

## Comandos ejecutados
```bash
rg -n "ProtectedRoute|path=\"/" minimarket-system/src/App.tsx
rg -n "ROUTE_CONFIG|canAccessRoute" minimarket-system/src/lib/roles.ts
rg -n "useVerifiedRole|from\('personal'\)" minimarket-system/src/hooks/useUserRole.ts minimarket-system/src/hooks/useVerifiedRole.ts
rg -n "app_metadata\\?\\.role|requireRole" supabase/functions/api-minimarket/helpers/auth.ts
rg -n "if \(path === '/ventas' && method === 'POST'\)|sp_procesar_venta_pos" supabase/functions/api-minimarket/index.ts supabase/functions/api-minimarket/handlers/ventas.ts
rg -n "if \(path === '/deposito/movimiento' && method === 'POST'\)|if \(path === '/deposito/ingreso' && method === 'POST'\)|sp_movimiento_inventario" supabase/functions/api-minimarket/index.ts
nl -ba supabase/functions/api-minimarket/index.ts | sed -n '2196,2265p'
nl -ba supabase/functions/facturas-ocr/index.ts | sed -n '149,260p'
rg -n "requireServiceRoleAuth|sp_acquire_job_lock|sp_release_job_lock" supabase/functions/cron-jobs-maxiconsumo/index.ts supabase/functions/cron-jobs-maxiconsumo/orchestrator.ts supabase/functions/backfill-faltantes-recordatorios/index.ts
```

## Trazabilidad por flujo

### 1) Auth + permisos por rol
- Entrada FE: todas las rutas productivas pasan por `ProtectedRoute` (`minimarket-system/src/App.tsx:32`, `:83-235`).
- Control FE: ACL deny-by-default en `ROUTE_CONFIG` (`minimarket-system/src/lib/roles.ts:23-50`).
- Control BE: `requireRole` con rol desde `app_metadata.role` (`supabase/functions/api-minimarket/helpers/auth.ts:243-257`, `:294-311`).
- Clasificación: `RIESGO` (dual-source de rol FE/BE).

### 2) POS venta + impacto stock + trazabilidad
- Entrada API: `POST /ventas` (`supabase/functions/api-minimarket/index.ts:2060`).
- Lógica negocio: RPC `sp_procesar_venta_pos` (`supabase/functions/api-minimarket/handlers/ventas.ts:140`).
- Clasificación: `OK`.

### 3) Depósito/movimientos/ajustes
- Entradas API: `POST /deposito/movimiento` (`:1444`), `POST /deposito/ingreso` (`:1593`).
- Persistencia stock: `sp_movimiento_inventario` (`:1520`, `:1633`).
- Clasificación: `OK`.

### 4) OCR facturas (`facturas-ocr` + `api-minimarket`)
- Gateway: `POST /facturas/:id/extraer` (`supabase/functions/api-minimarket/index.ts:2207-2246`).
- OCR runtime: `GCV_API_KEY` (`supabase/functions/facturas-ocr/index.ts:153`) y flujo de invocación GCV (`:236-260`).
- Auth interna: `requireServiceRoleAuth` (`supabase/functions/facturas-ocr/index.ts:160`).
- Clasificación: `OK` (dependiente de secreto remoto vigente).

### 5) Cron jobs y automatizaciones
- Cron auth: `requireServiceRoleAuth` (`supabase/functions/cron-jobs-maxiconsumo/index.ts:118`).
- Locking distribuido: `sp_acquire_job_lock`/`sp_release_job_lock` (`supabase/functions/cron-jobs-maxiconsumo/orchestrator.ts:56`, `:84`).
- Backfill protegido: `requireServiceRoleAuth` (`supabase/functions/backfill-faltantes-recordatorios/index.ts:72`).
- Clasificación: `OK`.

## Conclusión F2
Flujos core cubiertos con trazabilidad completa. No se detectaron rupturas críticas de continuidad. Existe un riesgo de coherencia de autorización por doble fuente de rol entre frontend y backend.

## Hallazgos F2
| ID | Severidad | Archivo:Linea | Hallazgo | Acción |
|---|---|---|---|---|
| A-003 | MEDIO | `minimarket-system/src/hooks/useVerifiedRole.ts:56` | Frontend autoriza por `personal.rol`, backend por `app_metadata.role` (`supabase/functions/api-minimarket/helpers/auth.ts:245`) | Definir una única fuente de verdad para autorización (o sincronización forzada/validación cruzada) |
