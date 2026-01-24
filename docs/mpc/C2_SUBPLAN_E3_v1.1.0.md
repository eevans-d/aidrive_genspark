# C2 — Subplan E3 DB & Migraciones (MPC v2.1)

**Etapa:** E3  
**Fecha:** 2026-01-23  
**Versión:** 1.1.0  
**Estado:** ⚠️ Parcial (rollback probado pendiente)  

---

## 1) Estado actual

- Migraciones verificadas: 10/10 aplicadas.
- Rollback documentado en `docs/DEPLOYMENT_GUIDE.md`.
- **Pendiente:** prueba real de rollback en staging (OPS-SMART-1).

---

## 2) Alcance

- **WS3.1** Validación de migraciones en staging/prod.
- **WS3.2** Rollback documentado y probado.

> Nota: Auditoría RLS se ejecuta en E4 Seguridad (WS7.1).

---

## 3) Evidencias y referencias

- Migraciones: `supabase/migrations/`.
- Rollback documentado: `docs/DEPLOYMENT_GUIDE.md`.
- Checklist cierre: `docs/CHECKLIST_CIERRE.md`.

---

## 4) Subtareas

| ID | Tarea | Estado | Evidencia |
|---|---|---|---|
| E3-T1 | Validar migraciones recientes | ✅ | `docs/CHECKLIST_CIERRE.md` |
| E3-T2 | Documentar rollback | ✅ | `docs/DEPLOYMENT_GUIDE.md` |
| E3-T3 | Probar rollback en staging | ⏳ | Evidencia por completar |

---

## 5) Variables de entorno críticas

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 6) Plan de testing

- Validar migraciones en staging/prod.
- Ejecutar rollback controlado y verificar schema.

---

## 7) Plan de rollback

1. Identificar migración a revertir (timestamp en `supabase/migrations/`).
2. Ejecutar rollback controlado.
3. Verificar que el schema vuelva al estado anterior.

---

## 8) Checklist post-implementación

- [x] Migraciones validadas por entorno.
- [ ] Rollback probado en staging con evidencia.
