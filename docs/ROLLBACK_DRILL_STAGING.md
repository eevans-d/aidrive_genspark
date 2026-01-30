# 🔁 Rollback Drill en Staging (OPS-SMART-1)

**Fecha:** 2026-01-29  
**Estado:** ✅ Ejecutado en staging (evidencia en `docs/ROLLBACK_EVIDENCE_2026-01-29.md`)  
**Objetivo:** Probar rollback end-to-end en staging con evidencia verificable.

---

## 1) Alcance
- Base de datos (migraciones)
- Edge Functions
- Frontend

---

## 2) Precondiciones (obligatorias)
- Acceso a Supabase Dashboard (staging).
- Secrets operativos configurados (`SUPABASE_*`, `DATABASE_URL`).
- Ventana de mantenimiento autorizada.
- Commit/tag anterior identificado (rollback target).

---

## 3) Checklist operativo

### A) Backup previo
- [ ] Ejecutar backup DB (`supabase db dump`) y guardar archivo con timestamp.
- [ ] Registrar ubicación del backup.

### B) Rollback DB
**Opcion preferida (si plan lo permite):** PITR / restore snapshot.
- [ ] Restaurar snapshot previo al deploy.
- [ ] Validar schema y RLS.

**Opcion manual (si no hay PITR):**
- [ ] Crear SQL de rollback para la migracion aplicada (template: `docs/ROLLBACK_SQL_TEMPLATE.md`).
- [ ] SQL específico (última migración): `docs/ROLLBACK_20260116000000_create_stock_aggregations.sql`.
- [ ] Ejecutar en SQL Editor (staging).
- [ ] Validar tablas criticas y RLS.

### C) Rollback Edge Functions
- [ ] Checkout al commit/tag anterior.
- [ ] Re-deploy de funciones criticas:
  - `supabase functions deploy api-minimarket`
  - `supabase functions deploy api-proveedor`

### D) Rollback Frontend
- [ ] Re-deploy del build anterior (artifact/tag previo).
- [ ] Verificar login y paginas criticas.

### E) Validacion post-rollback
- [ ] Health check: `/functions/v1/api-minimarket/health`.
- [ ] Login OK con usuario de prueba.
- [ ] Endpoints criticos OK (productos, stock, deposito).

---

## 4) Evidencia requerida
- Captura/registro del backup creado.
- Registro del comando/acción de rollback DB.
- Log de deploy de Edge Functions.
- Verificacion post-rollback (health + login).
- Fecha/hora + commit/tag aplicado.

**Plantilla de evidencia:** `docs/ROLLBACK_EVIDENCE_2026-01-29.md`.

---

## 5) Plantilla de evidencia

```
Rollback Drill (Staging)
Fecha:
Commit/tag rollback:
Backup DB:
Metodo DB: PITR / SQL manual
Evidencia DB:
Edge Functions re-deploy:
Frontend re-deploy:
Health check:
Login:
Observaciones:
```

---

## 6) Resultado esperado
- Rollback ejecutado sin errores.
- Sistema funcional en staging.
- Evidencia registrada en `docs/CHECKLIST_CIERRE.md` y `docs/DECISION_LOG.md`.
