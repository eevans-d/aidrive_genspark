# Rollback Drill (Staging) - OPS-SMART-1 (Archivado)

**Estado:** 📦 Archivado (compatibilidad de referencias)  
**Ejecución documentada:** 2026-01-30 (UTC-3)  
**Evidencia:** `docs/ROLLBACK_EVIDENCE_2026-01-29.md`

Este documento conserva el checklist operativo del rollback drill en staging.  
Para el procedimiento vigente, ver `docs/DEPLOYMENT_GUIDE.md`.

## Checklist (staging)

### 1) Pre-checks
- Confirmar branch/tag/commit objetivo (y el commit a revertir).
- Confirmar ventana y alcance (DB, Edge Functions, frontend).
- Confirmar health actual:
  - `api-minimarket`: `/functions/v1/api-minimarket/health`

### 2) Rollback DB
Opción preferida: restore PITR/snapshot (Dashboard).

Opción manual (solo con script validado):
1. Ejecutar rollback SQL en Supabase SQL Editor.
2. Verificar objetos eliminados/actualizados.
3. Revalidar RLS si aplica: `scripts/rls_audit.sql`.

### 3) Rollback Edge Functions
1. Volver a commit/tag anterior.
2. Re-deploy:
```bash
supabase functions deploy api-minimarket --no-verify-jwt --use-api
supabase functions deploy api-proveedor --use-api
```

### 4) Rollback Frontend
1. Re-deploy del build anterior (artifact/tag previo).
2. Verificar login + rutas críticas.

### 5) Verificación post-rollback
- Login: OK
- Health check: OK
- Endpoints críticos: OK

