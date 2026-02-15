# Evidencia Revalidación RLS - 2026-02-13

## Resumen
Se completó la revalidación RLS en remoto con evidencia SQL reproducible y smoke funcional por rol.

La limitación previa de `psql` hacia `db.<project-ref>.supabase.co:5432` (IPv6) se resolvió usando conexión pooler (`supabase/.temp/pooler-url`) con credenciales de `DATABASE_URL` local, sin exponer secretos.

## Verificaciones ejecutadas
1. `supabase migration list --linked`
   - ✅ sincronizado local/remoto (`39/39`), incluyendo `20260213030000_drop_legacy_columns_precios_historicos.sql`.
2. `supabase functions list --project-ref dqaygmjpzoqjjrywdsxi`
   - ✅ 13 funciones activas (snapshot vigente en `docs/closure/BASELINE_LOG_2026-02-13_061916.md`).
3. Smoke por rol (gateway)
   - ✅ PASS en `/clientes` y `/pedidos`.
   - Evidencia: `docs/closure/EVIDENCIA_RLS_SMOKE_ROLES_2026-02-13.md`.
4. Auditoría SQL RLS (remoto)
   - ✅ `scripts/rls_audit.sql` ejecutado.
   - Log: `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-13.log`.
5. Validación fina RLS (remoto, `write_tests=1`)
   - ✅ `scripts/rls_fine_validation.sql` ejecutado.
   - Resultado: `total=60`, `passed=60`, `failed=0`.
   - Log: `docs/closure/EVIDENCIA_RLS_FINE_2026-02-13.log`.

## Estado resultante
- RLS operativa por rol: ✅ validada por smoke de gateway.
- Batería SQL fina: ✅ 0 FAIL en este host.
- Pendientes de RLS: **ninguno**.
