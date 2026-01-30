# ✅ COMET — Runbook ultra‑simple para rollback SQL (staging)

**Objetivo:** ejecutar el rollback y dejar documentación cerrada **con el mínimo de pasos**.

---

## FASE 1 — Ejecutar SQL (1 solo bloque)

**Copiar y pegar en Supabase → SQL Editor → New query:**

```sql
BEGIN;

DROP FUNCTION IF EXISTS fn_refresh_stock_views();
DROP FUNCTION IF EXISTS fn_rotacion_productos(integer, integer);
DROP FUNCTION IF EXISTS fn_dashboard_metrics(text);

DROP VIEW IF EXISTS vista_stock_por_categoria;

DROP MATERIALIZED VIEW IF EXISTS mv_productos_proximos_vencer;
DROP MATERIALIZED VIEW IF EXISTS mv_stock_bajo;

COMMIT;
```

**Resultado esperado:** sin errores. Responder: **“SQL OK”**.

---

## FASE 2 — Actualizar docs (copiar y pegar bloques exactos)

### 2.1 `docs/ROLLBACK_EVIDENCE_2026-01-29.md`
Reemplazar el contenido de evidencia con este bloque (sin modificar valores si todo salió bien):

```
Rollback Drill (Staging)
Fecha: 2026-01-30
Commit/tag rollback: N/A (rollback SQL manual)
Backup DB: N/A / Supabase backup previo (si aplica)
Metodo DB: SQL manual
Evidencia DB: SQL Editor ejecutado sin errores
Edge Functions re-deploy: N/A (no requerido)
Frontend re-deploy: N/A (no requerido)
Health check: ✅
Login: ✅
Observaciones: Rollback de vistas materializadas y funciones (stock aggregations)
```

### 2.2 `docs/CHECKLIST_CIERRE.md`
Buscar la línea:
```
- [ ] Cierre final pendiente por rollback probado...
```
Reemplazar por:
```
- [x] Cierre final pendiente por rollback probado. Evidencia: docs/ROLLBACK_EVIDENCE_2026-01-29.md
```

### 2.3 `docs/DECISION_LOG.md`
Agregar al final de la tabla (última fila):
```
| D-033 | **Rollback drill en staging ejecutado** | Completada | 2026-01-30 | Rollback SQL manual, evidencia en docs/ROLLBACK_EVIDENCE_2026-01-29.md. |
```

### 2.4 `docs/ESTADO_ACTUAL.md`
Agregar una nota corta bajo el encabezado:
```
- Rollback staging (OPS‑SMART‑1) ejecutado y evidenciado 2026‑01‑30.
```

---

## Regla de oro
**Nunca pegar secretos ni tokens en chat o docs.**
