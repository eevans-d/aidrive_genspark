# 🧩 Rollback SQL Template (staging)

**Objetivo:** servir de guía para crear un rollback manual seguro cuando no hay PITR disponible.

---

## 1) Cómo usar este template
1. Identifica la migración a revertir (timestamp + nombre en `supabase/migrations/`).
2. Copia este template y reemplaza los bloques con SQL inverso real.
3. Ejecuta en **Supabase SQL Editor** (staging).
4. Verifica schema/constraints/RLS.

---

## 2) Plantilla base

```sql
-- ROLLBACK MANUAL (STAGING)
-- Migration target: YYYYMMDDHHMMSS_nombre_migracion.sql
-- Fecha rollback: YYYY-MM-DD

BEGIN;

-- === EJEMPLOS DE REVERSA (ajustar a tu migración) ===
-- DROP TABLE / COLUMN
-- ALTER TABLE public.tabla DROP COLUMN IF EXISTS columna_nueva;

-- RENAME (revert rename)
-- ALTER TABLE public.tabla RENAME COLUMN nuevo_nombre TO nombre_anterior;

-- DROP INDEX
-- DROP INDEX IF EXISTS public.idx_nombre;

-- DROP POLICY (si se creó una política)
-- DROP POLICY IF EXISTS "policy_name" ON public.tabla;

-- RESTORE POLICY (si se eliminó)
-- CREATE POLICY "policy_name" ON public.tabla
--   FOR SELECT TO authenticated
--   USING (true);

-- RESTORE DATA (si corresponde)
-- INSERT INTO public.tabla (col1, col2) VALUES (...);

COMMIT;
```

---

## 3) Verificación mínima posterior
- `SELECT * FROM supabase_migrations.schema_migrations;`
- Validar tablas críticas (`productos`, `stock_deposito`, `movimientos_deposito`).
- Validar RLS en tablas P0.

---

## 4) Evidencia
Registrar en `docs/DECISION_LOG.md` y `docs/CHECKLIST_CIERRE.md`:
- timestamp
- migración revertida
- resultado

