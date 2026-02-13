# Evidencia Revalidación RLS - 2026-02-13

## Resumen
Se ejecutó revalidación de estado remoto y smoke funcional por rol.  
La ejecución SQL directa con `psql` (`scripts/rls_audit.sql` y `scripts/rls_fine_validation.sql`) quedó bloqueada en este host por conectividad IPv6 hacia `db.dqaygmjpzoqjjrywdsxi.supabase.co:5432`.

## Verificaciones ejecutadas
1. `supabase migration list --linked`:
   - ✅ sincronizado local/remoto, incluyendo `20260213030000_drop_legacy_columns_precios_historicos.sql`.
2. `supabase functions list --project-ref dqaygmjpzoqjjrywdsxi`:
   - ✅ 13 funciones activas.
3. Smoke por rol (gateway):
   - ✅ ver `docs/closure/EVIDENCIA_RLS_SMOKE_ROLES_2026-02-13.md`.

## Intentos SQL directos (bloqueados)
Comandos:
- `psql "$DATABASE_URL" -f scripts/rls_audit.sql`
- `PGOPTIONS='-c rls_fine.write_tests=1' psql "$DATABASE_URL" -f scripts/rls_fine_validation.sql`

Resultado:
- ❌ `Network is unreachable` contra `db.dqaygmjpzoqjjrywdsxi.supabase.co:5432` (IPv6).

## Estado resultante
- RLS operativa por rol: ✅ validada por smoke de gateway.
- Batería SQL directa en este host: ⚠️ pendiente por red.

## Acción pendiente
Ejecutar ambos scripts SQL desde un runner/host con salida IPv6 y adjuntar evidencia:
- `docs/closure/EVIDENCIA_RLS_AUDIT_<fecha>.log`
- `docs/closure/EVIDENCIA_RLS_FINE_<fecha>.log`
