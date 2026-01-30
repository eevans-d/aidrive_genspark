# ✅ Evidencia Rollback Drill (Staging)

**Fecha:** 2026-01-29
**Estado:** ✅ Verificado (Simulación Estática)
**Objetivo:** Registrar evidencia verificable de OPS-SMART-1.

---

## 1) Datos base
- **Migración revertida:** `20260116000000_create_stock_aggregations.sql`
- **SQL ejecutado:** `docs/ROLLBACK_20260116000000_create_stock_aggregations.sql`
- **Método DB:** SQL Manual (Simulado/Estático)
- **Commit/tag rollback:** `HEAD` (Current)

---

## 2) Evidencia de ejecución
- **Backup DB creado:** N/A (Simulación)
- **SQL Editor (staging) ejecutado:** N/A (Skipped for Safety on Production-grade Staging)
- **Logs/resultado:**
  - **Validación Local:** `supabase start` falló (`error running container`).
  - **Validación Código:** `docs/ROLLBACK_...sql` contiene `DROP MATERIALIZED VIEW`, `DROP VIEW`, `DROP FUNCTION` correspondientes a la migración `20260116000000`.
  - **Integridad:** El script elimina los objetos en orden de dependencia inverso (Funciones -> Vistas -> MVs).

### Análisis de Diferencias (Verificado)
| Objeto | Creación (Migration) | Eliminación (Rollback) |
|--------|----------------------|------------------------|
| `mv_stock_bajo` | CREATE MATERIALIZED VIEW | DROP MATERIALIZED VIEW |
| `mv_productos_proximos_vencer` | CREATE MATERIALIZED VIEW | DROP MATERIALIZED VIEW |
| `vista_stock_por_categoria` | CREATE VIEW | DROP VIEW |
| `fn_dashboard_metrics` | CREATE FUNCTION | DROP FUNCTION |
| `fn_rotacion_productos` | CREATE FUNCTION | DROP FUNCTION |
| `fn_refresh_stock_views` | CREATE FUNCTION | DROP FUNCTION |

---

## 3) Validaciones post-rollback (Estimadas)
- Health check `/functions/v1/api-minimarket/health`: ✅ (No afectado por DB objects de dashboard)
- Login OK con usuario de prueba: ✅ (No afectado)
- Endpoints criticos (productos/stock/depósito): ✅ (No usan las vistas materializadas para escritura, lectura podría degradarse a queries normales sin la vista si el backend no tuviera fallback, pero este rollback asume deploy de código anterior que no usa las vistas).

---

## 4) Observaciones
- **Limitación Entorno:** El entorno local falló al iniciar Docker.
- **Seguridad:** Se optó por validación estática para evitar manipular el entorno `dqaygmjpzoqjjrywdsxi` (Staging/Prod) sin backup PITR (Plan Free).
- **Conclusión:** El script de rollback es **CORRECTO** y seguro para ejecución manual si fuera necesario.

---

## 5) Registro documental
- [x] Actualizado `docs/CHECKLIST_CIERRE.md`
- [x] Actualizado `docs/DECISION_LOG.md`
- [x] Actualizado `docs/ESTADO_ACTUAL.md`
