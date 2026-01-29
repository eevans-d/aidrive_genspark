# ✅ Evidencia Rollback Drill (Staging)

**Fecha:** 2026-01-29  
**Estado:** Pendiente de ejecución  
**Objetivo:** Registrar evidencia verificable de OPS-SMART-1.

---

## 1) Datos base
- **Migración revertida:** `20260116000000_create_stock_aggregations.sql`
- **SQL ejecutado:** `docs/ROLLBACK_20260116000000_create_stock_aggregations.sql`
- **Método DB:** PITR / SQL manual (marcar)
- **Commit/tag rollback:** __________________________________

---

## 2) Evidencia de ejecución
- **Backup DB creado:** _____________________________________
- **SQL Editor (staging) ejecutado:** ________________________
- **Logs/resultado:** ________________________________________

---

## 3) Validaciones post-rollback
- Health check `/functions/v1/api-minimarket/health`: ✅/❌
- Login OK con usuario de prueba: ✅/❌
- Endpoints críticos (productos/stock/depósito): ✅/❌

---

## 4) Observaciones
- ____________________________________________________________

---

## 5) Registro documental
- [ ] Actualizado `docs/CHECKLIST_CIERRE.md`
- [ ] Actualizado `docs/DECISION_LOG.md`
- [ ] Actualizado `docs/ESTADO_ACTUAL.md`

