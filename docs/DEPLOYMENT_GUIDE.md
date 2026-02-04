# DEPLOYMENT GUIDE - MINI MARKET SYSTEM

**Fecha:** 2026-01-23  
**Estado:** Documento operativo (rollback documentado y probado en staging 2026-01-30)

---

## 1) Alcance
- Frontend: `minimarket-system/`
- Base de datos (migraciones): `supabase/migrations/`
- Edge Functions: `supabase/functions/`

---

## 2) Prerrequisitos
- Acceso al proyecto Supabase (staging/prod).
- Secrets configurados (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- Working tree limpio y tag de release.
- Plan de backup/restore (PITR o snapshot).

---

## 3) Deploy (alto nivel)

### 3.1 Migraciones DB
```bash
# Ejecutar migraciones
supabase db push
```

### 3.2 Edge Functions
```bash
# Deploy individual (ejemplo)
supabase functions deploy api-minimarket --no-verify-jwt --use-api

# Deploy completo (si aplica)
supabase functions deploy
```

**Nota:** `api-minimarket` requiere `--no-verify-jwt` (workaround JWT ES256). Ver `docs/ESTADO_ACTUAL.md`.

### 3.3 Frontend
```bash
cd minimarket-system
npm run build
```

### 3.4 Verificacion post-deploy
- Health check gateway: `/functions/v1/api-minimarket/health`
- Validar login y rutas basicas
- Ejecutar smoke tests si aplica

---

## 4) Rollback (procedimiento)

> Checklist operativo: ver `docs/archive/ROLLBACK_DRILL_STAGING.md` (OPS-SMART-1).

### 4.1 Rollback DB (produccion/staging)
**Opcion preferida:** Point-in-Time Recovery (PITR) o restore desde backup.

Pasos recomendados:
1. Identificar el timestamp previo al deploy.
2. Restaurar snapshot/PITR desde Supabase Dashboard.
3. Verificar schema y datos.

**Opcion manual (solo si hay rollback SQL validado):**
1. Crear script de rollback para la migracion aplicada.
2. Ejecutar SQL en el Dashboard (SQL Editor).
3. Validar consistencia y RLS.

> Template recomendado: `docs/ROLLBACK_SQL_TEMPLATE.md`.

### 4.2 Rollback Edge Functions
1. Volver a un tag anterior en git.
2. Re-deploy de funciones desde ese commit:
```bash
supabase functions deploy api-minimarket
supabase functions deploy api-proveedor
```

### 4.3 Rollback Frontend
1. Re-deploy del build anterior (artifact/tag previo).
2. Verificar rutas criticas y login.

---

## 5) Validacion post-rollback
- Health check `/functions/v1/api-minimarket/health`
- Login con usuario de prueba
- Validar endpoints criticos (status/precios/alertas)
- Revisar logs de funciones y cron jobs

---

## 6) Evidencia y registro
Documentar:
- Fecha/hora
- Comandos ejecutados
- Resultado
- Tag/commit aplicado

---

## 7) Notas
- No ejecutar rollback en produccion sin respaldo y ventana aprobada.
- Evitar exponer claves en logs o docs.
