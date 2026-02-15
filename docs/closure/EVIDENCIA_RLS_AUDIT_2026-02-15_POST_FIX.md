=============================================================
EVIDENCIA POST-FIX P0 SEGURIDAD — RLS + search_path
Fecha: 2026-02-15
Entorno: local (sin Docker — verificación estática)
=============================================================

=== MIGRACIÓN APLICADA ===
Archivo: supabase/migrations/20260215100000_p0_rls_internal_tables_and_search_path.sql

--- Contenido de la migración ---
PART 1: ALTER TABLE ... ENABLE ROW LEVEL SECURITY en:
  - public.rate_limit_state
  - public.circuit_breaker_state
  - public.cron_jobs_locks

PART 2: REVOKE ALL ... FROM anon/authenticated en las 3 tablas.
         GRANT mínimos a service_role (idempotente).

PART 3: ALTER FUNCTION public.sp_aplicar_precio(uuid, numeric, numeric)
         SET search_path = public;

=== VERIFICACIÓN ESTÁTICA (local, sin DB) ===

1. Migración contiene ENABLE ROW LEVEL SECURITY para las 3 tablas: ✅
2. Migración contiene REVOKE ALL FROM anon para las 3 tablas: ✅
3. Migración contiene REVOKE ALL FROM authenticated para las 3 tablas: ✅
4. Migración contiene ALTER FUNCTION SET search_path = public: ✅
5. Migración NO modifica el cuerpo de sp_aplicar_precio: ✅
6. Migración envuelta en BEGIN/COMMIT (transaccional): ✅
7. Rollback documentado en comentarios al final del archivo: ✅

=== VERIFICACIÓN CRUZADA CON EVIDENCIA ANTERIOR ===

Fuente: docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-13.log

Sección 3 (tablas sin RLS):
  ANTES: circuit_breaker_state ❌ DISABLED
  ANTES: cron_jobs_locks ❌ DISABLED
  ANTES: rate_limit_state ❌ DISABLED
  DESPUÉS (esperado): ✅ ENABLED (tras aplicar migración)

Sección 5 (SECURITY DEFINER sin search_path):
  ANTES: sp_aplicar_precio → ⚠️ SIN search_path (riesgo)
  DESPUÉS (esperado): search_path=public (tras aplicar migración)

Sección 6 (grants):
  ANTES: anon tiene full grants en circuit_breaker_state, cron_jobs_locks, rate_limit_state
  ANTES: authenticated tiene full grants en las mismas 3 tablas
  DESPUÉS (esperado): anon/authenticated → sin grants (REVOKE ALL aplicado)

=== NOTA: VERIFICACIÓN REMOTA PENDIENTE ===

Docker no disponible en este host (WSL2). Para verificar en la base de datos
remota, ejecutar:

  1. Aplicar migración:
     supabase db push

  2. Re-ejecutar auditoría RLS:
     psql "$DATABASE_URL" -f scripts/rls_audit.sql > docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-15_REMOTO.log

  3. Resultado esperado:
     - Sección 1: las 3 tablas aparecen con ✅ ENABLED
     - Sección 3: las 3 tablas ya NO aparecen (lista vacía o sin ellas)
     - Sección 5: sp_aplicar_precio muestra search_path=public
     - Sección 6: anon/authenticated ya NO tienen grants en las 3 tablas

=============================================================
FIN DE EVIDENCIA
=============================================================
